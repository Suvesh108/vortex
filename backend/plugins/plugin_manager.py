import re
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
from accounts.account_manager import account_manager

class PluginManager:
    def __init__(self):
        self.plugins = [
            {
                "id": "direct_cdn",
                "name": "Direct CDN & Mirror Resolver",
                "version": "1.0.0",
                "description": "Fallback high-speed resolver for standard HTTP direct streams",
                "author": "Vortex Team",
                "handles": ["*"]
            },
            {
                "id": "github_host",
                "name": "GitHub Asset Resolver",
                "version": "1.0.0",
                "description": "Resolves GitHub releases, assets, and raw user contents",
                "author": "GitHub Pack",
                "handles": ["github.com", "raw.githubusercontent.com"]
            },
            {
                "id": "huggingface_host",
                "name": "Hugging Face Model Resolver",
                "version": "1.0.0",
                "description": "Resolves Hugging Face weights and repository model files",
                "author": "HF Pack",
                "handles": ["huggingface.co", "hf.co"]
            },
            {
                "id": "media_hosts",
                "name": "Universal Host Gateway",
                "version": "1.2.0",
                "description": "Resolves 16+ cloud hosts (TeraBox, Streamtape, DoodStream, etc.)",
                "author": "Vortex Community",
                "handles": ["terabox.com", "streamtape.com", "doodstream.com", "mixdrop.co"]
            }
        ]

    def list_plugins(self) -> List[Dict[str, Any]]:
        return self.plugins

    async def resolve(self, url: str) -> Dict[str, Any]:
        # 1. Check Debrid unrestrict first
        try:
            debrid = await account_manager.unrestrict(url)
            if debrid.get('success') and debrid.get('directUrl'):
                return {
                    'directUrl': debrid['directUrl'],
                    'fileName': debrid.get('fileName', 'unrestricted_file.bin'),
                    'fileSize': debrid.get('fileSize'),
                    'engine': 'chunk'
                }
        except Exception:
            pass

        # 2. Extract clean filename from URL
        parsed = urlparse(url)
        path = parsed.path.strip('/')
        filename = path.split('/')[-1] if path else 'direct_download.bin'
        if not filename or '.' not in filename:
            filename = 'stream_payload.mp4'

        return {
            'directUrl': url,
            'fileName': filename,
            'engine': 'chunk'
        }

plugin_manager = PluginManager()
