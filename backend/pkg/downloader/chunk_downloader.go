package downloader

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

// Chunk represents an individual parallel range worker partition
type Chunk struct {
	Index   int    `json:"index"`
	Start   int64  `json:"start"`
	End     int64  `json:"end"`
	Current int64  `json:"current"`
	Total   int64  `json:"total"`
	Percent int    `json:"percent"`
	Status  string `json:"status"`
}

// Progress tracks the live state of a segmented download
type Progress struct {
	TotalBytes       int64   `json:"totalBytes"`
	DownloadedBytes  int64   `json:"downloadedBytes"`
	Percent          int     `json:"percent"`
	Speed            string  `json:"speed"`
	SpeedBytesPerSec float64 `json:"speedBytesPerSec"`
	Eta              string  `json:"eta"`
	Chunks           []Chunk `json:"chunks"`
	Status           string  `json:"status"`
	Error            string  `json:"error,omitempty"`
}

var bufPool = sync.Pool{
	New: func() interface{} {
		buf := make([]byte, 1024*1024) // 1MB buffer
		return &buf
	},
}

// SegmentedDownloader handles turbo multi-connection downloads
type SegmentedDownloader struct {
	URL             string
	OutputPath      string
	Threads         int
	TotalBytes      int64
	DownloadedBytes int64
	Status          string
	Error           error

	chunks   []Chunk
	chunkMu  sync.RWMutex
	client   *http.Client
	ctx      context.Context
	cancel   context.CancelFunc
	onUpdate func(p Progress)

	lastTime        time.Time
	lastDownloaded  int64
	currentSpeedBps float64
}

// NewSegmentedDownloader initializes a downloader
func NewSegmentedDownloader(url, outputPath string, threads int, onUpdate func(p Progress)) *SegmentedDownloader {
	if threads <= 0 {
		threads = 16
	}
	if threads > 32 {
		threads = 32
	}

	ctx, cancel := context.WithCancel(context.Background())

	return &SegmentedDownloader{
		URL:        url,
		OutputPath: outputPath,
		Threads:    threads,
		client: &http.Client{
			Timeout: 0, // Streaming requests manage their own context timeout
		},
		ctx:      ctx,
		cancel:   cancel,
		onUpdate: onUpdate,
		Status:   "idle",
		lastTime: time.Now(),
	}
}

// Cancel terminates download execution
func (d *SegmentedDownloader) Cancel() {
	d.cancel()
	d.Status = "cancelled"
}

// FormatSpeed converts bps into human readable speed
func FormatSpeed(bps float64) string {
	if bps <= 0 {
		return "0.0 MB/s"
	}
	units := []string{"B/s", "KB/s", "MB/s", "GB/s", "TB/s"}
	val := bps
	for _, unit := range units {
		if val < 1024.0 {
			return fmt.Sprintf("%.1f %s", val, unit)
		}
		val /= 1024.0
	}
	return fmt.Sprintf("%.1f TB/s", val)
}

// FormatEta converts remaining seconds into human readable string
func FormatEta(sec float64) string {
	if sec <= 0 || sec > 86400 {
		return "--"
	}
	if sec < 60 {
		return fmt.Sprintf("%ds", int(sec))
	}
	m := int(sec / 60)
	s := int(sec) % 60
	return fmt.Sprintf("%dm %ds", m, s)
}

