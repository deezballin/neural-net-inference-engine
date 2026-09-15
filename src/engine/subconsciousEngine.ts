import {
  ConsolidatedMemoryNode,
  PrimedContextItem,
  SubconsciousActivity,
  SubconsciousState,
  SubconsciousThought,
} from '../types/engine';
import { RagEngine } from './ragEngine';

const STORAGE_KEY_MEMORIES = 'aether_subconscious_memories_v1';

export class SubconsciousEngine {
  private static instance: SubconsciousEngine;

  private state: SubconsciousState = {
    enabled: true,
    activity: 'idle',
    dedicatedNpuTiles: 2, // 2 dedicated AIE-ML tiles for background subconscious
    estimatedPowerWatts: 3.8, // Ultra low power on AMD NPU
    ticksProcessed: 142,
    lastConsolidationTime: Date.now() - 360000,
    primedCount: 3,
    consolidationCycleCount: 4,
  };

  private thoughts: SubconsciousThought[] = [
    {
      id: 'th-init-1',
      timestamp: Date.now() - 150000,
      type: 'primed_context',
      summary: 'Pre-fetched XDNA Tile Topology specs',
      detail: 'Anticipated user inquiry on AIE-ML INT4 matrix multiplication. Extracted 32MB local SRAM buffer layout from RAG.',
      confidence: 0.94,
      associatedTopic: 'AMD NPU Architecture',
    },
    {
      id: 'th-init-2',
      timestamp: Date.now() - 95000,
      type: 'subagent_prewarm',
      summary: 'Pre-warmed NPU Profiler Sub-Agent',
      detail: 'Allocated telemetry pipeline for 16 AIE-ML cores to reduce response delay to near-zero.',
      confidence: 0.88,
      associatedTopic: 'Telemetry Sub-Agent',
      targetSubAgent: 'npu_profiler',
    },
    {
      id: 'th-init-3',
      timestamp: Date.now() - 45000,
      type: 'intuition_whisper',
      summary: 'Intuition: User prefers local edge execution over cloud',
      detail: 'Observed recurring focus on offline INT4 AWQ models and low-latency benchmarks.',
      confidence: 0.91,
      associatedTopic: 'User Preference Model',
    },
  ];

  private primedItems: PrimedContextItem[] = [
    {
      id: 'prime-1',
      source: 'RAG: AMD Ryzen AI NPU Architecture',
      snippet: 'AMD XDNA architecture utilizes a spatial 2D array of AI Engine (AIE-ML) tiles with 2048-bit vector accumulators.',
      relevanceScore: 0.96,
      suggestedAction: 'Inject into attention prompt as primary reference',
      prewarmedTool: 'npu_profiler',
    },
    {
      id: 'prime-2',
      source: 'Memory: INT4 AWQ Precision',
      snippet: 'Activation-aware Weight Quantization protects salient 1% channels, yielding near-FP16 perplexity.',
      relevanceScore: 0.89,
      suggestedAction: 'Cite if user asks about accuracy vs speed',
    },
    {
      id: 'prime-3',
      source: 'Sub-Agent: Python Sandbox Worker',
      snippet: 'Environment initialized with NumPy matrix multiplication benchmark script.',
      relevanceScore: 0.84,
      suggestedAction: 'Ready to execute code snippets with zero cold-start',
      prewarmedTool: 'python_interpreter',
    },
  ];

  private memories: ConsolidatedMemoryNode[] = [];
  private listeners: Array<() => void> = [];
  private timer: NodeJS.Timeout | null = null;

  private constructor() {
    this.loadMemories();
    this.startBackgroundLoop();
  }

  public static getInstance(): SubconsciousEngine {
    if (!SubconsciousEngine.instance) {
      SubconsciousEngine.instance = new SubconsciousEngine();
    }
    return SubconsciousEngine.instance;
  }

