import { IVortexHostPlugin, PluginMetadata, ResolvedStream, CrawlContext } from '../types';

export class HuggingFaceHostPlugin implements IVortexHostPlugin {
  public readonly metadata: PluginMetadata = {
    id: 'huggingface_host',
    name: 'Hugging Face AI Model Hub',
    version: '1.0.0',
    author: 'Vortex Core',
    description: 'Direct AI model weights (.safetensors, .gguf) and dataset resolver.',
    supportedDomains: ['huggingface.co', 'hf.co']
  };

  public canHandle(url: string): boolean {
    return /huggingface\.co|hf\.co/i.test(url);
  }

  public async resolve(url: string, context: CrawlContext): Promise<ResolvedStream> {
    try {
      // Ensure ?download=true is appended for direct weight streaming
      const parsed = new URL(url);
      if (!parsed.searchParams.has('download')) {
        parsed.searchParams.set('download', 'true');
      }

      const fileName = parsed.pathname.split('/').filter(Boolean).pop() || 'model.safetensors';

      return {
        directUrl: parsed.toString(),
        fileName: decodeURIComponent(fileName),
        engine: 'chunk'
      };
    } catch (_) {
      return {
        directUrl: url,
        fileName: 'model.safetensors',
        engine: 'chunk'
      };
    }
  }
}