func (d *SegmentedDownloader) emitProgress(status string, errMsg string) {
	if d.onUpdate == nil {
		return
	}

	now := time.Now()
	elapsed := now.Sub(d.lastTime).Seconds()
	downloaded := atomic.LoadInt64(&d.DownloadedBytes)

	if elapsed >= 0.25 || status != "downloading" {
		diff := float64(downloaded - d.lastDownloaded)
		if elapsed > 0 {
			d.currentSpeedBps = diff / elapsed
		}
		d.lastTime = now
		d.lastDownloaded = downloaded
	}

	percent := 0
	if d.TotalBytes > 0 {
		percent = int((float64(downloaded) / float64(d.TotalBytes)) * 100)
		if percent > 100 {
			percent = 100
		}
	}
	if status == "completed" {
		percent = 100
	}

	etaStr := "--"
	if status == "downloading" && d.currentSpeedBps > 0 && d.TotalBytes > downloaded {
		rem := float64(d.TotalBytes - downloaded)
		etaSec := rem / d.currentSpeedBps
		etaStr = FormatEta(etaSec)
	}

	d.chunkMu.RLock()
	copiedChunks := make([]Chunk, len(d.chunks))
	copy(copiedChunks, d.chunks)
	d.chunkMu.RUnlock()

	p := Progress{
		TotalBytes:       d.TotalBytes,
		DownloadedBytes:  downloaded,
		Percent:          percent,
		Speed:            FormatSpeed(d.currentSpeedBps),
		SpeedBytesPerSec: d.currentSpeedBps,
		Eta:              etaStr,
		Chunks:           copiedChunks,
		Status:           status,
		Error:            errMsg,
	}

	d.onUpdate(p)
}

// Start begins the segmented download process
func (d *SegmentedDownloader) Start() error {
	if err := os.MkdirAll(filepath.Dir(d.OutputPath), 0755); err != nil {
		return err
	}

	d.Status = "downloading"
	d.emitProgress("downloading", "")

	// 1. Probe URL for Content-Length and Range capability
	req, err := http.NewRequestWithContext(d.ctx, "HEAD", d.URL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "*/*")

	supportsRanges := false
	resp, err := d.client.Do(req)
	if err == nil {
		d.TotalBytes = resp.ContentLength
		if resp.Header.Get("Accept-Ranges") == "bytes" {
			supportsRanges = true
		}
		resp.Body.Close()
	}

	// Range probe fallback if HEAD did not confirm
	if d.TotalBytes <= 0 || !supportsRanges {
		probeReq, pErr := http.NewRequestWithContext(d.ctx, "GET", d.URL, nil)
		if pErr == nil {
			probeReq.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
			probeReq.Header.Set("Range", "bytes=0-0")
			pResp, pDoErr := d.client.Do(probeReq)
			if pDoErr == nil {
				cr := pResp.Header.Get("Content-Range")
				if cr != "" && strings.Contains(cr, "/") {
					parts := strings.Split(cr, "/")
					if len(parts) == 2 {
						if total, parseErr := strconv.ParseInt(parts[1], 10, 64); parseErr == nil && total > 0 {
							d.TotalBytes = total
							supportsRanges = true
						}
					}
				}
				pResp.Body.Close()
			}
		}
	}

	// 2. If range requests are unsupported or size is unknown, fallback to stream
	if !supportsRanges || d.TotalBytes <= 0 {
		return d.downloadSingleStream()
	}

	// 3. Pre-allocate target file on disk
	file, err := os.OpenFile(d.OutputPath, os.O_CREATE|os.O_RDWR, 0666)
	if err != nil {
		return err
	}
	defer file.Close()

	if err := file.Truncate(d.TotalBytes); err != nil {
		// Non-fatal if filesystem doesn't support sparse truncate
	}

	// 4. Partition total bytes across threads
	chunkSize := d.TotalBytes / int64(d.Threads)
	d.chunks = make([]Chunk, d.Threads)

	for i := 0; i < d.Threads; i++ {
		start := int64(i) * chunkSize
		end := start + chunkSize - 1
		if i == d.Threads-1 {
			end = d.TotalBytes - 1
		}
		total := end - start + 1
		d.chunks[i] = Chunk{
			Index:   i,
			Start:   start,
			End:     end,
			Current: 0,
			Total:   total,
			Percent: 0,
			Status:  "idle",
		}
	}

	d.emitProgress("downloading", "")

	// 5. Download chunks concurrently
	var wg sync.WaitGroup
	errChan := make(chan error, d.Threads)

	for i := 0; i < d.Threads; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			if dlErr := d.downloadChunk(file, idx); dlErr != nil {
				errChan <- dlErr
			}
		}(i)
	}

	wg.Wait()
	close(errChan)

	if d.ctx.Err() != nil {
		d.Status = "cancelled"
		d.emitProgress("error", "Download cancelled")
		return d.ctx.Err()
	}

	for e := range errChan {
		if e != nil {
			d.Status = "error"
			d.emitProgress("error", e.Error())
			return e
		}
	}

	d.Status = "completed"
	d.emitProgress("completed", "")
	return nil
}

