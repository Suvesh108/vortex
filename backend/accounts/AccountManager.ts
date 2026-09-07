import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DebridAccount {
  provider: 'real_debrid' | 'all_debrid' | 'torbox' | 'custom';
  apiKey: string;
  username?: string;
  status: 'active' | 'invalid' | 'expired' | 'unverified';
  expiresAt?: string;
  points?: number;
}

export interface UnrestrictResult {
  success: boolean;
  directUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export class AccountManager {
  private dataDir: string;
  private accountsFile: string;
  private accounts: Record<string, DebridAccount> = {};

  constructor() {
    this.dataDir = path.resolve(__dirname, '../data');
    this.accountsFile = path.join(this.dataDir, 'accounts.json');
    this.loadAccounts();
  }

  private loadAccounts(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.accountsFile)) {
        const raw = fs.readFileSync(this.accountsFile, 'utf-8');
        this.accounts = JSON.parse(raw);
      }
    } catch (_) {
      this.accounts = {};
    }
  }

  private saveAccounts(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.accountsFile, JSON.stringify(this.accounts, null, 2), 'utf-8');
    } catch (_) {}
  }

  public setAccount(account: DebridAccount): void {
    this.accounts[account.provider] = account;
    this.saveAccounts();
  }

  public removeAccount(provider: string): void {
    delete this.accounts[provider];
    this.saveAccounts();
  }

  public getAccount(provider: string): DebridAccount | undefined {
    return this.accounts[provider];
  }

  public listAccounts(): DebridAccount[] {
    return Object.values(this.accounts).map((acc) => ({
      ...acc,
      apiKey: acc.apiKey ? `${acc.apiKey.substring(0, 4)}...${acc.apiKey.slice(-4)}` : ''
    }));
  }

  /**
   * Verify Real-Debrid API Key and update status
   */
  public async verifyRealDebrid(apiKey: string): Promise<{ success: boolean; username?: string; expiresAt?: string; error?: string }> {
    try {
      const res = await fetch('https://api.real-debrid.com/rest/1.0/user', {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      if (!res.ok) {
        return { success: false, error: `Real-Debrid verification failed: HTTP ${res.status}` };
      }
      const data = await res.json();
      const account: DebridAccount = {
        provider: 'real_debrid',
        apiKey,
        username: data.username,
        status: data.type === 'premium' ? 'active' : 'expired',
        expiresAt: data.expiration,
        points: data.points
      };
      this.setAccount(account);
      return {
        success: true,
        username: data.username,
        expiresAt: data.expiration
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error verifying Real-Debrid' };
    }
  }

  /**
   * Attempt to unrestrict a target URL using configured debrid accounts.
   */
  public async unrestrict(targetUrl: string): Promise<UnrestrictResult> {
    const rd = this.accounts['real_debrid'];
    if (rd && rd.apiKey) {
      try {
        const formData = new URLSearchParams();
        formData.append('link', targetUrl);

        const res = await fetch('https://api.real-debrid.com/rest/1.0/unrestrict/link', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${rd.apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString()
        });

        if (res.ok) {
          const data = await res.json();
          if (data.download) {
            return {
              success: true,
              directUrl: data.download,
              fileName: data.filename,
              fileSize: data.filesize
            };
          }
        }
      } catch (_) {}
    }

    return { success: false, error: 'No active debrid resolver matched this link.' };
  }
}

export const accountManager = new AccountManager();
