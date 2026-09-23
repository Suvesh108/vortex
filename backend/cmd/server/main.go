package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"syscall"
	"time"

	"vortex-engine/pkg/router"
)

func main() {
	portStr := os.Getenv("PORT")
	port := 5001
	if portStr != "" {
		if p, err := strconv.Atoi(portStr); err == nil {
			port = p
		}
	}

	sidecarPort := 5002
	if pStr := os.Getenv("SIDECAR_PORT"); pStr != "" {
		if p, err := strconv.Atoi(pStr); err == nil {
			sidecarPort = p
		}
	}

	baseDir, _ := os.Getwd()
	tempDir := filepath.Join(baseDir, "temp_downloads")
	_ = os.MkdirAll(tempDir, 0755)

	extractorScript := filepath.Join(baseDir, "extractor", "extractor_service.py")
	if !fileExists(extractorScript) {
		extractorScript = filepath.Join(baseDir, "backend", "extractor", "extractor_service.py")
	}

	staticDist := filepath.Join(baseDir, "..", "frontend", "dist")
	if !dirExists(staticDist) {
		staticDist = filepath.Join(baseDir, "dist")
	}

	cfg := router.Config{
		TempDir:        tempDir,
		SidecarPort:    sidecarPort,
		PythonScript:   extractorScript,
		StaticDistPath: staticDist,
	}

	srv := router.NewServer(cfg)

	// Context for graceful shutdown
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	// Launch Python Extractor Sidecar in background
	sidecarClient := srv.GetSidecar()
	go func() {
		fmt.Printf(">> Spawning Python Extractor Sidecar on 127.0.0.1:%d...\n", sidecarPort)
		if err := sidecarClient.StartProcess(ctx, extractorScript); err != nil {
			fmt.Printf("[WARNING] Could not auto-spawn Python sidecar: %v\n", err)
			fmt.Println(">> (Ensure python and requirements in backend/extractor/ are installed)")
		}
	}()

	httpServer := &http.Server{
		Addr:    fmt.Sprintf("0.0.0.0:%d", port),
		Handler: srv,
	}

	go func() {
		fmt.Printf("\n=======================================================\n")
		fmt.Printf("⚡ Vortex Universal Super-Engine (Hybrid Go Core)\n")
		fmt.Printf(">> Gateway & High-Speed Downloader on http://localhost:%d\n", port)
		fmt.Printf(">> aria2 JSON-RPC endpoint on http://localhost:%d/jsonrpc\n", port)
		fmt.Printf(">> Python Extractor Sidecar on http://localhost:%d\n", sidecarPort)
		fmt.Printf("=======================================================\n\n")

		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Printf("[FATAL] HTTP server failed: %v\n", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	fmt.Println("\n>> Shutting down Vortex Universal Super-Engine...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	_ = httpServer.Shutdown(shutdownCtx)
	sidecarClient.Stop()
	fmt.Println(">> Engine stopped cleanly.")
}

func fileExists(p string) bool {
	fi, err := os.Stat(p)
	return err == nil && !fi.IsDir()
}

func dirExists(p string) bool {
	fi, err := os.Stat(p)
	return err == nil && fi.IsDir()
}
