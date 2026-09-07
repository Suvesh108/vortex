import http from 'http';
import https from 'https';
import { URL } from 'url';

const AGENT_OPTIONS = {
  keepAlive: true,
  keepAliveMsecs: 60000,
  maxSockets: 64,
  maxFreeSockets: 32,
  timeout: 30000,
  scheduling: 'fifo' as const
};

export const turboHttpAgent = new http.Agent(AGENT_OPTIONS);
export const turboHttpsAgent = new https.Agent({
  ...AGENT_OPTIONS,
  maxCachedSessions: 100
});

export function tuneSocket(socket: any): void {
  if (socket && typeof socket.setNoDelay === 'function') {
    socket.setNoDelay(true); // Disable Nagle's algorithm for instant packet dispatch
  }
  if (socket && typeof socket.setKeepAlive === 'function') {
    socket.setKeepAlive(true, 15000); // 15s TCP keepalive probe
  }
}

export const STEALTH_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'identity', // Avoid compressed stream chunking errors
  'Sec-CH-UA': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
  'Sec-CH-UA-Mobile': '?0',
  'Sec-CH-UA-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1'
};

export interface ProbeResult {
  contentLength: number;
  supportsRanges: boolean;
  finalUrl: string;
  suggestedFileName?: string;
}

/**
 * Robust URL probe: Tries HEAD request first with keepAlive agent.
 * If HEAD fails (403, 405, or empty), falls back to GET Range: bytes=0-1
 * to reliably retrieve Content-Range: bytes 0-1/<totalLength>.
 */
export async function probeUrlRobust(
  targetUrl: string,
  signal?: AbortSignal,
  redirectCount = 0
): Promise<ProbeResult> {
  if (redirectCount > 10) {
    return { contentLength: 0, supportsRanges: false, finalUrl: targetUrl };
  }

  return new Promise((resolve) => {
    try {
      const parsed = new URL(targetUrl);
      const isHttps = parsed.protocol === 'https:';
      const client = isHttps ? https : http;
      const agent = isHttps ? turboHttpsAgent : turboHttpAgent;

      const req = client.request(
        targetUrl,
        {
          method: 'HEAD',
          agent,
          headers: {
            ...STEALTH_HEADERS,
            Host: parsed.host
          },
          signal
        },
        (res) => {
          // Follow HTTP redirects
          if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
            const redirectUrl = new URL(res.headers.location, targetUrl).toString();
            resolve(probeUrlRobust(redirectUrl, signal, redirectCount + 1));
            return;
          }

          // If HEAD is rejected or blocked by CDN (e.g. 403/405), fallback to Range GET probe
          if (res.statusCode && (res.statusCode >= 400 || res.statusCode === 405)) {
            resolve(probeRangeGetFallback(targetUrl, signal, redirectCount));
            return;
          }

          const contentLength = parseInt(res.headers['content-length'] || '0', 10);
          const acceptRanges = res.headers['accept-ranges'];
          const supportsRanges = acceptRanges === 'bytes' || !!res.headers['content-range'];

          let suggestedFileName: string | undefined;
          const disposition = res.headers['content-disposition'];
          if (disposition) {
            const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
            if (match && match[1]) {
              suggestedFileName = decodeURIComponent(match[1].trim());
            }
          }

          if (!supportsRanges && contentLength <= 0) {
            // Try Range GET fallback before giving up
            resolve(probeRangeGetFallback(targetUrl, signal, redirectCount));
            return;
          }

          resolve({
            contentLength: isNaN(contentLength) ? 0 : contentLength,
            supportsRanges,
            finalUrl: targetUrl,
            suggestedFileName
          });
        }
      );

      req.on('socket', tuneSocket);
      req.on('error', () => {
        resolve(probeRangeGetFallback(targetUrl, signal, redirectCount));
      });

      req.end();
    } catch (_) {
      resolve({ contentLength: 0, supportsRanges: false, finalUrl: targetUrl });
    }
  });
}

/**
 * Fallback probe using GET with Range: bytes=0-1
 * This extracts total file size from Content-Range even when servers reject HEAD.
 */
function probeRangeGetFallback(
  targetUrl: string,
  signal?: AbortSignal,
  redirectCount = 0
): Promise<ProbeResult> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(targetUrl);
      const isHttps = parsed.protocol === 'https:';
      const client = isHttps ? https : http;
      const agent = isHttps ? turboHttpsAgent : turboHttpAgent;

      const req = client.request(
        targetUrl,
        {
          method: 'GET',
          agent,
          headers: {
            ...STEALTH_HEADERS,
            Host: parsed.host,
            Range: 'bytes=0-1'
          },
          signal
        },
        (res) => {
          if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
            const redirectUrl = new URL(res.headers.location, targetUrl).toString();
            resolve(probeUrlRobust(redirectUrl, signal, redirectCount + 1));
            return;
          }

          let contentLength = 0;
          let supportsRanges = false;

          const contentRange = res.headers['content-range'];
          if (contentRange) {
            supportsRanges = true;
            const match = contentRange.match(/\/(\d+)/);
            if (match && match[1]) {
              contentLength = parseInt(match[1], 10);
            }
          } else if (res.headers['content-length']) {
            contentLength = parseInt(res.headers['content-length'], 10);
            supportsRanges = res.headers['accept-ranges'] === 'bytes';
          }

          let suggestedFileName: string | undefined;
          const disposition = res.headers['content-disposition'];
          if (disposition) {
            const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
            if (match && match[1]) {
              suggestedFileName = decodeURIComponent(match[1].trim());
            }
          }

          // Abort response body since we only need headers
          res.destroy();

          resolve({
            contentLength: isNaN(contentLength) ? 0 : contentLength,
            supportsRanges,
            finalUrl: targetUrl,
            suggestedFileName
          });
        }
      );

      req.on('socket', tuneSocket);
      req.on('error', () => {
        resolve({ contentLength: 0, supportsRanges: false, finalUrl: targetUrl });
      });

      req.end();
    } catch (_) {
      resolve({ contentLength: 0, supportsRanges: false, finalUrl: targetUrl });
    }
  });
}