  private loadMemories() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MEMORIES);
      if (stored) {
        this.memories = JSON.parse(stored);
        return;
      }
    } catch {}

    // Default seeded consolidated memories
    this.memories = [
      {
        id: 'mem-1',
        category: 'user_profile',
        subject: 'Hardware Environment',
        insight: 'User operates an AMD Ryzen AI system interested in NPU edge acceleration and local sidecars like Lemonade.',
        synapticStrength: 8,
        createdAt: Date.now() - 86400000,
        lastAccessed: Date.now() - 10000,
      },
      {
        id: 'mem-2',
        category: 'technical_fact',
        subject: 'Quantization Tradeoffs',
        insight: 'INT4 AWQ delivers 4x memory bandwidth compression with negligible perplexity degradation on 7B models.',
        synapticStrength: 9,
        createdAt: Date.now() - 72000000,
        lastAccessed: Date.now() - 25000,
      },
      {
        id: 'mem-3',
        category: 'system_preference',
        subject: 'Autonomous Agent Safety',
        insight: 'User requires transparent ReAct thought logs before tools execute high-consequence terminal commands.',
        synapticStrength: 7,
        createdAt: Date.now() - 54000000,
        lastAccessed: Date.now() - 60000,
      },
    ];
    this.saveMemories();
  }

  private saveMemories() {
    try {
      localStorage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(this.memories));
    } catch (e) {
      console.warn('Failed to save subconscious memories:', e);
    }
  }

  public getState(): SubconsciousState {
    return { ...this.state };
  }

  public getThoughts(): SubconsciousThought[] {
    return [...this.thoughts];
  }

  public getPrimedItems(): PrimedContextItem[] {
    return [...this.primedItems];
  }

  public getMemories(): ConsolidatedMemoryNode[] {
    return [...this.memories];
  }

  public toggleDaemon(enabled?: boolean) {
    this.state.enabled = enabled !== undefined ? enabled : !this.state.enabled;
    if (!this.state.enabled) {
      this.state.activity = 'idle';
      this.state.estimatedPowerWatts = 0.5;
    } else {
      this.state.estimatedPowerWatts = 3.8;
    }
    this.notify();
  }

  public setDedicatedTiles(tiles: number) {
    this.state.dedicatedNpuTiles = Math.max(1, Math.min(8, tiles));
    this.state.estimatedPowerWatts = +(this.state.dedicatedNpuTiles * 1.9).toFixed(1);
    this.notify();
  }

  /**
   * Continuous background ticker that simulates ambient subconscious processing
   */
  private startBackgroundLoop() {
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      if (!this.state.enabled) return;

      this.state.ticksProcessed++;

      // Ambient cognitive cycling
      const ambientRoll = Math.random();
      if (ambientRoll < 0.15) {
        // Trigger subtle ambient association
        this.generateAmbientAssociation();
      }

      this.notify();
    }, 4500);
  }

  private generateAmbientAssociation() {
    const associations = [
      {
        summary: 'Background cache audit',
        detail: 'SRAM tile buffers verified. 32MB local tile memory ready for next inference step.',
        topic: 'Hardware Cache',
        type: 'associative_leap' as const,
      },
      {
        summary: 'Synthesized memory link',
        detail: 'Reinforced connection between INT4 AWQ activation channels and AIE-ML vector throughput.',
        topic: 'Quantization & NPU',
        type: 'memory_consolidation' as const,
      },
      {
        summary: 'Pre-emptive query ready',
        detail: 'Pre-computed cosine distance across 4 latent document chunks for rapid context injection.',
        topic: 'RAG Pre-fetch',
        type: 'primed_context' as const,
      },
    ];

    const pick = associations[Math.floor(Math.random() * associations.length)];
    const thought: SubconsciousThought = {
      id: `th-${Date.now()}`,
      timestamp: Date.now(),
      type: pick.type,
      summary: pick.summary,
      detail: pick.detail,
      confidence: +(0.85 + Math.random() * 0.12).toFixed(2),
      associatedTopic: pick.topic,
    };

    this.thoughts = [thought, ...this.thoughts.slice(0, 19)];
  }

  /**
   * Process sensory input (user prompt or draft text)
   * This is where the subconscious leaps ahead of conscious thought!
   */
  public processSensoryInput(inputText: string): {
    primedItems: PrimedContextItem[];
    whisper: string;
    prewarmedTool?: string;
  } {
    if (!inputText.trim()) {
      return { primedItems: this.primedItems, whisper: '' };
    }

    this.state.activity = 'priming_context';

    const lower = inputText.toLowerCase();
    const rag = RagEngine.getInstance();
    const ragResults = rag.search(inputText, 2);

    const newPrimed: PrimedContextItem[] = [];
    let prewarmedTool: string | undefined;

    // 1. Detect sub-agent requirement
    if (lower.includes('code') || lower.includes('python') || lower.includes('math') || lower.includes('calculate')) {
      prewarmedTool = 'python_interpreter';
      newPrimed.push({
        id: `prime-tool-${Date.now()}`,
        source: 'Sub-Agent: Python Sandbox Core',
        snippet: 'Pre-allocated isolated execution sandbox for real-time mathematical calculation.',
        relevanceScore: 0.95,
        suggestedAction: 'Worker pre-warmed for instant code execution.',
        prewarmedTool: 'python_interpreter',
      });
    } else if (lower.includes('npu') || lower.includes('hardware') || lower.includes('temperature') || lower.includes('tile')) {
      prewarmedTool = 'npu_profiler';
      newPrimed.push({
        id: `prime-tool-${Date.now()}`,
        source: 'Sub-Agent: AMD NPU Telemetry Profiler',
        snippet: 'Real-time sampling active across 16 XDNA tiles and thermal convection zones.',
        relevanceScore: 0.98,
        suggestedAction: 'Core metrics ready for injection without query lag.',
        prewarmedTool: 'npu_profiler',
      });
    } else if (lower.includes('lemonade') || lower.includes('sidecar') || lower.includes('port')) {
      prewarmedTool = 'lemonade_sidecar';
      newPrimed.push({
        id: `prime-tool-${Date.now()}`,
        source: 'Sub-Agent: Lemonade Sidecar Bridge',
        snippet: 'TCP connection to localhost:8000 pre-flighted with active keep-alive header.',
        relevanceScore: 0.92,
        suggestedAction: 'Bridged proxy ready for model offload.',
        prewarmedTool: 'lemonade_sidecar',
      });
    }

    // 2. Add RAG chunks
    ragResults.forEach((res) => {
      newPrimed.push({
        id: `prime-rag-${res.chunk.id}`,
        source: `RAG: ${res.chunk.docTitle}`,
        snippet: res.chunk.content.slice(0, 160) + '...',
        relevanceScore: res.score,
        suggestedAction: 'Context primed for high-speed attention retrieval.',
      });
    });

    if (newPrimed.length > 0) {
      this.primedItems = [...newPrimed, ...this.primedItems.slice(0, 3)];
    }

    // 3. Generate Intuitive Whisper
    const whisper = `Subconscious Whisper: Anticipating query regarding "${inputText.slice(0, 24)}...". Primed ${ragResults.length} RAG vectors${prewarmedTool ? ` and pre-warmed sub-agent '${prewarmedTool}'` : ''}.`;

    const newThought: SubconsciousThought = {
      id: `th-${Date.now()}`,
      timestamp: Date.now(),
      type: prewarmedTool ? 'subagent_prewarm' : 'intuition_whisper',
      summary: `Sensory Priming: "${inputText.slice(0, 28)}..."`,
      detail: whisper,
      confidence: +(0.88 + Math.random() * 0.1).toFixed(2),
      associatedTopic: 'Active Attention Priming',
      targetSubAgent: prewarmedTool,
    };

    this.thoughts = [newThought, ...this.thoughts.slice(0, 19)];
    this.state.primedCount = this.primedItems.length;
    this.state.activity = 'idle';
    this.notify();

    return {
      primedItems: this.primedItems,
      whisper,
      prewarmedTool,
    };
  }

  /**
   * The "Dreaming / Sleep" Consolidation Cycle
   * Consolidates short-term thoughts and conversations into long-term structured memory nodes
   */
  public triggerDreamConsolidationCycle(recentTexts?: string[]): {
    consolidatedNodes: ConsolidatedMemoryNode[];
    cycleSummary: string;
  } {
    this.state.activity = 'dreaming_consolidation';
    this.state.consolidationCycleCount++;
    this.state.lastConsolidationTime = Date.now();

    const timestamp = Date.now();
    const newInsights: ConsolidatedMemoryNode[] = [];

    // Synthesize new insights or reinforce existing ones
    if (recentTexts && recentTexts.length > 0) {
      const combined = recentTexts.join(' ');
      if (combined.toLowerCase().includes('amd') || combined.toLowerCase().includes('npu')) {
        newInsights.push({
          id: `mem-dream-${timestamp}-1`,
          category: 'technical_fact',
          subject: 'NPU Architecture Priority',
          insight: 'Confirmed high priority on AMD XDNA low-power INT4 matrix computation over power-hungry GPU offloading.',
          synapticStrength: 10,
          createdAt: timestamp,
          lastAccessed: timestamp,
        });
      }
      if (combined.toLowerCase().includes('subconcious') || combined.toLowerCase().includes('sub agent') || combined.toLowerCase().includes('human')) {
        newInsights.push({
          id: `mem-dream-${timestamp}-2`,
          category: 'user_profile',
          subject: 'Cognitive Architecture Preference',
          insight: 'User values human-like subconscious pre-fetching and autonomous background sub-agents running continuously.',
          synapticStrength: 10,
          createdAt: timestamp,
          lastAccessed: timestamp,
        });
      }
    } else {
      // Default consolidation cycle
      newInsights.push({
        id: `mem-dream-${timestamp}`,
        category: 'conversation_insight',
        subject: 'Autonomous Daemon Consolidation',
        insight: `Cycle #${this.state.consolidationCycleCount}: Pruned redundant vector cache, strengthened synaptic weight of active RAG documents.`,
        synapticStrength: 8,
        createdAt: timestamp,
        lastAccessed: timestamp,
      });
    }

    // Merge and strengthen existing nodes (synaptic plasticity)
    this.memories = [
      ...newInsights,
      ...this.memories.map((m) => ({
        ...m,
        synapticStrength: Math.min(10, m.synapticStrength + 1),
        lastAccessed: timestamp,
      })),
    ].slice(0, 12);

    this.saveMemories();

    const dreamThought: SubconsciousThought = {
      id: `th-dream-${timestamp}`,
      timestamp,
      type: 'memory_consolidation',
      summary: `Sleep & Dream Cycle #${this.state.consolidationCycleCount} Completed`,
      detail: `Consolidated ${newInsights.length} new semantic nodes into long-term memory. Synaptic weights reinforced across ${this.memories.length} knowledge vertices.`,
      confidence: 0.98,
      associatedTopic: 'Memory Consolidation',
    };

    this.thoughts = [dreamThought, ...this.thoughts.slice(0, 19)];
    this.state.activity = 'idle';
    this.notify();

    return {
      consolidatedNodes: newInsights,
      cycleSummary: dreamThought.detail,
    };
  }

  public deleteMemoryNode(id: string) {
    this.memories = this.memories.filter((m) => m.id !== id);
    this.saveMemories();
    this.notify();
  }

  public clearThoughts() {
    this.thoughts = [];
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}
