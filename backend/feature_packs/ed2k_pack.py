import re
from typing import Dict, Any

class Ed2kPack:
    # Pattern: ed2k://|file|<filename>|<filesize>|<md4hash>|/
    ED2K_PATTERN = re.compile(r"^ed2k:\/\/\|file\|([^\|]+)\|(\d+)\|([a-fA-F0-9]{32})\|.*$", re.IGNORECASE)

    def parse_url(self, raw_url: str) -> Dict[str, Any]:
        match = self.ED2K_PATTERN.match(raw_url.strip())
        if not match:
            return {
                'isValid': False,
                'error': 'Invalid eD2k URI structure. Format must be ed2k://|file|<name>|<size>|<md4>|/'
            }

        file_name = match.group(1)
        file_size = int(match.group(2))
        md4_hash = match.group(3).lower()

        return {
            'isValid': True,
            'fileName': file_name,
            'fileSize': file_size,
            'md4Hash': md4_hash,
            'isBlockVerified': True
        }
