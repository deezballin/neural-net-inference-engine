import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  RefreshCw,
  Cpu,
  Activity,
  Zap,
  Layers,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Terminal,
  Database,
  Plus,
  Trash2,
  Download,
  MessageSquare,
  Bot,
  User,
  ExternalLink,
  Brain,
} from 'lucide-react';
import {
  BackendType,
  ChatMessage,
  ChatSession,
  InferenceStats,
  QuantizationType,
  RagSearchResult,
} from '../types/engine';
import { ScratchInferenceEngine } from '../engine/scratchEngine';
import { LemonadeBridge } from '../engine/lemonadeBridge';
import { PluginSystem } from '../engine/pluginSystem';
import { RagEngine } from '../engine/ragEngine';
import { SubconsciousEngine } from '../engine/subconsciousEngine';

interface PlaygroundTabProps {
  activeBackend: BackendType;
  setActiveBackend: (b: BackendType) => void;
  scratchEngine: ScratchInferenceEngine;
  lemonadeBridge: LemonadeBridge;
  pluginSystem: PluginSystem;
}

const STORAGE_KEY_SESSIONS = 'aether_chat_sessions_v1';

export const PlaygroundTab: React.FC<PlaygroundTabProps> = ({
  activeBackend,
  setActiveBackend,
  scratchEngine,
  lemonadeBridge,
  pluginSystem,
}) => {
  const rag = RagEngine.getInstance();
  const subconscious = SubconsciousEngine.getInstance();

  // Sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    // Default initial session
    return [
      {
        id: `sess-${Date.now()}`,
        title: 'AMD NPU Acceleration & INT4',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        backend: activeBackend,
        systemPrompt: 'You are AetherEngine, an AMD NPU accelerated modular inference core.',
        temperature: 0.7,
        topP: 0.9,
        repetitionPenalty: 1.15,
        useRag: true,
        messages: [
          {
            id: 'msg-init-user',
            role: 'user',
            content: 'How does the AMD Ryzen AI XDNA AIE-ML tile matrix accelerate INT4 GEMM kernels?',
            timestamp: Date.now() - 120000,
          },
          {
            id: 'msg-init-assistant',
            role: 'assistant',
            content:
              'The AMD XDNA architecture uses a 2D mesh of spatial AIE-ML (AI Engine) tiles. Each tile houses dedicated INT4/INT8 SIMD vector units with 2048-bit accumulators.\n\nInstead of fetching weights continuously from external DRAM (which consumes significant power), data flows directly from tile to tile via dedicated 32MB local tile SRAM. This delivers up to 50 TOPS at very low thermal dissipation (<15W).',
            timestamp: Date.now() - 110000,
          },
        ],
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(sessions[0]?.id || '');
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Parameters
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(activeSession?.systemPrompt || 'You are AetherEngine, an AMD NPU accelerated modular inference core.');
  const [temperature, setTemperature] = useState(activeSession?.temperature ?? 0.7);
  const [topP, setTopP] = useState(activeSession?.topP ?? 0.9);
  const [repetitionPenalty, setRepetitionPenalty] = useState(activeSession?.repetitionPenalty ?? 1.15);
  const [maxTokens, setMaxTokens] = useState(256);
  const [quantization, setQuantization] = useState<QuantizationType>('INT4_AWQ');
  const [useRag, setUseRag] = useState<boolean>(activeSession?.useRag ?? true);

  // Subconscious integration state
  const [subconsciousWhisper, setSubconsciousWhisper] = useState<string>(
    'Subconscious Whisper: Anticipating query regarding AMD NPU architecture & low-power tile execution. 2 RAG vectors primed on SRAM.'
  );
  const [showSubconsciousDrawer, setShowSubconsciousDrawer] = useState(false);

  // Runtime generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [activeCitations, setActiveCitations] = useState<RagSearchResult[]>([]);
  const [stats, setStats] = useState<Partial<InferenceStats> | null>(null);
  const [showTensorInspector, setShowTensorInspector] = useState(false);
  const [showSessionsDrawer, setShowSessionsDrawer] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Save sessions to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to save sessions:', e);
    }
  }, [sessions]);

  // Sync session switches
  useEffect(() => {
    if (activeSession) {
      setSystemPrompt(activeSession.systemPrompt);
      setTemperature(activeSession.temperature);
      setTopP(activeSession.topP);
      setRepetitionPenalty(activeSession.repetitionPenalty);
      setUseRag(activeSession.useRag);
    }
  }, [activeSessionId]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, streamedResponse]);

  const samplePrompts = [
    'How does AMD Ryzen AI XDNA AIE-ML tile matrix accelerate INT4 GEMM kernels?',
    'Benchmark KV-Cache memory consumption for 4K context length on local NPU SRAM.',
    'Test sidecar bridge communication with Lemonade server at localhost:8000.',
    'Query the registered memory plugin and store system optimization preferences.',
  ];

  const handleNewSession = () => {
    const newSess: ChatSession = {
      id: `sess-${Date.now()}`,
      title: `Conversation ${sessions.length + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      backend: activeBackend,
      systemPrompt,
      temperature,
      topP,
      repetitionPenalty,
      useRag,
      messages: [],
    };
    setSessions([newSess, ...sessions]);
    setActiveSessionId(newSess.id);
    setStreamedResponse('');
    setStats(null);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      // Just clear messages
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, messages: [], title: 'New Conversation' } : s))
      );
      return;
    }
    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) {
      setActiveSessionId(filtered[0].id);
    }
  };

  const handleExportChat = () => {
    if (!activeSession) return;
    const markdown = `# ${activeSession.title}\n\n` +
      `Date: ${new Date(activeSession.createdAt).toLocaleString()}\n` +
      `Backend: ${activeSession.backend}\n` +
      `System Prompt: ${activeSession.systemPrompt}\n\n---\n\n` +
      activeSession.messages
        .map((m) => `### ${m.role.toUpperCase()} (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.content}\n`)
        .join('\n---\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSession.title.toLowerCase().replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleStop = () => {
    scratchEngine.stop();
    setIsGenerating(false);
  };

  const handleRunInference = async (customPrompt?: string) => {
    const textToRun = customPrompt || prompt;
    if (!textToRun.trim() || isGenerating || !activeSession) return;

    const userMessageId = `msg-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: textToRun,
      timestamp: Date.now(),
    };

    // Update active session with user message immediately
    const updatedMessages = [...activeSession.messages, userMsg];
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              title: s.messages.length === 0 ? textToRun.slice(0, 32) + '...' : s.title,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : s
      )
    );

    setPrompt('');
    setIsGenerating(true);
    setStreamedResponse('');
    setStats(null);
    setActiveCitations([]);

    // Subconscious background sensory pre-fetching
    try {
      const subResult = subconscious.processSensoryInput(textToRun);
      if (subResult.whisper) {
        setSubconsciousWhisper(subResult.whisper);
      }
    } catch (e) {
      console.warn('Subconscious priming error:', e);
    }

    const startTime = performance.now();

    // RAG Augmentation check
    let promptWithContext = textToRun;
    let citations: RagSearchResult[] = [];

    if (useRag) {
      const ragResult = rag.buildAugmentedPrompt(textToRun, 3);
      promptWithContext = ragResult.augmentedPrompt;
      citations = ragResult.citations;
      setActiveCitations(citations);
    }

    try {
      let accumulatedResponse = '';
      let finalStats: InferenceStats | undefined;

      if (activeBackend === 'scratch_engine' || activeBackend === 'amd_npu') {
        const stream = scratchEngine.inferStream(promptWithContext, {
          maxTokens,
          temperature,
          topP,
          systemPrompt,
        });

        for await (const chunk of stream) {
          accumulatedResponse += chunk.token;
          setStreamedResponse(accumulatedResponse);
          if (chunk.stats) {
            finalStats = {
              ...chunk.stats,
              backendUsed: activeBackend,
              quantization,
            };
            setStats(finalStats);
          }
        }
      } else if (activeBackend === 'lemonade') {
        const historyForSidecar: ChatMessage[] = [
          { id: 'sys', role: 'system', content: systemPrompt, timestamp: Date.now() },
          ...updatedMessages.slice(-6),
        ];

        const stream = lemonadeBridge.streamChat(historyForSidecar, {
          temperature,
          maxTokens,
        });

        for await (const chunk of stream) {
          accumulatedResponse += chunk.token;
          setStreamedResponse(accumulatedResponse);
          if (chunk.stats) {
            finalStats = chunk.stats;
            setStats(finalStats);
          }
        }
      } else if (activeBackend === 'gemini_cloud') {
        const res = await fetch('/api/engine/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptWithContext,
            systemPrompt,
            maxTokens,
            temperature,
          }),
        });

        const data = await res.json();
        const duration = Math.round(performance.now() - startTime);

        if (data.error) {
          accumulatedResponse = `[Gemini Cloud Error]: ${data.error}`;
        } else {
          accumulatedResponse = data.text || 'No response returned.';
          finalStats = {
            backendUsed: 'gemini_cloud',
            promptTokens: Math.round(promptWithContext.length / 4),
            completionTokens: Math.round(accumulatedResponse.length / 4),
            totalTokens: Math.round((promptWithContext.length + accumulatedResponse.length) / 4),
            timeToFirstTokenMs: Math.round(duration * 0.5),
            totalTimeMs: duration,
            tokensPerSecond: Math.round((accumulatedResponse.length / 4) / (duration / 1000)),
            quantization: 'FP16',
            memoryFootprintMB: 0,
          };
          setStats(finalStats);
        }
        setStreamedResponse(accumulatedResponse);
      }

      // Add assistant message to history
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: accumulatedResponse,
        timestamp: Date.now(),
        stats: finalStats,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                messages: [...updatedMessages, assistantMsg],
                updatedAt: Date.now(),
              }
            : s
        )
      );
      setStreamedResponse('');

      // Background subconscious memory consolidation
      setTimeout(() => {
        try {
          subconscious.triggerDreamConsolidationCycle([textToRun, accumulatedResponse]);
        } catch (e) {
          console.warn('Dream consolidation error:', e);
        }
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `[Inference Error]: ${msg}`,
        timestamp: Date.now(),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? { ...s, messages: [...updatedMessages, errorMsg], updatedAt: Date.now() }
            : s
        )
      );
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
        {/* Left Column: Prompt Controls, Sessions & Hyperparameters */}
        <div className="lg:col-span-1 space-y-4">
          {/* Chat Sessions Manager Card */}
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Conversations ({sessions.length})</span>
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleNewSession}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-cyan-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Chat</span>
                </button>
                <button
                  onClick={handleExportChat}
                  title="Export active conversation as Markdown"
                  className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Session Tabs List */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {sessions.map((sess) => {
                const isSelected = sess.id === activeSession.id;
                return (
                  <div
                    key={sess.id}
                    onClick={() => setActiveSessionId(sess.id)}
                    className={`p-2 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80 shadow-sm'
                        : 'bg-zinc-950/60 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent'
                    }`}
                  >
                    <span className="truncate pr-2">{sess.title}</span>
                    <button
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className="text-zinc-500 hover:text-red-400 p-0.5 rounded transition-colors"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hyperparameters Controls */}
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-red-400" />
                Inference Hyperparameters
              </h2>
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded">
                Controls
              </span>
            </div>

            {/* Backend Selector */}
            <div className="space-y-1.5">
              <label htmlFor="playground-backend" className="text-xs text-zinc-400 font-medium">
                Execution Engine
              </label>
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

            {/* RAG Knowledge Base Toggle */}
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-semibold text-zinc-200">Ground in Knowledge Base (RAG)</div>
                  <div className="text-[10px] text-zinc-500">Inject verified documents as context</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={useRag}
                onChange={(e) => setUseRag(e.target.checked)}
                className="accent-cyan-500 rounded cursor-pointer w-4 h-4"
              />
            </div>

            {/* Quantization Mode */}
            <div className="space-y-1.5">
              <label htmlFor="quantization-mode" className="text-xs text-zinc-400 font-medium">
                Precision / Quantization
              </label>
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

            {/* Hyperparameters Sliders */}
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Temperature</span>
                  <span className="font-mono text-zinc-300">
                    {temperature} <span className="text-[10px] text-zinc-500">({temperature < 0.3 ? 'Deterministic' : temperature > 0.8 ? 'Creative' : 'Balanced'})</span>
                  </span>
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
                  <span className="text-zinc-400">Repetition Penalty</span>
                  <span className="font-mono text-zinc-300">{repetitionPenalty}</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="1.5"
                  step="0.05"
                  value={repetitionPenalty}
                  onChange={(e) => setRepetitionPenalty(parseFloat(e.target.value))}
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
              <label htmlFor="playground-system-prompt" className="text-xs text-zinc-400 font-medium">
                System Persona
              </label>
              <textarea
                id="playground-system-prompt"
                rows={2}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-red-500/60 resize-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Turn Conversation History & Input Box */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col h-[580px] shadow-sm">
            {/* Header / Actions */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-zinc-200">
                  {activeSession.title}
                </span>
                {isGenerating && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                    Inferring...
                  </span>
                )}
                {useRag && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    RAG Active
                  </span>
                )}
                <button
                  onClick={() => setShowSubconsciousDrawer(!showSubconsciousDrawer)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 transition-all ${
                    showSubconsciousDrawer
                      ? 'bg-purple-500/30 text-purple-200 border-purple-500/50'
                      : 'bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20'
                  }`}
                  title="Toggle Subconscious Pre-warmed Context"
                >
                  <Brain className="w-3 h-3 text-purple-400" />
                  <span>Subconscious Primed</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSessions((prev) =>
                      prev.map((s) => (s.id === activeSession.id ? { ...s, messages: [] } : s))
                    );
                    setStreamedResponse('');
                  }}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800 transition-colors text-xs flex items-center gap-1"
                  title="Clear conversation"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear Chat</span>
                </button>
              </div>
            </div>

            {/* Subconscious Pre-warmed Drawer */}
            {showSubconsciousDrawer && (
              <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/40 text-xs space-y-1.5 my-2">
                <div className="flex items-center justify-between text-purple-300 font-semibold font-mono text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-purple-400" />
                    <span>SUBCONSCIOUS INTUITION & PRE-WARMED CONTEXT</span>
                  </div>
                  <span className="text-zinc-500">AMD NPU Background Tile Stream</span>
                </div>
                <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                  {subconsciousWhisper}
                </p>
                <div className="text-[10px] font-mono text-purple-400/80 pt-1 border-t border-purple-900/40">
                  Pre-warmed tools & memories staged in local SRAM • Zero conscious latency penalty
                </div>
              </div>
            )}

            {/* Conversation Messages Thread */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 select-text pr-1">
              {activeSession.messages.length === 0 && !streamedResponse && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center space-y-3">
                  <Terminal className="w-8 h-8 stroke-1 text-zinc-700" />
                  <div className="text-xs font-semibold text-zinc-400">
                    Conversation thread is ready.
                  </div>
                  <p className="text-[11px] text-zinc-600 max-w-sm">
                    Enter a prompt or select a quick preset below to trigger high-speed local inference with multi-turn context.
                  </p>
                </div>
              )}

              {/* Render existing messages */}
              {activeSession.messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-xl p-3.5 space-y-2 relative group ${
                        isUser
                          ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                          : 'bg-zinc-950 text-zinc-200 border border-zinc-800/90'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                        <span className="font-semibold">{isUser ? 'You' : 'AetherEngine'}</span>
                        <span className="text-zinc-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="font-sans leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>

                      {/* Assistant message footer metrics */}
                      {!isUser && msg.stats && (
                        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                          <span>
                            {msg.stats.tokensPerSecond} t/s • {msg.stats.totalTimeMs}ms
                          </span>
                          <button
                            onClick={() => handleCopyMessage(msg.content, msg.id)}
                            className="text-zinc-400 hover:text-zinc-200 transition-colors"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-400 inline" />
                            ) : (
                              <Copy className="w-3 h-3 inline" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Live Streaming Assistant Message */}
              {isGenerating && (
                <div className="flex items-start gap-3 text-xs justify-start">
                  <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>

                  <div className="max-w-[85%] rounded-xl p-3.5 space-y-2 bg-zinc-950 text-zinc-200 border border-red-500/40 shadow-sm">
                    {/* Active RAG citations pill if any */}
                    {activeCitations.length > 0 && (
                      <div className="p-2 rounded bg-cyan-950/30 border border-cyan-800/40 text-[10px] space-y-1">
                        <div className="font-semibold text-cyan-300 flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          <span>Grounded in {activeCitations.length} Knowledge Excerpts:</span>
                        </div>
                        {activeCitations.map((c, i) => (
                          <div key={i} className="text-zinc-400 truncate">
                            • {c.chunk.docTitle} ({(c.score * 100).toFixed(0)}% match)
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="font-sans leading-relaxed whitespace-pre-wrap">
                      {streamedResponse || 'Thinking and computing tensor forward pass...'}
                      <span className="inline-block w-2 h-4 bg-red-500 animate-pulse ml-0.5 align-middle" />
                    </div>

                    <div className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-800">
                      Generating via {activeBackend}...
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts Bar */}
            <div className="py-2 border-t border-zinc-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-mono text-zinc-500 uppercase shrink-0">Presets:</span>
              {samplePrompts.map((sp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRunInference(sp)}
                  disabled={isGenerating}
                  className="px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 text-[11px] whitespace-nowrap transition-colors"
                >
                  {sp.slice(0, 36)}...
                </button>
              ))}
            </div>

            {/* Input Prompt Box */}
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <div className="flex gap-2">
                <textarea
                  id="playground-prompt-input"
                  rows={2}
                  placeholder="Enter message (e.g. 'Explain how INT4 AWQ preserves perplexity compared to uniform quantization')..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
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
                      <span>Send</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                <span>Press Enter to send (Shift+Enter for newline)</span>
                <span>Active Plugins: {pluginSystem.getAllActiveTools().length} tools loaded</span>
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
