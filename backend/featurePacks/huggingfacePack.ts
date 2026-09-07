export interface HuggingFaceFile {
  path: string;
  size: number;
  type: 'file' | 'directory';
  downloadUrl: string;
  isWeight: boolean; // .safetensors, .bin, .onnx, .pt, .gguf
}

export interface HuggingFaceModelInfo {
  modelId: string;
  author: string;
  repoName: string;
  revision: string;
  pipelineTag?: string;
  files: HuggingFaceFile[];
  totalWeightSize: number;
}

export class HuggingFacePack {
  private userAgent = 'VortexDownloader-HuggingFacePack/1.0.0';

  /**
   * Parse a Hugging Face URL
   */
  public parseUrl(urlStr: string): {
    isHuggingFace: boolean;
    modelId?: string;
    author?: string;
    repoName?: string;
    revision?: string;
    filePath?: string;
    directUrl?: string;
    isDirectFile?: boolean;
  } {
    try {
      const parsed = new URL(urlStr);
      const host = parsed.hostname.toLowerCase();

      if (host !== 'huggingface.co' && host !== 'hf.co') {
        return { isHuggingFace: false };
      }

      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length < 1) {
        return { isHuggingFace: false };
      }

      // Special prefixes: datasets/..., spaces/...
      const isDataset = parts[0] === 'datasets';
      const offset = isDataset ? 1 : 0;

      if (parts.length < offset + 1) {
        return { isHuggingFace: false };
      }

      let author = '';
      let repoName = '';
      let restIndex = 0;

      if (parts.length === offset + 1) {
        // Single name model, e.g., /gpt2 or /bert-base-uncased
        author = 'openai-community'; // or generic
        repoName = parts[offset];
        restIndex = offset + 1;
      } else {
        author = parts[offset];
        repoName = parts[offset + 1];
        restIndex = offset + 2;
      }

      const modelId = `${author}/${repoName}`;

      // Direct file link: /resolve/:revision/... or /raw/:revision/...
      if (
        parts.length > restIndex + 2 &&
        (parts[restIndex] === 'resolve' || parts[restIndex] === 'raw')
      ) {
        const revision = parts[restIndex + 1];
        const filePath = parts.slice(restIndex + 2).join('/');
        const directUrl = `https://huggingface.co/${modelId}/resolve/${revision}/${filePath}`;
        return {
          isHuggingFace: true,
          modelId,
          author,
          repoName,
          revision,
          filePath,
          directUrl,
          isDirectFile: true
        };
      }

      // Tree view: /tree/:revision
      let revision = 'main';
      if (parts.length > restIndex + 1 && parts[restIndex] === 'tree') {
        revision = parts[restIndex + 1];
      }

      return {
        isHuggingFace: true,
        modelId,
        author,
        repoName,
        revision,
        isDirectFile: false
      };
    } catch (_) {
      return { isHuggingFace: false };
    }
  }

  /**
   * Inspect a model or dataset repo and return all files
   */
  public async inspectModel(modelId: string, revision = 'main'): Promise<HuggingFaceModelInfo> {
    const parts = modelId.split('/');
    const author = parts.length > 1 ? parts[0] : '';
    const repoName = parts.length > 1 ? parts[1] : modelId;

    // Use HF API tree endpoint
    const endpoint = `https://huggingface.co/api/models/${modelId}/tree/${encodeURIComponent(revision)}`;

    const res = await fetch(endpoint, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to inspect Hugging Face repo (${res.status} ${res.statusText})`);
    }

    const items: any[] = await res.json();
    const weightExtensions = ['.safetensors', '.bin', '.onnx', '.pt', '.pth', '.gguf', '.h5', '.msgpack'];

    let totalWeightSize = 0;
    const files: HuggingFaceFile[] = items
      .filter((item) => item.type === 'file')
      .map((item) => {
        const lower = item.path.toLowerCase();
        const isWeight = weightExtensions.some((ext) => lower.endsWith(ext));
        const size = typeof item.size === 'number' ? item.size : 0;
        if (isWeight) totalWeightSize += size;

        return {
          path: item.path,
          size,
          type: 'file',
          downloadUrl: `https://huggingface.co/${modelId}/resolve/${revision}/${item.path}`,
          isWeight
        };
      });

    // Sort so weights and major model files are at the top
    files.sort((a, b) => {
      if (a.isWeight && !b.isWeight) return -1;
      if (!a.isWeight && b.isWeight) return 1;
      return b.size - a.size;
    });

    return {
      modelId,
      author,
      repoName,
      revision,
      files,
      totalWeightSize
    };
  }
}
