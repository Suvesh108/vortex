package sniffer

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"regexp"
	"strings"
	"time"
)

// SniffedMedia represents video/audio discovered on an arbitrary web page
type SniffedMedia struct {
	Title       string        `json:"title"`
	Duration    string        `json:"duration"`
	Creator     string        `json:"creator"`
	Thumbnail   string        `json:"thumbnail"`
	OriginalURL string        `json:"originalUrl"`
	Category    string        `json:"category"`
	Formats     []MediaFormat `json:"formats"`
}

// MediaFormat holds extracted stream quality
type MediaFormat struct {
	ID              string `json:"id"`
	Format          string `json:"format"`
	Resolution      string `json:"resolution"`
	Size            string `json:"size"`
	Bitrate         string `json:"bitrate"`
	DirectURL       string `json:"directUrl"`
	TargetExtension string `json:"targetExtension"`
}

var (
	m3u8Regex     = regexp.MustCompile(`https?://[^\s"'<>\\]+?\.m3u8(?:\?[^\s"'<>\\]*)?`)
	mpdRegex      = regexp.MustCompile(`https?://[^\s"'<>\\]+?\.mpd(?:\?[^\s"'<>\\]*)?`)
	mp4Regex      = regexp.MustCompile(`https?://[^\s"'<>\\]+?\.mp4(?:\?[^\s"'<>\\]*)?`)
	videoSrcRegex = regexp.MustCompile(`(?i)<(?:video|source|embed)[^>]+src=["']([^"']+)["']`)
	ogVideoRegex  = regexp.MustCompile(`(?i)<meta\s+(?:property|name)=["'](?:og:video|og:video:url|twitter:player:stream)["']\s+content=["']([^"']+)["']`)
	ogTitleRegex  = regexp.MustCompile(`(?i)<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']`)
	ogImageRegex  = regexp.MustCompile(`(?i)<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']`)
	titleTagRegex = regexp.MustCompile(`(?i)<title[^>]*>([^<]+)</title>`)
)

// SniffWebPage extracts media streams from arbitrary HTML web pages
func SniffWebPage(targetURL string) (*SniffedMedia, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", targetURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Sec-CH-UA", `"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"`)
	req.Header.Set("Sec-CH-UA-Mobile", "?0")
	req.Header.Set("Sec-CH-UA-Platform", `"Windows"`)
	req.Header.Set("Upgrade-Insecure-Requests", "1")
	req.Header.Set("Sec-Fetch-Site", "none")
	req.Header.Set("Sec-Fetch-Mode", "navigate")
	req.Header.Set("Sec-Fetch-User", "?1")
	req.Header.Set("Sec-Fetch-Dest", "document")

	jar, _ := cookiejar.New(nil)
	client := &http.Client{
		Jar:     jar,
		Timeout: 12 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(io.LimitReader(resp.Body, 2*1024*1024)) // Read first 2MB
	if err != nil {
		return nil, err
	}
	html := string(bodyBytes)

	// Extract Title
	title := "Extracted Media"
	if m := ogTitleRegex.FindStringSubmatch(html); len(m) > 1 {
		title = strings.TrimSpace(m[1])
	} else if m := titleTagRegex.FindStringSubmatch(html); len(m) > 1 {
		title = strings.TrimSpace(m[1])
	}

	// Extract Thumbnail
	thumbnail := "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=640&auto=format&fit=crop"
	if m := ogImageRegex.FindStringSubmatch(html); len(m) > 1 {
		thumbnail = m[1]
	}

	baseURL, _ := url.Parse(targetURL)

	resolveURL := func(raw string) string {
		raw = strings.TrimSpace(raw)
		if strings.HasPrefix(raw, "//") {
			return "https:" + raw
		}
		if strings.HasPrefix(raw, "http://") || strings.HasPrefix(raw, "https://") {
			return raw
		}
		if baseURL != nil {
			rel, rErr := url.Parse(raw)
			if rErr == nil {
				return baseURL.ResolveReference(rel).String()
			}
		}
		return raw
	}

	discoveredStreams := make(map[string]string) // url -> type

	// 1. Check OpenGraph / Twitter video tag
	for _, m := range ogVideoRegex.FindAllStringSubmatch(html, -1) {
		if len(m) > 1 {
			u := resolveURL(m[1])
			discoveredStreams[u] = "MP4"
		}
	}

	// 2. Check HTML5 <video> / <source> tags
	for _, m := range videoSrcRegex.FindAllStringSubmatch(html, -1) {
		if len(m) > 1 {
			u := resolveURL(m[1])
			if strings.Contains(u, ".m3u8") {
				discoveredStreams[u] = "HLS"
			} else if strings.Contains(u, ".mpd") {
				discoveredStreams[u] = "DASH"
			} else if strings.Contains(u, ".mp4") || strings.Contains(u, ".webm") || strings.Contains(u, ".mkv") {
				discoveredStreams[u] = "MP4"
			}
		}
	}

	// 3. Scan for embedded m3u8 playlist URLs
	for _, u := range m3u8Regex.FindAllString(html, -1) {
		discoveredStreams[u] = "HLS"
	}

	// 4. Scan for embedded mpd DASH manifests
	for _, u := range mpdRegex.FindAllString(html, -1) {
		discoveredStreams[u] = "DASH"
	}

	// 5. Scan for embedded direct MP4s
	for _, u := range mp4Regex.FindAllString(html, -1) {
		if !strings.Contains(u, "thumb") && !strings.Contains(u, "preview") {
			discoveredStreams[u] = "MP4"
		}
	}

	if len(discoveredStreams) == 0 {
		return nil, fmt.Errorf("no media stream found on page")
	}

	formats := make([]MediaFormat, 0, len(discoveredStreams))
	idx := 1
	for streamURL, streamType := range discoveredStreams {
		targetExt := "mp4"
		resLabel := "1080p FHD (Stream)"
		if streamType == "HLS" {
			resLabel = "Adaptive HLS (m3u8)"
		} else if streamType == "DASH" {
			resLabel = "Adaptive DASH (mpd)"
		}

		formats = append(formats, MediaFormat{
			ID:              fmt.Sprintf("sniffed-%d", idx),
			Format:          streamType,
			Resolution:      resLabel,
			Size:            "Adaptive Stream",
			Bitrate:         "Max Available",
			DirectURL:       streamURL,
			TargetExtension: targetExt,
		})
		idx++
		if idx > 6 {
			break
		}
	}

	domain := "Web Portal"
	if baseURL != nil {
		domain = baseURL.Hostname()
	}

	return &SniffedMedia{
		Title:       title,
		Duration:    "Live / Web Stream",
		Creator:     domain,
		Thumbnail:   thumbnail,
		OriginalURL: targetURL,
		Category:    "VIDEO",
		Formats:     formats,
	}, nil
}
