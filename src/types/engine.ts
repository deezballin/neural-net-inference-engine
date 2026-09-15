export type BackendType = 'amd_npu' | 'lemonade' | 'scratch_engine' | 'gemini_cloud';

export type QuantizationType = 'FP32' | 'FP16' | 'INT8' | 'INT4_AWQ' | 'INT4_GPTQ';

export interface HardwareStatus {
  isAmdNpuDetected: boolean;
  hardwareName: string;
  driverVersion: string;
  architecture: 'XDNA 1' | 'XDNA 2' | 'DirectML Emulated' | 'Not Detected';
  npuTops: number;
  activeTiles: number;
  totalTiles: number;
  clockMhz: number;
  memoryBandwidthGBs: number;
  temperatureC: number;
  sramUsedMB: number;
  sramTotalMB: number;
  executionProvider: 'VitisAIExecutionProvider' | 'DirectML' | 'XDNA_Native' | 'Emulated_SIMD';
  details: string;
  instructionsForNative: string[];
}

export interface LemonadeConfig {
  baseUrl: string;
  status: 'connected' | 'disconnected' | 'checking';
  activeModel: string;
  availableModels: string[];
  latencyMs: number;
  error?: string;
  lastChecked?: number;
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  toolResult?: unknown;
  timestamp: number;
  stats?: InferenceStats;
}

export interface InferenceStats {
  backendUsed: BackendType;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timeToFirstTokenMs: number;
  tokensPerSecond: number;
  totalTimeMs: number;
  quantization: QuantizationType;
  npuTilesUsed?: number;
  memoryFootprintMB: number;
}

export interface InferenceParams {
  prompt: string;
  messages?: ChatMessage[];
  systemPrompt?: string;
  temperature: number;
  topP: number;
  topK: number;
  maxTokens: number;
  repetitionPenalty?: number;
  backend: BackendType;
  model?: string;
  activePluginIds: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
  handlerCode?: string;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  type: 'tool' | 'memory' | 'npu_profiler' | 'code_runner' | 'custom';
  tools: ToolDefinition[];
  customHandlerCode?: string;
  createdAt: number;
}

export interface AgentStep {
  stepNumber: number;
  thought: string;
  action?: {
    tool: string;
    args: Record<string, unknown>;
  };
  observation?: string;
  timestamp: number;
}

export interface AgentSession {
  id: string;
  goal: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  steps: AgentStep[];
  finalAnswer?: string;
  error?: string;
  totalTokens: number;
  totalDurationMs: number;
}

export interface ScratchModelMeta {
  name: string;
  vocabSize: number;
  hiddenDim: number;
  numLayers: number;
  numHeads: number;
  numKvHeads: number;
  intermediateDim: number;
  contextLength: number;
  quantization: QuantizationType;
}

export interface RagChunk {
  id: string;
  docId: string;
  docTitle: string;
  content: string;
  chunkIndex: number;
  tokenCount: number;
  embeddingPreview: number[];
}

export interface RagDocument {
  id: string;
  title: string;
  fileName: string;
  fileType: 'txt' | 'md' | 'json' | 'code' | 'manual';
  content: string;
  uploadedAt: number;
  sizeBytes: number;
  chunkCount: number;
  chunks: RagChunk[];
}

export interface RagSearchResult {
  chunk: RagChunk;
  score: number; // 0 to 1 cosine similarity
  matchedTerms: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  backend: BackendType;
  messages: ChatMessage[];
  systemPrompt: string;
  temperature: number;
  topP: number;
  repetitionPenalty: number;
  useRag: boolean;
}

export interface BenchmarkRunResult {
  backend: BackendType;
  modelName: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  timeToFirstTokenMs: number;
  tokensPerSecond: number;
  totalTimeMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  memoryFootprintMB: number;
  responsePreview: string;
  error?: string;
}

export type SubconsciousActivity =
  | 'idle'
  | 'priming_context'
  | 'prewarming_agents'
  | 'dreaming_consolidation'
  | 'intuitive_inference';

export interface SubconsciousState {
  enabled: boolean;
  activity: SubconsciousActivity;
  dedicatedNpuTiles: number;
  estimatedPowerWatts: number;
  ticksProcessed: number;
  lastConsolidationTime: number;
  primedCount: number;
  consolidationCycleCount: number;
}

export interface SubconsciousThought {
  id: string;
  timestamp: number;
  type:
    | 'primed_context'
    | 'subagent_prewarm'
    | 'intuition_whisper'
    | 'memory_consolidation'
    | 'associative_leap';
  summary: string;
  detail: string;
  confidence: number; // 0 to 1
  associatedTopic: string;
  targetSubAgent?: string;
}

export interface PrimedContextItem {
  id: string;
  source: string;
  snippet: string;
  relevanceScore: number;
  suggestedAction?: string;
  prewarmedTool?: string;
}

export interface ConsolidatedMemoryNode {
  id: string;
  category: 'user_profile' | 'technical_fact' | 'system_preference' | 'conversation_insight';
  subject: string;
  insight: string;
  synapticStrength: number; // Plasticity score (1-10)
  createdAt: number;
  lastAccessed: number;
}
