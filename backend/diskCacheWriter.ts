import fs from 'fs';

interface WriteOperation {
  offset: number;
  buffer: Buffer;
}

/**
 * High-performance non-blocking asynchronous disk cache writer.
 * Batches disk I/O, prevents blocking the Node.js event loop,
 * and regulates TCP backpressure to prevent unbounded RAM usage.
 */
export class DiskCacheWriter {
  private fd: number;
  private queue: WriteOperation[] = [];
  private isProcessing = false;
  private queuedBytes = 0;
  private highWaterMark: number;
  private lowWaterMark: number;
  private isThrottling = false;
  private onPressureChange?: (paused: boolean) => void;
  private drainResolvers: Array<() => void> = [];

  constructor(
    fd: number,
    options: {
      highWaterMark?: number;
      lowWaterMark?: number;
      onPressureChange?: (paused: boolean) => void;
    } = {}
  ) {
    this.fd = fd;
    this.highWaterMark = options.highWaterMark || 16 * 1024 * 1024; // 16 MB max in-memory cache
    this.lowWaterMark = options.lowWaterMark || 4 * 1024 * 1024;   // 4 MB drain threshold
    this.onPressureChange = options.onPressureChange;
  }

  /**
   * Enqueue a buffer slice to be written at a specific file offset.
   */
  public write(offset: number, data: Buffer): void {
    this.queue.push({ offset, buffer: data });
    this.queuedBytes += data.length;

    if (!this.isThrottling && this.queuedBytes >= this.highWaterMark) {
      this.isThrottling = true;
      if (this.onPressureChange) {
        this.onPressureChange(true); // Signal network streams to pause
      }
    }

    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;

      try {
        await new Promise<void>((resolve, reject) => {
          fs.write(this.fd, item.buffer, 0, item.buffer.length, item.offset, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch (err) {
        this.isProcessing = false;
        // In case of error, notify drain resolvers to prevent indefinite hang
        while (this.drainResolvers.length > 0) {
          this.drainResolvers.shift()!();
        }
        throw err;
      }

      this.queuedBytes -= item.buffer.length;

      // Check if memory has dropped below low watermark to resume TCP streams
      if (this.isThrottling && this.queuedBytes <= this.lowWaterMark) {
        this.isThrottling = false;
        if (this.onPressureChange) {
          this.onPressureChange(false); // Signal network streams to resume
        }
      }
    }

    this.isProcessing = false;

    // If queue is completely drained, resolve any pending flush listeners
    if (this.queue.length === 0 && this.drainResolvers.length > 0) {
      const resolvers = [...this.drainResolvers];
      this.drainResolvers = [];
      resolvers.forEach((res) => res());
    }
  }

  /**
   * Flush all buffered writes to disk before closing.
   */
  public async flush(): Promise<void> {
    if (this.queue.length === 0 && !this.isProcessing) {
      return;
    }

    return new Promise<void>((resolve) => {
      this.drainResolvers.push(resolve);
      this.processQueue();
    });
  }

  public getBufferedBytes(): number {
    return this.queuedBytes;
  }
}
