package sidecar

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"
)

// MediaMetadata represents yt-dlp extracted metadata
type MediaMetadata struct {
	Title       string        `json:"title"`
	Duration    string        `json:"duration"`
	Creator     string        `json:"creator"`
	Thumbnail   string        `json:"thumbnail"`
	OriginalURL string        `json:"originalUrl"`
	Formats     []MediaFormat `json:"formats"`
	IsLive      bool          `json:"isLive"`
}

// MediaFormat represents an individual audio/video stream format
type MediaFormat struct {
	ID              string `json:"id"`
	Format          string `json:"format"`
	Resolution      string `json:"resolution"`
	Size            string `json:"size"`
	Bitrate         string `json:"bitrate"`
	DirectURL       string `json:"directUrl,omitempty"`
	TargetExtension string `json:"targetExtension"`
}

// Client manages communication with the Python extractor microservice
type Client struct {
	BaseURL    string
	cmd        *exec.Cmd
	cmdMu      sync.Mutex
	httpClient *http.Client
}

// NewClient initializes the sidecar client
func NewClient(port int) *Client {
	return &Client{
		BaseURL: fmt.Sprintf("http://127.0.0.1:%d", port),
		httpClient: &http.Client{
			Timeout: 45 * time.Second,
		},
	}
}

// StartProcess spawns the Python sidecar if not already running
func (c *Client) StartProcess(ctx context.Context, scriptPath string) error {
	// First check if already alive
	if c.IsHealthy() {
		fmt.Println(">> Python Extractor Sidecar is already running.")
		return nil
	}

	c.cmdMu.Lock()
	defer c.cmdMu.Unlock()

	pythonExe := "python"
	if p := os.Getenv("PYTHON_PATH"); p != "" {
		pythonExe = p
	}

	absScript, err := filepath.Abs(scriptPath)
	if err != nil {
		return err
	}

	cmd := exec.CommandContext(ctx, pythonExe, absScript)
	cmd.Dir = filepath.Dir(absScript)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start python extractor: %w", err)
	}
	c.cmd = cmd

	// Wait up to 10 seconds for sidecar to become healthy
	for i := 0; i < 20; i++ {
		time.Sleep(500 * time.Millisecond)
		if c.IsHealthy() {
			fmt.Println(">> Python Extractor Sidecar healthy on", c.BaseURL)
			return nil
		}
	}

	return fmt.Errorf("python extractor sidecar did not become healthy in time")
}

// Stop terminates the sidecar process
func (c *Client) Stop() {
	c.cmdMu.Lock()
	defer c.cmdMu.Unlock()
	if c.cmd != nil && c.cmd.Process != nil {
		_ = c.cmd.Process.Kill()
	}
}

// IsHealthy pings the sidecar health check endpoint
func (c *Client) IsHealthy() bool {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", c.BaseURL+"/health", nil)
	if err != nil {
		return false
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}

// Extract asks Python yt-dlp to extract video metadata
func (c *Client) Extract(targetURL string) (*MediaMetadata, error) {
	payload := map[string]string{"url": targetURL}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Post(c.BaseURL+"/extract", "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("sidecar connection failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errData map[string]interface{}
		_ = json.NewDecoder(resp.Body).Decode(&errData)
		detail, _ := errData["detail"].(string)
		if detail == "" {
			detail = fmt.Sprintf("HTTP %d", resp.StatusCode)
		}
		return nil, fmt.Errorf("%s", detail)
	}

	var meta MediaMetadata
	if err := json.NewDecoder(resp.Body).Decode(&meta); err != nil {
		return nil, err
	}

	return &meta, nil
}

// DownloadStream asks Python sidecar to download and multiplex a stream with live progress updates
func (c *Client) DownloadStream(jobID, targetURL, formatID, outputPath string, onProgress func(percent int, speed, eta string)) error {
	payload := map[string]string{
		"jobId":      jobID,
		"url":        targetURL,
		"formatId":   formatID,
		"outputPath": outputPath,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	// Long timeout for streaming downloads
	client := &http.Client{Timeout: 30 * time.Minute}
	resp, err := client.Post(c.BaseURL+"/download-stream", "application/json", bytes.NewReader(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errData map[string]interface{}
		_ = json.NewDecoder(resp.Body).Decode(&errData)
		detail, _ := errData["detail"].(string)
		if detail == "" {
			detail = fmt.Sprintf("HTTP %d", resp.StatusCode)
		}
		return fmt.Errorf("%s", detail)
	}

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Bytes()
		var update struct {
			Percent int    `json:"percent"`
			Speed   string `json:"speed"`
			Eta     string `json:"eta"`
			Status  string `json:"status"`
			Error   string `json:"error"`
		}
		if uErr := json.Unmarshal(line, &update); uErr == nil {
			if update.Error != "" {
				return fmt.Errorf("%s", update.Error)
			}
			if onProgress != nil {
				onProgress(update.Percent, update.Speed, update.Eta)
			}
		}
	}

	if err := scanner.Err(); err != nil {
		return err
	}

	return nil
}
