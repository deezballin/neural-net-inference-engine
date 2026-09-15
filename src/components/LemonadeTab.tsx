import React, { useState } from 'react';
import { Server, RefreshCw, CheckCircle2, XCircle, Zap, Shield, ArrowRight, Terminal, Copy, Check } from 'lucide-react';
import { LemonadeConfig } from '../types/engine';
import { LemonadeBridge } from '../engine/lemonadeBridge';

interface LemonadeTabProps {
  lemonadeConfig: LemonadeConfig;
  setLemonadeConfig: (c: LemonadeConfig) => void;
  onSelectBackend: () => void;
}

export const LemonadeTab: React.FC<LemonadeTabProps> = ({
  lemonadeConfig,
  setLemonadeConfig,
  onSelectBackend,
}) => {
  const bridge = LemonadeBridge.getInstance();
  const [urlInput, setUrlInput] = useState(lemonadeConfig.baseUrl);
  const [isPinging, setIsPinging] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [autoFallback, setAutoFallback] = useState(true);

  const sampleLemonadeCli = `# Launch Lemonade Server as local inference sidecar:
# 1. Install Lemonade CLI / server runtime
pip install lemonade-server  # or download native binary

# 2. Start sidecar server listening on localhost:8000
lemonade serve --port 8000 --host 0.0.0.0 --cors "*"

# 3. (Optional) Run with AMD NPU flag:
lemonade serve --port 8000 --device npu --quant int4`;

  const handleTestConnection = async () => {
    setIsPinging(true);
    bridge.setBaseUrl(urlInput);
    try {
      const updated = await bridge.checkConnection(urlInput);
      setLemonadeConfig(updated);
    } finally {
      setIsPinging(false);
    }
  };

  const handleSelectModel = (model: string) => {
    bridge.setActiveModel(model);
    setLemonadeConfig({ ...lemonadeConfig, activeModel: model });
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText(sampleLemonadeCli);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Lemonade Server Sidecar Bridge
            </h2>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${
                lemonadeConfig.status === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              {lemonadeConfig.status}
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Runs alongside local Lemonade / Ollama / vLLM server instances via standard OpenAI-compatible streaming endpoints (`/v1/chat/completions`), serving as the backend executor or dynamic fallback for the Agent runtime.
          </p>
        </div>

        <button
          onClick={onSelectBackend}
          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-950/40 whitespace-nowrap"
        >
          <span>Use Lemonade in Playground</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sidecar Configuration */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-sm">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Connection Settings
            </h3>

            <div className="space-y-1.5">
              <label htmlFor="lemonade-host-input" className="text-xs text-zinc-400 font-medium">Sidecar Host URL</label>
              <input
                id="lemonade-host-input"
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:8000"
                className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500/60"
              />
              <span className="text-[10px] text-zinc-500">
                Default: http://localhost:8000 (or http://localhost:11434 for Ollama)
              </span>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={isPinging}
              className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-100 font-medium text-xs flex items-center justify-center gap-2 border border-zinc-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isPinging ? 'Pinging Host...' : 'Test Connection & Sync Models'}</span>
            </button>

            {/* Status Summary */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Connection:</span>
                <span className="flex items-center gap-1 font-semibold capitalize">
                  {lemonadeConfig.status === 'connected' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-400">{lemonadeConfig.status}</span>
                    </>
                  )}
                </span>
              </div>

              {lemonadeConfig.status === 'connected' && (
                <div className="flex justify-between items-center text-zinc-400 font-mono text-[11px]">
                  <span>Roundtrip Latency:</span>
                  <span className="text-zinc-200">{lemonadeConfig.latencyMs} ms</span>
                </div>
              )}

              {lemonadeConfig.error && (
                <div className="text-[11px] text-amber-400/90 pt-1 border-t border-zinc-800">
                  {lemonadeConfig.error}
                </div>
              )}
            </div>

            {/* Fallback Hierarchy Toggle */}
            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="auto-fallback-toggle" className="text-xs font-semibold text-zinc-300">Intelligent Fallback Routing</label>
                <input
                  id="auto-fallback-toggle"
                  type="checkbox"
                  checked={autoFallback}
                  onChange={(e) => setAutoFallback(e.target.checked)}
                  className="accent-emerald-500 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                When enabled, inference queries automatically cascade: AMD NPU → Lemonade Sidecar → Scratch Engine → Gemini Cloud.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Model Catalog & Launch Helper */}
        <div className="lg:col-span-2 space-y-4">
          {/* Models list */}
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                Available Models on Sidecar
              </h3>
              <span className="text-[11px] font-mono text-zinc-400">
                Active: <span className="text-emerald-400 font-semibold">{lemonadeConfig.activeModel}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {lemonadeConfig.availableModels.map((m) => {
                const isActive = lemonadeConfig.activeModel === m;
                return (
                  <button
                    key={m}
                    onClick={() => handleSelectModel(m)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300 ring-1 ring-emerald-500'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-semibold truncate">{m}</span>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      OpenAI Format • SSE Streaming Enabled
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Launch Cheatsheet */}
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-zinc-200">
                  Quick Launch: Running Lemonade Server Locally
                </h3>
              </div>
              <button
                onClick={handleCopyCli}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCli ? 'Copied' : 'Copy Commands'}</span>
              </button>
            </div>

            <pre className="p-3 rounded-lg bg-zinc-950 font-mono text-[11px] text-zinc-300 overflow-x-auto">
              {sampleLemonadeCli}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
