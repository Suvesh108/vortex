import os
import time
from urllib.parse import urlparse, unquote
from ftplib import FTP, FTP_TLS
from typing import Callable, Optional, Dict, Any

class FtpPack:
    def __init__(self):
        self.client: Optional[FTP] = None
        self.is_cancelled = False

    def parse_url(self, raw_url: str) -> Dict[str, Any]:
        parsed = urlparse(raw_url)
        is_secure = parsed.scheme.lower() == 'ftps'
        host = parsed.hostname or ''
        port = parsed.port or (990 if is_secure else 21)
        user = unquote(parsed.username) if parsed.username else 'anonymous'
        password = unquote(parsed.password) if parsed.password else 'anonymous@vortex.app'
        file_path = unquote(parsed.path).lstrip('/')
        file_name = os.path.basename(file_path) or 'ftp_download.bin'

        return {
            'isSecure': is_secure,
            'host': host,
            'port': port,
            'user': user,
            'password': password,
            'path': file_path,
            'fileName': file_name
        }

    def cancel(self):
        self.is_cancelled = True
        if self.client:
            try:
                self.client.abort()
                self.client.close()
            except Exception:
                pass

    def download_file(
        self,
        url: str,
        destination_dir: str,
        on_progress: Optional[Callable[[Dict[str, Any]], None]] = None
    ) -> Dict[str, Any]:
        info = self.parse_url(url)
        os.makedirs(destination_dir, exist_ok=True)
        out_path = os.path.join(destination_dir, info['fileName'])

        # Connect
        ftp_cls = FTP_TLS if info['isSecure'] else FTP
        ftp = ftp_cls(timeout=15)
        self.client = ftp

        try:
            ftp.connect(info['host'], info['port'])
            ftp.login(info['user'], info['password'])
            if info['isSecure'] and isinstance(ftp, FTP_TLS):
                ftp.prot_p()

            # Get file size
            total_size = 0
            try:
                total_size = ftp.size(info['path']) or 0
            except Exception:
                total_size = 0

            downloaded = 0
            start_time = time.time()
            last_time = start_time
            last_bytes = 0

            with open(out_path, 'wb') as f:
                def handle_chunk(data: bytes):
                    nonlocal downloaded, last_time, last_bytes
                    if self.is_cancelled:
                        raise Exception("FTP Download cancelled by user.")
                    f.write(data)
                    downloaded += len(data)

                    now = time.time()
                    if on_progress and (now - last_time >= 0.5 or (total_size and downloaded == total_size)):
                        elapsed = now - last_time
                        speed_bps = (downloaded - last_bytes) / elapsed if elapsed > 0 else 0
                        last_time = now
                        last_bytes = downloaded

                        percent = int((downloaded / total_size) * 100) if total_size > 0 else 0
                        speed_mb = speed_bps / (1024 * 1024)
                        rem_bytes = max(0, total_size - downloaded)
                        eta_s = int(rem_bytes / speed_bps) if speed_bps > 0 else 0

                        on_progress({
                            'bytesDownloaded': downloaded,
                            'totalBytes': total_size,
                            'percent': percent,
                            'speed': f"{speed_mb:.1f} MB/s",
                            'eta': f"{eta_s}s" if eta_s > 0 else "--"
                        })

                ftp.retrbinary(f"RETR {info['path']}", handle_chunk, blocksize=64 * 1024)

            return {'filePath': out_path, 'bytesDownloaded': downloaded}

        finally:
            try:
                ftp.quit()
            except Exception:
                try:
                    ftp.close()
                except Exception:
                    pass
            self.client = None
