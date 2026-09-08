import re
import httpx
from urllib.parse import urlparse
from typing import Dict, Any, Optional

class HuggingFacePack:
    def parse_url(self, raw_url: str) -> Dict[str, Any]:
        parsed = urlparse(raw_url)
        hostname = (parsed.hostname or '').lower()

        if hostname != 'huggingface.co' and hostname != 'hf.co':
            return {'isHuggingFace': False}

        path = parsed.path.strip('/')
        parts = path.split('/')

        if len(parts) < 2:
            return {'isHuggingFace': False}

        # Resolve direct resolve URL
        # e.g. /TheBloke/Llama-2-7B-GGUF/resolve/main/llama-2-7b.Q4_K_M.gguf
        if 'resolve' in parts:
            idx = parts.index('resolve')
            model_id = "/".join(parts[:idx])
            revision = parts[idx + 1] if idx + 1 < len(parts) else 'main'
            file_path = "/".join(parts[idx + 2:])
            return {
                'isHuggingFace': True,
                'isDirectFile': True,
                'modelId': model_id,
                'revision': revision,
                'filePath': file_path,
                'directUrl': raw_url
            }

        # Repository URL
        model_id = f"{parts[0]}/{parts[1]}"
        return {
            'isHuggingFace': True,
            'isDirectFile': False,
            'modelId': model_id,
            'revision': 'main'
        }

    async def inspect_model(self, model_id: str, revision: str = 'main') -> Dict[str, Any]:
        api_url = f"https://huggingface.co/api/models/{model_id}"
        headers = {'User-Agent': 'VortexDownloader/0.6.1'}

        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(api_url, headers=headers)
            if res.status_code != 200:
                raise Exception(f"Hugging Face API error: HTTP {res.status_code}")
            data = res.json()

            siblings = []
            for s in data.get('siblings', []):
                fn = s.get('rfilename')
                if fn:
                    siblings.append({
                        'rfilename': fn,
                        'downloadUrl': f"https://huggingface.co/{model_id}/resolve/{revision}/{fn}"
                    })

            return {
                'id': data.get('id'),
                'author': data.get('author'),
                'downloads': data.get('downloads', 0),
                'likes': data.get('likes', 0),
                'pipeline_tag': data.get('pipeline_tag'),
                'files': siblings
            }
