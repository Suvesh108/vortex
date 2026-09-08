import os
import time
import asyncio
import httpx
from typing import Callable, Optional, Dict, Any, List

def format_speed(bps: float) -> str:
    if bps <= 0:
        return '0.0 MB/s'
    for unit in ['B/s', 'KB/s', 'MB/s', 'GB/s']:
        if bps < 1024.0:
            return f"{bps:.1f} {unit}"
        bps /= 1024.0
    return f"{bps:.1f} TB/s"

def format_eta(seconds: float) -> str:
    if not seconds or seconds <= 0 or seconds > 86400:
        return '--'
    if seconds < 60:
        return f"{int(seconds)}s"
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m}m {s}s"

class SegmentedDownloader:
    def __init__(
        self,
        url: str,
        output_path: str,
        threads: int = 16,
        on_progress: Optional[Callable[[Dict[str, Any]], None]] = None
    ):
        self.url = url
        self.output_path = os.path.abspath(output_path)
        self.threads = max(1, min(threads, 32))
        self.on_progress = on_progress
        self.is_cancelled = False
        self.total_bytes = 0
        self.downloaded_bytes = 0
        self.chunks: List[Dict[str, Any]] = []
        self.lock = asyncio.Lock()
        self.last_time = time.time()
        self.last_downloaded = 0
        self.speed_bps = 0.0

    def cancel(self):
        self.is_cancelled = True

    async def _emit_progress(self, status: str = 'downloading', error: Optional[str] = None):
        if not self.on_progress:
            return

        now = time.time()
        elapsed = now - self.last_time
        if elapsed >= 0.3 or status != 'downloading':
            diff = self.downloaded_bytes - self.last_downloaded
            self.speed_bps = diff / elapsed if elapsed > 0 else 0.0
            self.last_time = now
            self.last_downloaded = self.downloaded_bytes

        percent = int((self.downloaded_bytes / self.total_bytes) * 100) if self.total_bytes > 0 else 0
        rem_bytes = max(0, self.total_bytes - self.downloaded_bytes)
        eta_s = rem_bytes / self.speed_bps if self.speed_bps > 0 else 0

        p = {
            'totalBytes': self.total_bytes,
            'downloadedBytes': self.downloaded_bytes,
            'percent': 100 if status == 'completed' else percent,
            'speed': format_speed(self.speed_bps),
            'speedBytesPerSec': self.speed_bps,
            'eta': format_eta(eta_s) if status == 'downloading' else '--',
            'chunks': self.chunks,
            'status': status
        }
        if error:
            p['error'] = error

        self.on_progress(p)

    async def start(self) -> str:
        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
            'Accept': '*/*'
        }

        # 1. Probe URL for size and range support
        supports_ranges = False
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            try:
                head_res = await client.head(self.url, headers=headers)
                self.total_bytes = int(head_res.headers.get('content-length', 0))
                supports_ranges = head_res.headers.get('accept-ranges') == 'bytes'
            except Exception:
                pass

            if self.total_bytes <= 0:
                try:
                    range_res = await client.get(self.url, headers={**headers, 'Range': 'bytes=0-0'})
                    cr = range_res.headers.get('content-range', '')
                    if '/' in cr:
                        self.total_bytes = int(cr.split('/')[-1])
                        supports_ranges = True
                except Exception:
                    pass

        # 2. If ranges unsupported or unknown size, single-stream download
        if not supports_ranges or self.total_bytes <= 0:
            return await self._download_single()

        # 3. Partition file into chunks
        chunk_size = self.total_bytes // self.threads
        self.chunks = []
        for i in range(self.threads):
            start = i * chunk_size
            end = (self.total_bytes - 1) if (i == self.threads - 1) else (start + chunk_size - 1)
            total = end - start + 1
            self.chunks.append({
                'index': i,
                'start': start,
                'end': end,
                'current': 0,
                'total': total,
                'percent': 0,
                'status': 'idle'
            })

        # Pre-create output file
        with open(self.output_path, 'wb') as f:
            f.seek(self.total_bytes - 1)
            f.write(b'\0')

        self.last_time = time.time()
        self.last_downloaded = 0
        await self._emit_progress('downloading')

        # 4. Download chunks concurrently
        limits = httpx.Limits(max_keepalive_connections=self.threads, max_connections=self.threads)
        async with httpx.AsyncClient(timeout=60.0, limits=limits, follow_redirects=True) as client:
            tasks = [self._download_chunk(client, chunk) for chunk in self.chunks]
            await asyncio.gather(*tasks)

        if self.is_cancelled:
            await self._emit_progress('error', 'Download cancelled')
            raise Exception("Download cancelled")

        await self._emit_progress('completed')
        return self.output_path

    async def _download_chunk(self, client: httpx.AsyncClient, chunk: Dict[str, Any]):
        if self.is_cancelled:
            return

        chunk['status'] = 'downloading'
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Range': f"bytes={chunk['start']}-{chunk['end']}",
            'Accept': '*/*'
        }

        try:
            async with client.stream('GET', self.url, headers=headers) as response:
                if response.status_code not in (200, 206):
                    raise Exception(f"HTTP {response.status_code}")

                # Open file in r+b mode for in-place writing
                with open(self.output_path, 'r+b') as f:
                    f.seek(chunk['start'] + chunk['current'])
                    async for part in response.aiter_bytes(chunk_size=64 * 1024):
                        if self.is_cancelled:
                            break
                        f.write(part)
                        part_len = len(part)
                        chunk['current'] += part_len
                        chunk['percent'] = int((chunk['current'] / chunk['total']) * 100)
                        async with self.lock:
                            self.downloaded_bytes += part_len
                        await self._emit_progress('downloading')

            chunk['status'] = 'completed'
        except Exception as e:
            chunk['status'] = 'error'
            raise e

    async def _download_single(self) -> str:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        self.chunks = [{
            'index': 0,
            'start': 0,
            'end': self.total_bytes,
            'current': 0,
            'total': self.total_bytes,
            'percent': 0,
            'status': 'downloading'
        }]

        async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
            async with client.stream('GET', self.url, headers=headers) as response:
                with open(self.output_path, 'wb') as f:
                    async for part in response.aiter_bytes(chunk_size=64 * 1024):
                        if self.is_cancelled:
                            raise Exception("Download cancelled")
                        f.write(part)
                        part_len = len(part)
                        self.downloaded_bytes += part_len
                        self.chunks[0]['current'] = self.downloaded_bytes
                        if self.total_bytes > 0:
                            self.chunks[0]['percent'] = int((self.downloaded_bytes / self.total_bytes) * 100)
                        await self._emit_progress('downloading')

        await self._emit_progress('completed')
        return self.output_path
