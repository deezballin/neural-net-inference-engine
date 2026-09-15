import React, { useState, useEffect } from 'react';
import {
  Brain,
  Zap,
  Moon,
  Sparkles,
  Cpu,
  Layers,
  Activity,
  Bot,
  ArrowRight,
  Database,
  Trash2,
  RefreshCw,
  Power,
  Sliders,
  CheckCircle2,
  Terminal,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import {
  ConsolidatedMemoryNode,
  PrimedContextItem,
  SubconsciousThought,
} from '../types/engine';
import { SubconsciousEngine } from '../engine/subconsciousEngine';
import { ThoughtStreamD3Graph } from './ThoughtStreamD3Graph';

export const SubconsciousTab: React.FC = () => {
  const engine = SubconsciousEngine.getInstance();

  const [state, setState] = useState(() => engine.getState());
  const [thoughts, setThoughts] = useState<SubconsciousThought[]>(() => engine.getThoughts());
  const [primedItems, setPrimedItems] = useState<PrimedContextItem[]>(() => engine.getPrimedItems());
  const [memories, setMemories] = useState<ConsolidatedMemoryNode[]>(() => engine.getMemories());

  // Interactive sandbox state
  const [testSensoryInput, setTestSensoryInput] = useState('I need to calculate INT4 quantization matrix efficiency on AMD NPU tiles.');
  const [lastWhisper, setLastWhisper] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [dreamSuccessMessage, setDreamSuccessMessage] = useState<string | null>(null);

  // Subscribe to engine state updates
  useEffect(() => {
    const unsubscribe = engine.subscribe(() => {
      setState(engine.getState());
      setThoughts(engine.getThoughts());
      setPrimedItems(engine.getPrimedItems());
      setMemories(engine.getMemories());
    });
    return unsubscribe;
  }, []);

  const handleToggleDaemon = () => {
    engine.toggleDaemon();
  };

  const handleTileChange = (tiles: number) => {
    engine.setDedicatedTiles(tiles);
  };

  const handleRunDreamCycle = () => {
    const res = engine.triggerDreamConsolidationCycle([
      'AMD Ryzen AI NPU XDNA architecture',
      'INT4 AWQ quantization memory compression',
      'Subconscious sub-agent pre-fetching and cognitive loop',
    ]);
    setDreamSuccessMessage(res.cycleSummary);
    setTimeout(() => setDreamSuccessMessage(null), 4000);
  };

  const handleSimulateSensoryInput = (textToRun?: string) => {
    const input = textToRun || testSensoryInput;
    if (!input.trim()) return;

    setIsSimulating(true);
    setTimeout(() => {
      const result = engine.processSensoryInput(input);
      setLastWhisper(result.whisper);
      setIsSimulating(false);
    }, 250);
  };

  const handleDeleteMemory = (id: string) => {
    engine.deleteMemoryNode(id);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Daemon Telemetry & Status */}
      <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-100">
                  Subconscious Mind Engine & Pre-Warming Daemon
                </h2>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    state.enabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {state.enabled ? 'Daemon Active (Background)' : 'Daemon Paused'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Continuous background sub-agent running on dedicated AMD NPU tiles. Pre-fetches RAG context, pre-warms specialized sub-agents, and consolidates long-term memories.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunDreamCycle}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              title="Trigger Sleep & Dream Memory Consolidation Cycle"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Trigger Dream Cycle</span>
            </button>
            <button
              onClick={handleToggleDaemon}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors ${
                state.enabled
                  ? 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{state.enabled ? 'Pause Daemon' : 'Enable Daemon'}</span>
            </button>
          </div>
        </div>

        {/* NPU Background Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-800">
          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Dedicated NPU Silicon</div>
            <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-red-400" />
              <span>{state.dedicatedNpuTiles} AIE-ML Tiles</span>
            </div>
            <div className="text-[10px] text-zinc-500">0% CPU / GPU contention</div>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Continuous Power Draw</div>
            <div className="text-xs font-semibold font-mono text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>{state.estimatedPowerWatts} Watts</span>
            </div>
            <div className="text-[10px] text-zinc-500">All-day battery friendly</div>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Primed Thoughts & Tools</div>
            <div className="text-xs font-semibold font-mono text-cyan-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>{primedItems.length} Staged Items</span>
            </div>
            <div className="text-[10px] text-zinc-500">Ready for conscious prompt</div>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Consolidated Nodes</div>
            <div className="text-xs font-semibold font-mono text-purple-300 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              <span>{memories.length} Durable Memories</span>
            </div>
            <div className="text-[10px] text-zinc-500">Synaptic plasticity verified</div>
          </div>
        </div>

        {dreamSuccessMessage && (
          <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/40 text-xs text-indigo-200 flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{dreamSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* Mind Architecture: Conscious vs Subconscious Flow Diagram */}
      <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-sm">
        <div className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Cognitive Bridge Architecture: Conscious Mind vs. Subconscious Daemon</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Conscious Mind */}
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-200">The Conscious Mind</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Foreground</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              The front-of-house AI model you actively chat with. Handles direct user query parsing, response composition, and active streaming.
            </p>
            <div className="text-[10px] font-mono text-cyan-400 pt-1 border-t border-zinc-800/80">
              Trigger: Direct user message
            </div>
          </div>

          {/* Subconscious Bus */}
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-purple-500/40 ring-1 ring-purple-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-300">Subconscious Synaptic Bus</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">NPU SRAM</span>
            </div>
            <p className="text-zinc-300 text-[11px] leading-relaxed">
              Direct high-bandwidth memory channel between the AIE-ML tile cache and context buffer. Pre-injects latent vectors before token generation starts.
            </p>
            <div className="text-[10px] font-mono text-purple-400 pt-1 border-t border-zinc-800/80">
              Throughput: &lt;1ms vector handoff
            </div>
          </div>

          {/* Subconscious Daemon */}
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-red-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-red-400">The Subconscious Mind</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">24/7 Daemon</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Runs continuously in the background at 3.8W. Pre-warms tools (Python, NPU Profiler), runs latent RAG similarity searches, and consolidates memory.
            </p>
            <div className="text-[10px] font-mono text-red-400 pt-1 border-t border-zinc-800/80">
              Status: Listening & Preparing
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time D3.js Sub-Agent Thought-Stream Monitor */}
      <ThoughtStreamD3Graph />

      {/* Interactive Sensory Sandbox: Test the Subconscious Live */}
      <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Interactive Sensory Input: Watch the Subconscious React</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">Live Simulation Sandbox</span>
        </div>

        <p className="text-xs text-zinc-400">
          Type any draft thought or inquiry. The subconscious will parse intent, pre-warm matching sub-agents, pull RAG vectors, and stage a whisper for the conscious mind.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={testSensoryInput}
            onChange={(e) => setTestSensoryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSimulateSensoryInput();
            }}
            placeholder="Type a draft thought (e.g. 'Can we run Python code to benchmark NPU tile heat?')..."
            className="flex-1 text-xs bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
          />

          <button
            onClick={() => handleSimulateSensoryInput()}
            disabled={isSimulating || !testSensoryInput.trim()}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>{isSimulating ? 'Cognitive Priming...' : 'Feed to Subconscious'}</span>
          </button>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-1">
          <span className="text-zinc-500 font-mono text-[10px] uppercase">Presets:</span>
          {[
            'Profile AMD NPU tile temperature and thermal throttling',
            'Write a Python script to benchmark INT4 vector multiplication',
            'Check Lemonade server sidecar connectivity on port 8000',
            'Explain human subconscious intuition in cognitive AI architectures',
          ].map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTestSensoryInput(sample);
                handleSimulateSensoryInput(sample);
              }}
              className="px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 text-[10px] whitespace-nowrap transition-colors"
            >
              {sample.slice(0, 32)}...
            </button>
          ))}
        </div>

        {/* Live Whisper Output */}
        {lastWhisper && (
          <div className="p-3 rounded-lg bg-zinc-950 border border-purple-500/40 text-xs space-y-1 mt-2">
            <div className="text-[10px] font-mono text-purple-400 font-semibold flex items-center gap-1">
              <Brain className="w-3.5 h-3.5" />
              <span>LATEST SUBCONSCIOUS WHISPER (STAGED FOR MAIN AGENT):</span>
            </div>
            <p className="text-zinc-200 leading-relaxed font-sans">{lastWhisper}</p>
          </div>
        )}
      </div>

      {/* Two Column Layout: Primed Items vs Inner Monologue Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Currently Primed Context & Pre-Warmed Sub-Agents */}
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Primed Context & Pre-Warmed Sub-Agents ({primedItems.length})</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">NPU SRAM Staged</span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {primedItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5 transition-all hover:border-zinc-700"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200 truncate pr-2">{item.source}</span>
                  <span className="text-[10px] font-mono text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 shrink-0">
                    Relevance: {(item.relevanceScore * 100).toFixed(0)}%
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                  {item.snippet}
                </p>

                {item.suggestedAction && (
                  <div className="text-[10px] font-mono text-cyan-400 pt-1 border-t border-zinc-900 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    <span>{item.suggestedAction}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Subconscious Stream of Consciousness (Inner Monologue) */}
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Subconscious Stream of Consciousness ({thoughts.length})</span>
            </div>
            <button
              onClick={() => engine.clearThoughts()}
              className="text-zinc-500 hover:text-zinc-300 text-[10px] font-mono transition-colors"
            >
              Clear Log
            </button>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {thoughts.map((th) => {
              const typeBadges = {
                primed_context: { label: 'Priming', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
                subagent_prewarm: { label: 'Pre-Warm', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
                intuition_whisper: { label: 'Intuition', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
                memory_consolidation: { label: 'Consolidation', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
                associative_leap: { label: 'Association', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
              };
              const badge = typeBadges[th.type] || typeBadges.primed_context;

              return (
                <div
                  key={th.id}
                  className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className={`px-1.5 py-0.2 rounded border ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-zinc-500">
                      {new Date(th.timestamp).toLocaleTimeString()} • Conf: {(th.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="font-semibold text-zinc-200 text-[11px]">{th.summary}</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">{th.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Long-Term Consolidated Memory Bank (Distilled by the Sleep/Dream Cycle) */}
      <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
            <Brain className="w-4 h-4 text-emerald-400" />
            <span>Consolidated Long-Term Memory Bank (Dreaming Cycles: #{state.consolidationCycleCount})</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">Synaptic Plasticity Weighted</span>
        </div>

        <p className="text-xs text-zinc-400">
          Just as the human brain replays and consolidates experiences during sleep, the subconscious engine extracts recurring facts and user preferences into durable memory vertices.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {memories.map((mem) => {
            const catColors = {
              user_profile: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300',
              technical_fact: 'border-red-500/30 bg-red-950/20 text-red-300',
              system_preference: 'border-amber-500/30 bg-amber-950/20 text-amber-300',
              conversation_insight: 'border-purple-500/30 bg-purple-950/20 text-purple-300',
            };
            const catStyle = catColors[mem.category] || catColors.technical_fact;

            return (
              <div
                key={mem.id}
                className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className={`px-1.5 py-0.2 rounded border ${catStyle} uppercase`}>
                      {mem.category.replace('_', ' ')}
                    </span>
                    <button
                      onClick={() => handleDeleteMemory(mem.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                      title="Prune memory"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="font-semibold text-zinc-200 text-xs">{mem.subject}</div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">{mem.insight}</p>
                </div>

                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>Synaptic Strength:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-emerald-400">{mem.synapticStrength}/10</span>
                    <div className="w-12 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full"
                        style={{ width: `${mem.synapticStrength * 10}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