func (d *SegmentedDownloader) downloadChunk(file *os.File, chunkIdx int) error {
	d.chunkMu.Lock()
	chunk := &d.chunks[chunkIdx]
	chunk.Status = "downloading"
	start := chunk.Start + chunk.Current
	end := chunk.End
	d.chunkMu.Unlock()

	if start > end {
		d.chunkMu.Lock()
		chunk.Status = "completed"
		d.chunkMu.Unlock()
		return nil
	}

	req, err := http.NewRequestWithContext(d.ctx, "GET", d.URL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36")
	req.Header.Set("Range", fmt.Sprintf("bytes=%d-%d", start, end))

	resp, err := d.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusPartialContent {
		return fmt.Errorf("HTTP error %d for chunk %d", resp.StatusCode, chunkIdx)
	}

	bufPtr := bufPool.Get().(*[]byte)
	defer bufPool.Put(bufPtr)
	buf := *bufPtr

	offset := start
	ticker := time.NewTicker(300 * time.Millisecond)
	defer ticker.Stop()

	go func() {
		for {
			select {
			case <-d.ctx.Done():
				return
			case <-ticker.C:
				d.emitProgress("downloading", "")
			}
		}
	}()

	for {
		if d.ctx.Err() != nil {
			return d.ctx.Err()
		}

		n, rErr := resp.Body.Read(buf)
		if n > 0 {
			// Thread-safe WriteAt directly to disk without locking
			if _, wErr := file.WriteAt(buf[:n], offset); wErr != nil {
				return wErr
			}
			offset += int64(n)

			atomic.AddInt64(&d.DownloadedBytes, int64(n))

			d.chunkMu.Lock()
			chunk.Current += int64(n)
			if chunk.Total > 0 {
				chunk.Percent = int((float64(chunk.Current) / float64(chunk.Total)) * 100)
			}
			d.chunkMu.Unlock()
		}

		if rErr != nil {
			if rErr == io.EOF {
				break
			}
			return rErr
		}
	}

	d.chunkMu.Lock()
	chunk.Status = "completed"
	chunk.Percent = 100
	d.chunkMu.Unlock()

	return nil
}

func (d *SegmentedDownloader) downloadSingleStream() error {
	d.chunks = []Chunk{{
		Index:   0,
		Start:   0,
		End:     d.TotalBytes,
		Current: 0,
		Total:   d.TotalBytes,
		Percent: 0,
		Status:  "downloading",
	}}

	req, err := http.NewRequestWithContext(d.ctx, "GET", d.URL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")

	resp, err := d.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	file, err := os.Create(d.OutputPath)
	if err != nil {
		return err
	}
	defer file.Close()

	bufPtr := bufPool.Get().(*[]byte)
	defer bufPool.Put(bufPtr)
	buf := *bufPtr

	ticker := time.NewTicker(300 * time.Millisecond)
	defer ticker.Stop()

	go func() {
		for {
			select {
			case <-d.ctx.Done():
				return
			case <-ticker.C:
				d.emitProgress("downloading", "")
			}
		}
	}()

	for {
		if d.ctx.Err() != nil {
			return d.ctx.Err()
		}
		n, rErr := resp.Body.Read(buf)
		if n > 0 {
			if _, wErr := file.Write(buf[:n]); wErr != nil {
				return wErr
			}
			atomic.AddInt64(&d.DownloadedBytes, int64(n))
		}
		if rErr != nil {
			if rErr == io.EOF {
				break
			}
			return rErr
		}
	}

	d.Status = "completed"
	d.emitProgress("completed", "")
	return nil
}
