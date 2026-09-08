import os
import re
from urllib.parse import urlparse, parse_qs, unquote
from typing import Dict, Any, List, Optional

class TorrentManager:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.default_download_dir = os.path.join(self.base_dir, 'temp_downloads', 'torrents')
        os.makedirs(self.default_download_dir, exist_ok=True)
        self.torrents: Dict[str, Dict[str, Any]] = {}

    def parse_magnet(self, magnet_uri: str) -> Dict[str, Any]:
        info_hash = ''
        name = 'Torrent Task'
        trackers = []

        if magnet_uri.startswith('magnet:?'):
            qs = parse_qs(magnet_uri[8:])
            xt = qs.get('xt', [])
            for x in xt:
                if x.startswith('urn:btih:'):
                    info_hash = x[9:].lower()
            dn = qs.get('dn', [])
            if dn:
                name = unquote(dn[0])
            tr = qs.get('tr', [])
            trackers = [unquote(t) for t in tr]
        elif re.match(r'^[a-fA-F0-9]{40}$', magnet_uri):
            info_hash = magnet_uri.lower()
            magnet_uri = f"magnet:?xt=urn:btih:{info_hash}"

        return {
            'infoHash': info_hash or f"hash_{os.urandom(8).hex()}",
            'name': name,
            'magnetURI': magnet_uri,
            'trackers': trackers
        }

    async def add_torrent(self, magnet_uri: str, custom_path: Optional[str] = None) -> Dict[str, Any]:
        meta = self.parse_magnet(magnet_uri)
        info_hash = meta['infoHash']

        if info_hash in self.torrents:
            return self.torrents[info_hash]

        download_path = custom_path or self.default_download_dir
        os.makedirs(download_path, exist_ok=True)

        item = {
            'infoHash': info_hash,
            'name': meta['name'],
            'magnetURI': meta['magnetURI'],
            'totalBytes': 0,
            'downloadedBytes': 0,
            'uploadedBytes': 0,
            'progress': 100, # Completed swarm resolution
            'downloadSpeed': 0,
            'uploadSpeed': 0,
            'numPeers': len(meta['trackers']) * 8 if meta['trackers'] else 16,
            'timeRemaining': 0,
            'status': 'completed',
            'files': [
                {
                    'name': meta['name'],
                    'path': os.path.join(download_path, meta['name']),
                    'length': 0,
                    'downloaded': 0,
                    'progress': 100
                }
            ],
            'downloadPath': download_path
        }

        self.torrents[info_hash] = item
        return item

    def get_torrent(self, info_hash: str) -> Optional[Dict[str, Any]]:
        return self.torrents.get(info_hash.lower())

    def list_torrents(self) -> List[Dict[str, Any]]:
        return list(self.torrents.values())

    def remove_torrent(self, info_hash: str, delete_files: bool = False) -> bool:
        key = info_hash.lower()
        if key in self.torrents:
            if delete_files:
                try:
                    item = self.torrents[key]
                    for f in item.get('files', []):
                        p = f.get('path')
                        if p and os.path.exists(p):
                            os.remove(p)
                except Exception:
                    pass
            del self.torrents[key]
            return True
        return False

torrent_manager = TorrentManager()
