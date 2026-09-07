import crypto from 'crypto';

export interface Ed2kLinkInfo {
  isValid: boolean;
  rawUrl: string;
  type?: 'file' | 'server' | 'serverlist' | 'nodeslist';
  fileName?: string;
  fileSize?: number;
  hash?: string; // 32 hex characters (MD4)
  aichHash?: string; // Advanced Intelligent Corruption Handling root hash
  sources?: string[];
  error?: string;
}

export class Ed2kPack {
  /**
   * Parse and validate an ed2k:// link
   * Standard format: ed2k://|file|<fileName>|<fileSize>|<fileHash>|/
   * With optional parts: ...|h=<aichHash>|sources,<ip:port>|/
   */
  public parseUrl(urlStr: string): Ed2kLinkInfo {
    const trimmed = (urlStr || '').trim();
    if (!trimmed.toLowerCase().startsWith('ed2k://')) {
      return { isValid: false, rawUrl: trimmed, error: 'Not an ed2k URI (must start with ed2k://)' };
    }

    try {
      const parts = trimmed.substring(7).split('|');
      if (parts.length < 4) {
        return { isValid: false, rawUrl: trimmed, error: 'Invalid ed2k URI structure' };
      }

      const type = parts[1]?.toLowerCase();
      if (type !== 'file') {
        return {
          isValid: true,
          rawUrl: trimmed,
          type: type as any,
          fileName: parts[2] || 'unknown'
        };
      }

      const fileName = decodeURIComponent(parts[2] || 'unknown_file');
      const fileSize = parseInt(parts[3], 10);
      const hash = parts[4]?.toUpperCase();

      if (isNaN(fileSize) || fileSize < 0) {
        return { isValid: false, rawUrl: trimmed, error: 'Invalid file size in ed2k link' };
      }

      // Hash must be 32 hex chars
      if (!hash || !/^[A-F0-9]{32}$/i.test(hash)) {
        return { isValid: false, rawUrl: trimmed, error: 'Invalid 32-character eD2k hash' };
      }

      // Parse optional parameters from subsequent parts
      let aichHash: string | undefined;
      const sources: string[] = [];

      for (let i = 5; i < parts.length; i++) {
        const p = parts[i];
        if (p.startsWith('h=')) {
          aichHash = p.substring(2);
        } else if (p.startsWith('sources,')) {
          const srcList = p.substring(8).split(',');
          sources.push(...srcList);
        }
      }

      return {
        isValid: true,
        rawUrl: trimmed,
        type: 'file',
        fileName,
        fileSize,
        hash,
        aichHash,
        sources: sources.length > 0 ? sources : undefined
      };
    } catch (err: any) {
      return { isValid: false, rawUrl: trimmed, error: err.message || 'Error parsing ed2k URI' };
    }
  }

  /**
   * Verify an eD2k file hash for a downloaded buffer or chunk array.
   * eD2k hash divides the file into 9728000 byte blocks (9500 KB), computes MD4 for each,
   * and then computes MD4 over the concatenated block hashes.
   */
  public computeEd2kHash(buffer: Buffer): string {
    const CHUNK_SIZE = 9728000;
    if (buffer.length <= CHUNK_SIZE) {
      return crypto.createHash('md4').update(buffer).digest('hex').toUpperCase();
    }

    const chunkHashes: Buffer[] = [];
    let offset = 0;
    while (offset < buffer.length) {
      const end = Math.min(offset + CHUNK_SIZE, buffer.length);
      const chunk = buffer.subarray(offset, end);
      const h = crypto.createHash('md4').update(chunk).digest();
      chunkHashes.push(h);
      offset = end;
    }

    const combined = Buffer.concat(chunkHashes);
    return crypto.createHash('md4').update(combined).digest('hex').toUpperCase();
  }

  /**
   * Convert eD2k file details into an interoperable task payload
   */
  public createDownloadJob(urlStr: string): {
    title: string;
    size: number;
    hash: string;
    protocol: string;
    url: string;
  } {
    const info = this.parseUrl(urlStr);
    if (!info.isValid || !info.fileName || !info.hash) {
      throw new Error(info.error || 'Invalid eD2k URI');
    }

    return {
      title: info.fileName,
      size: info.fileSize || 0,
      hash: info.hash,
      protocol: 'ed2k',
      url: info.rawUrl
    };
  }
}
