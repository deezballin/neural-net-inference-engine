import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, RefreshCw, Cpu, Activity, Zap, Layers, Sparkles, Sliders, ChevronDown, ChevronUp, Copy, Check, Terminal } from 'lucide-react';
import { BackendType, ChatMessage, InferenceParams, InferenceStats, QuantizationType } from '../types/engine';
import { ScratchInferenceEngine } from '../engine/scratchEngine';
import { LemonadeBridge } from '../engine/lemonadeBridge';
import { PluginSystem } from '../engine/pluginSystem';

interface PlaygroundTabProps {
  activeBackend: BackendType;
  setActiveBackend: (b: BackendType) => void;
  scratchEngine: ScratchInferenceEngine;
  lemonadeBridge: LemonadeBridge;
  pluginSystem: PluginSystem;
}

export const PlaygroundTab: React.FC<PlaygroundTabProps> = ({
  activeBackend,
  setActiveBackend,
  scratchEngine,
  lemonadeBridge,
  pluginSystem,
}) => {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are AetherEngine, an AMD NPU accelerated modular inference core.');
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [maxTokens, setMaxTokens] = useState(256);
  const [quantization, setQuantization] = useState<QuantizationType>('INT4_AWQ');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [stats, setStats] = useState<Partial<InferenceStats> | null>(null);
  const [showTensorInspector, setShowTensorInspector] = useState(true);
  const [copied, setCopied] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    'How does AMD Ryzen AI XDNA AIE-ML tile matrix accelerate INT4 GEMM kernels?',
    'Benchmark KV-Cache memory consumption for 4K context length on local NPU SRAM.',
    'Test sidecar bridge communication with Lemonade server at localhost:8000.',
    'Query the registered memory plugin and store system optimization preferences.',
  ];

  const handleCopy = () => {
    if (!streamedResponse) return;
    navigator.clipboard.writeText(streamedResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStop = () => {
    scratchEngine.stop();
    setIsGenerating(false);
  };

  const handleRunInference = async (customPrompt?: string) => {
    const textToRun = customPrompt || prompt;
    if (!textToRun.trim() || isGenerating) return;

    setIsGenerating(true);
    setStreamedResponse('');
    setStats(null);

    const startTime = performance.now();

    try {
      if (activeBackend === 'scratch_engine' || activeBackend === 'amd_npu') {
        const stream = scratchEngine.inferStream(textToRun, {
          maxTokens,
          temperature,
          topP,
          systemPrompt,
        });

        for await (const chunk of stream) {
          setStreamedResponse((prev) => prev + chunk.token);
          if (chunk.stats) {
            setStats({
              ...chunk.stats,
              backendUsed: activeBackend,
              quantization,
            });
          }
        }
      } else if (activeBackend === 'lemonade') {
        const messages: ChatMessage[] = [
          { id: '1', role: 'system', content: systemPrompt, timestamp: Date.now() },
          { id: '2', role: 'user', content: textToRun, timestamp: Date.now() },
        ];

        const stream = lemonadeBridge.streamChat(messages, {
          temperature,
          maxTokens,
        });

        for await (const chunk of stream) {
          setStreamedResponse((prev) => prev + chunk.token);
          if (chunk.stats) {
            setStats(chunk.stats);
          }
        }
      } else if (activeBackend === 'gemini_cloud') {
        // Run via server API route
        const res = await fetch('/api/engine/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: textToRun,
            systemPrompt,
            maxTokens,
            temperature,
          }),
        });

        const data = await res.json();
        const duration = Math.round(performance.now() - startTime);

        if (data.error) {
          setStreamedResponse(`[Gemini Cloud Error]: ${data.error}`);
        } else {
          setStreamedResponse(data.text || 'No response returned.');
          setStats({
            backendUsed: 'gemini_cloud',
            completionTokens: Math.round((data.text?.length || 0) / 4),
            totalTimeMs: duration,
            tokensPerSecond: Math.round(((data.text?.length || 0) / 4) / (duration / 1000)),
            quantization: 'FP16',
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStreamedResponse((prev) => prev + `\n[Execution Error]: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400">Target Core</div>
            <div className="text-xs font-semibold text-zinc-200 capitalize">
              {activeBackend.replace('_', ' ')}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400">Token Velocity</div>
            <div className="text-xs font-semibold font-mono text-zinc-200">
              {stats?.tokensPerSecond ? `${stats.tokensPerSecond} tok/s` : '-- tok/s'}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400">Time To First Token</div>
            <div className="text-xs font-semibold font-mono text-zinc-200">
              {stats?.timeToFirstTokenMs ? `${stats.timeToFirstTokenMs} ms` : '-- ms'}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400">Quant / Memory</div>
            <div className="text-xs font-semibold font-mono text-zinc-200">
              {quantization} ({stats?.memoryFootprintMB || 148} MB)
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Prompt Input & Parameters */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-red-400" />
                Inference Controls
              </h2>
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded">
                Config
              </span>
            </div>

            {/* Backend Selector */}
            <div className="space-y-1.5">
              <label htmlFor="playground-backend" className="text-xs text-zinc-400 font-medium">Execution Engine</label>
              <select
                id="playground-backend"
                value={activeBackend}
                onChange={(e) => setActiveBackend(e.target.value as BackendType)}
                className="w-full text-xs font-medium bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-red-500/60"
              >
                <option value="amd_npu">AMD Ryzen AI NPU (XDNA Tile Engine)</option>
                <option value="lemonade">Lemonade Server Sidecar (Local Host)</option>
                <option value="scratch_engine">Aether Scratch Transformer Core</option>
                <option value="gemini_cloud">Gemini Cloud Fallback Engine</option>
              </select>
            </div>

            {/* Quantization Mode */}
            <div className="space-y-1.5">
              <label htmlFor="quantization-mode" className="text-xs text-zinc-400 font-medium">Precision / Quantization</label>
              <div className="grid grid-cols-3 gap-1.5" id="quantization-mode">
                {(['INT4_AWQ', 'INT8', 'FP16'] as QuantizationType[]).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantization(q)}
                    className={`py-1.5 text-xs font-mono rounded-lg border transition-all ${
                      quantization === q
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Hyperparameters */}
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Temperature</span>
                  <span className="font-mono text-zinc-300">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-red-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Top-P (Nucleus)</span>
                  <span className="font-mono text-zinc-300">{topP}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  className="w-full accent-red-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Max Generated Tokens</span>
                  <span className="font-mono text-zinc-300">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="64"
                  max="1024"
                  step="64"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full accent-red-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* System Prompt */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-800">
              <label htmlFor="playground-system-prompt" className="text-xs text-zinc-400 font-medium">System Instructions</label>
              <textarea
                id="playground-system-prompt"
                rows={2}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-red-500/60 resize-none font-mono"
              />
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5">
            <div className="text-xs font-semibold text-zinc-400">Prompt Presets</div>
            <div className="space-y-1.5">
              {samplePrompts.map((sp, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(sp);
                    handleRunInference(sp);
                  }}
                  className="w-full text-left text-xs p-2 rounded-lg bg-zinc-950/60 hover:bg-zinc-800/60 border border-zinc-800/60 text-zinc-300 hover:text-zinc-100 transition-colors line-clamp-2"
                >
                  "{sp}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Execution Output & Prompt Input */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col h-[520px] shadow-sm">
            {/* Header / Actions */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-zinc-200">
                  Real-Time Streaming Output
                </span>
                {isGenerating && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                    Inferring...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!streamedResponse}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 rounded hover:bg-zinc-800 transition-colors text-xs flex items-center gap-1"
                  title="Copy Output"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setStreamedResponse('')}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800 transition-colors text-xs flex items-center gap-1"
                  title="Clear Console"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </div>
            </div>

            {/* Streaming Text Display */}
            <div
              ref={outputRef}
              className="flex-1 overflow-y-auto py-4 font-mono text-xs leading-relaxed text-zinc-200 space-y-2 whitespace-pre-wrap select-text"
            >
              {streamedResponse ? (
                <div>
                  {streamedResponse}
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-red-500 animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center space-y-2">
                  <Terminal className="w-8 h-8 stroke-1 text-zinc-700" />
                  <p className="text-xs">Engine is ready. Enter a prompt or select a preset to begin inference.</p>
                  <span className="text-[11px] text-zinc-700 font-mono">
                    Output will stream with live token velocity & layer telemetry.
                  </span>
                </div>
              )}
            </div>

            {/* Input Prompt Box */}
            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <div className="flex gap-2">
                <textarea
                  id="playground-prompt-input"
                  rows={2}
                  placeholder="Enter prompt (e.g., 'Execute INT4 quantized matrix multiplication on AMD NPU tiles')..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleRunInference();
                    }
                  }}
                  className="flex-1 text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500/60 resize-none font-sans"
                />

                <div className="flex flex-col gap-1.5 justify-end">
                  {isGenerating ? (
                    <button
                      id="btn-stop-inference"
                      onClick={handleStop}
                      className="px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-red-400 font-medium text-xs flex items-center justify-center gap-1.5 border border-red-500/30 transition-colors shadow-sm"
                    >
                      <Square className="w-3.5 h-3.5 fill-red-400" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      id="btn-run-inference"
                      onClick={() => handleRunInference()}
                      disabled={!prompt.trim()}
                      className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-red-950/40"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Run</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                <span>Press Ctrl+Enter or Cmd+Enter to run</span>
                <span>Active Plugins: {pluginSystem.getAllActiveTools().length} tools enabled</span>
              </div>
            </div>
          </div>

          {/* Collapsible Tensor Forward Pass Inspector */}
          <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-sm">
            <button
              onClick={() => setShowTensorInspector(!showTensorInspector)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Transformer Scratch Pipeline & Forward Pass Stages</span>
              </div>
              {showTensorInspector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTensorInspector && (
              <div className="p-4 pt-1 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-[11px] font-mono">
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1">
                  <div className="text-zinc-500 font-sans text-[10px] uppercase tracking-wider">Stage 1</div>
                  <div className="text-zinc-200 font-semibold">BPE Tokenizer</div>
                  <div className="text-zinc-400 text-[10px]">Vocab: 32,000</div>
                  <div className="text-cyan-400 text-[10px]">Subword hash</div>
                </div>

                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1">
                  <div className="text-zinc-500 font-sans text-[10px] uppercase tracking-wider">Stage 2</div>
                  <div className="text-zinc-200 font-semibold">RoPE Embedding</div>
                  <div className="text-zinc-400 text-[10px]">Freq base: 10,000</div>
                  <div className="text-cyan-400 text-[10px]">Rotary Cos/Sin</div>
                </div>

                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1">
                  <div className="text-zinc-500 font-sans text-[10px] uppercase tracking-wider">Stage 3</div>
                  <div className="text-zinc-200 font-semibold">RMSNorm + GQA</div>
                  <div className="text-zinc-400 text-[10px]">16 Heads, 4 KV</div>
                  <div className="text-cyan-400 text-[10px]">Causal Softmax</div>
                </div>

                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1">
                  <div className="text-zinc-500 font-sans text-[10px] uppercase tracking-wider">Stage 4</div>
                  <div className="text-zinc-200 font-semibold">INT4 SwiGLU GEMM</div>
                  <div className="text-zinc-400 text-[10px]">AIE Tile Vector</div>
                  <div className="text-red-400 text-[10px]">NPU Spatial 2048b</div>
                </div>

                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1">
                  <div className="text-zinc-500 font-sans text-[10px] uppercase tracking-wider">Stage 5</div>
                  <div className="text-zinc-200 font-semibold">Nucleus Sampler</div>
                  <div className="text-zinc-400 text-[10px]">Top-P {topP} / K 40</div>
                  <div className="text-emerald-400 text-[10px]">Next Token ID</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
