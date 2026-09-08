import os
import json
import httpx
from typing import Dict, Any, Optional, List

class AccountManager:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_dir = os.path.abspath(os.path.join(self.base_dir, '..', 'data'))
        self.accounts_file = os.path.join(self.data_dir, 'accounts.json')
        self.accounts: Dict[str, Any] = {}
        self.load_accounts()

    def load_accounts(self) -> None:
        try:
            if not os.path.exists(self.data_dir):
                os.makedirs(self.data_dir, exist_ok=True)
            if os.path.isfile(self.accounts_file):
                with open(self.accounts_file, 'r', encoding='utf-8') as f:
                    self.accounts = json.load(f)
            else:
                self.accounts = {}
        except Exception:
            self.accounts = {}

    def save_accounts(self) -> None:
        try:
            if not os.path.exists(self.data_dir):
                os.makedirs(self.data_dir, exist_ok=True)
            with open(self.accounts_file, 'w', encoding='utf-8') as f:
                json.dump(self.accounts, f, indent=2)
        except Exception:
            pass

    def set_account(self, account: Dict[str, Any]) -> None:
        provider = account.get('provider')
        if provider:
            self.accounts[provider] = account
            self.save_accounts()

    def remove_account(self, provider: str) -> None:
        if provider in self.accounts:
            del self.accounts[provider]
            self.save_accounts()

    def get_account(self, provider: str) -> Optional[Dict[str, Any]]:
        return self.accounts.get(provider)

    def list_accounts(self) -> List[Dict[str, Any]]:
        result = []
        for acc in self.accounts.values():
            safe_acc = dict(acc)
            api_key = safe_acc.get('apiKey', '')
            if api_key and len(api_key) > 8:
                safe_acc['apiKey'] = f"{api_key[:4]}...{api_key[-4:]}"
            result.append(safe_acc)
        return result

    async def verify_real_debrid(self, api_key: str) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(
                    'https://api.real-debrid.com/rest/1.0/user',
                    headers={'Authorization': f'Bearer {api_key}'}
                )
                if res.status_code != 200:
                    return {'success': False, 'error': f'Real-Debrid verification failed: HTTP {res.status_code}'}
                data = res.json()
                account = {
                    'provider': 'real_debrid',
                    'apiKey': api_key,
                    'username': data.get('username'),
                    'status': 'active' if data.get('type') == 'premium' else 'expired',
                    'expiresAt': data.get('expiration'),
                    'points': data.get('points')
                }
                self.set_account(account)
                return {
                    'success': True,
                    'username': data.get('username'),
                    'expiresAt': data.get('expiration')
                }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    async def unrestrict(self, link: str) -> Dict[str, Any]:
        acc = self.get_account('real_debrid')
        if not acc or not acc.get('apiKey') or acc.get('status') != 'active':
            return {'success': False, 'error': 'No active Real-Debrid account available.'}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    'https://api.real-debrid.com/rest/1.0/unrestrict/link',
                    headers={'Authorization': f"Bearer {acc['apiKey']}"},
                    data={'link': link}
                )
                if res.status_code != 200:
                    return {'success': False, 'error': f'Debrid unrestrict failed: HTTP {res.status_code}'}
                data = res.json()
                return {
                    'success': True,
                    'directUrl': data.get('download'),
                    'fileName': data.get('filename'),
                    'fileSize': data.get('filesize')
                }
        except Exception as e:
            return {'success': False, 'error': str(e)}

account_manager = AccountManager()
