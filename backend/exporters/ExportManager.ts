export interface ExportableTask {
  url: string;
  fileName: string;
  fileSize?: number;
}

export class ExportManager {
  /**
   * Export tasks as standard Metalink 4.0 XML (RFC 5854)
   */
  public static toMetalink(tasks: ExportableTask[]): string {
    const filesXml = tasks.map((task) => `
    <file name="${this.escapeXml(task.fileName)}">
      ${task.fileSize ? `<size>${task.fileSize}</size>` : ''}
      <url priority="1">${this.escapeXml(task.url)}</url>
    </file>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<metalink xmlns="urn:ietf:params:xml:ns:metalink">
  <generator>Vortex Downloader 0.5.7</generator>
  <published>${new Date().toISOString()}</published>
  ${filesXml}
</metalink>`;
  }

  /**
   * Export tasks as executable cURL bash script with resume flags
   */
  public static toCurlScript(tasks: ExportableTask[]): string {
    const commands = tasks.map((task) => {
      return `echo "Downloading ${task.fileName}..."\ncurl -C - -L -o "${task.fileName}" -H "User-Agent: Mozilla/5.0" "${task.url}"\n`;
    }).join('\n');

    return `#!/usr/bin/env bash
# ==============================================================================
# Vortex Downloader - Portable cURL Export Script
# Generated: ${new Date().toISOString()}
# Usage: chmod +x download.sh && ./download.sh
# ==============================================================================

set -e
mkdir -p downloads
cd downloads

${commands}

echo "All downloads completed successfully!"
`;
  }

  /**
   * Export tasks as standard aria2 input file (aria2c -i aria2.txt)
   */
  public static toAria2Input(tasks: ExportableTask[]): string {
    return tasks.map((task) => {
      return `${task.url}\n  out=${task.fileName}\n  max-connection-per-server=16\n  split=16\n`;
    }).join('\n');
  }

  /**
   * Export tasks as standard JSON
   */
  public static toJson(tasks: ExportableTask[]): string {
    return JSON.stringify({
      version: '0.5.4',
      exportedAt: new Date().toISOString(),
      tasks
    }, null, 2);
  }

  private static escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }
}
