/**
 * Lemonade Server Sidecar Bridge
 * Manages connection, model catalog, and streaming inference with Lemonade / Ollama / OpenAI-compatible local engines.
 */

import { LemonadeConfig, ChatMessage, InferenceStats } from '../types/engine';

export class LemonadeBridge {
  private static instance: LemonadeBridge;
  private config: LemonadeConfig = {
    baseUrl: 'http://localhost:8000',
    status: 'disconnected',
    activeModel: 'lemonade-default-8b',
    availableModels: ['lemonade-default-8b', 'llama-3.2-3b-npu', 'mistral-7b-instruct', 'qwen2.5-coder-7b'],
    latencyMs: 0,
  };

  private constructor() {}

  public static getInstance(): LemonadeBridge {
    if (!LemonadeBridge.instance) {
      LemonadeBridge.instance = new LemonadeBridge();
    }
    return LemonadeBridge.instance;
  }

  public getConfig(): LemonadeConfig {
    return { ...this.config };
  }

  public setBaseUrl(url: string): void {
    this.config.baseUrl = url.trim().replace(/\/+$/, '');
  }

  public setActiveModel(model: string): void {
    this.config.activeModel = model;
  }

  /**
   * Health check and model list retrieval via backend proxy or direct
   */
  public async checkConnection(targetUrl?: string): Promise<LemonadeConfig> {
    const url = targetUrl || this.config.baseUrl;
    const start = performance.now();
    this.config.status = 'checking';

    try {
      // Test through server proxy to bypass local browser CORS
      const res = await fetch('/api/lemonade/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      const latency = Math.round(performance.now() - start);

      if (data.connected) {
        this.config = {
          ...this.config,
          baseUrl: url,
          status: 'connected',
          latencyMs: latency,
          availableModels: data.models?.length ? data.models : this.config.availableModels,
          error: undefined,
          lastChecked: Date.now(),
        };
      } else {
        this.config = {
          ...this.config,
          baseUrl: url,
          status: 'disconnected',
          latencyMs: latency,
          error: data.message || 'Lemonade server not responding on target host.',
          lastChecked: Date.now(),
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.config = {
        ...this.config,
        baseUrl: url,
        status: 'disconnected',
        error: msg,
        lastChecked: Date.now(),
      };
    }

    return { ...this.config };
  }

  /**
   * Stream completion from Lemonade sidecar
   */
  public async *streamChat(
    messages: ChatMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): AsyncGenerator<{ token: string; stats?: Partial<InferenceStats> }> {
    const model = options?.model || this.config.activeModel;
    const startTime = performance.now();
    let tokenCount = 0;

    const payload = {
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 512,
      stream: true,
      url: this.config.baseUrl,
    };

    try {
      const response = await fetch('/api/lemonade/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Lemonade server error: ${errText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response stream not readable');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed === 'data: [DONE]') break;

          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const delta = parsed.choices?.[0]?.delta?.content || parsed.message?.content || '';
              if (delta) {
                tokenCount++;
                const elapsed = performance.now() - startTime;
                const tps = tokenCount / (elapsed / 1000);
                yield {
                  token: delta,
                  stats: {
                    backendUsed: 'lemonade',
                    completionTokens: tokenCount,
                    tokensPerSecond: Math.round(tps * 10) / 10,
                    totalTimeMs: Math.round(elapsed),
                  },
                };
              }
            } catch {
              // Non-json chunk or partial
            }
          }
        }
      }
    } catch (err: unknown) {
      // Fallback message
      const msg = err instanceof Error ? err.message : String(err);
      yield {
        token: `\n[Lemonade Sidecar Notice]: Could not reach Lemonade server at ${this.config.baseUrl} (${msg}). Ensure 'lemonade serve --port 8000' is running, or switch to the native Scratch Engine or AMD NPU mode.`,
      };
    }
  }
}
