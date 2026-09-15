import React, { useState } from 'react';
import {
  BookOpen,
  Cpu,
  Layers,
  Zap,
  Sliders,
  Database,
  Bot,
  Sparkles,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Flame,
  Binary,
  Code,
  Check,
} from 'lucide-react';

export const PrimerTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'hardware' | 'quantization' | 'tokens' | 'kvcache' | 'sampling' | 'rag' | 'agents'>('hardware');

  // Interactive Tokenizer Sandbox
  const [tokenTestInput, setTokenTestInput] = useState('AMD Ryzen AI accelerates INT4 transformers.');
  
  // Interactive Quantization Slider (Parameters: 7B model)
  const [quantBits, setQuantBits] = useState<number>(4);

  // Interactive Temperature Slider
  const [testTemperature, setTestTemperature] = useState<number>(0.7);

  // Token simulator helper
  const tokenize = (text: string) => {
    const parts = text.match(/\b\w+\b|[^\w\s]|\s+/g) || [];
    return parts.map((part, index) => {
      let hash = 0;
      for (let i = 0; i < part.length; i++) hash = (hash << 5) - hash + part.charCodeAt(i);
      const id = Math.abs(hash) % 32000;
      return { text: part, id, index };
    });
  };

  const tokens = tokenize(tokenTestInput);

  // Quantization memory calculations for 7 Billion parameter model
  const getModelSizeGB = (bits: number) => {
    return +((7 * bits) / 8).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-100">
                  AI Architecture & Engineering Primer (AI 101)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  Interactive Guide
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Clear, visual, plain-English explanations of how modern AI models, NPUs, and inference engines actually work.
              </p>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-800">
          {[
            { id: 'hardware', label: '1. NPU vs. GPU vs. CPU', icon: Cpu },
            { id: 'tokens', label: '2. Tokens & Embeddings', icon: Binary },
            { id: 'quantization', label: '3. INT4 & Quantization', icon: Layers },
            { id: 'kvcache', label: '4. KV-Cache & Memory', icon: Zap },
            { id: 'sampling', label: '5. Temperature & Sampling', icon: Sliders },
            { id: 'rag', label: '6. RAG (Knowledge Bases)', icon: Database },
            { id: 'agents', label: '7. Autonomous ReAct Agents', icon: Bot },
          ].map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area based on selected section */}
      <div className="p-6 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-6 shadow-sm">
        {/* SECTION 1: NPU vs. GPU vs. CPU */}
        {activeSection === 'hardware' && (
          <div className="space-y-6">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-red-400" />
                <span>Why do we need an NPU? (NPU vs. GPU vs. CPU)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Understanding why modern laptops like AMD Ryzen AI include dedicated neural silicon.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-200">
                  <span>Central Processing Unit (CPU)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">Sequential</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Fast single-core clock speeds with large L3 caches, designed to run complex operating systems and branching logic. However, calculating billions of matrix multiplications causes high battery drain and thermal throttling.
                </p>
                <div className="text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-800">
                  Best for: Logic, OS, file I/O
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-200">
                  <span>Graphics Processing Unit (GPU)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">SIMD Massive</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Thousands of parallel vector cores with massive memory bandwidth (GDDR6/HBM). Fantastic throughput for gaming and model training, but can consume 50W to 400W of power, creating fan noise and rapid battery drain on laptops.
                </p>
                <div className="text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-800">
                  Best for: Model training, graphics
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-red-500/40 ring-1 ring-red-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-red-400">
                  <span>Neural Processing Unit (NPU)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-500/20 text-red-300">Systolic Mesh</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Purpose-built 2D spatial array (AIE-ML tiles) with dedicated high-speed tile SRAM. Data streams directly from core to core without constantly touching battery-draining DRAM. Runs 50 TOPS at only 3W to 15W!
                </p>
                <div className="text-[11px] font-mono text-emerald-400 pt-2 border-t border-zinc-800">
                  Best for: All-day background AI inference
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-300 space-y-2">
              <span className="font-semibold text-zinc-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>The Big Takeaway: TOPS per Watt</span>
              </span>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                NPUs don't replace GPUs for heavy training; they allow your laptop to run live voice transcription, local copilot reasoning, and vision detection in the background silently without spinning fans or draining your battery.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 2: Tokens & Embeddings */}
        {activeSection === 'tokens' && (
          <div className="space-y-6">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Binary className="w-5 h-5 text-cyan-400" />
                <span>What is a Token? (Byte-Pair Encoding & Embeddings)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Computers cannot read text—they only understand numbers. See how words turn into tokens and vectors.
              </p>
            </div>

            {/* Interactive Tokenizer Playground */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <label className="block text-xs font-semibold text-zinc-300">
                Type any sentence below to see live sub-word tokenization:
              </label>
              <input
                type="text"
                value={tokenTestInput}
                onChange={(e) => setTokenTestInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500 font-mono"
              />

              {/* Rendered Colored Tokens */}
              <div className="pt-2">
                <div className="text-[11px] text-zinc-400 mb-1.5">
                  Split into {tokens.length} tokens (~{(tokens.length / (tokenTestInput.split(' ').length || 1)).toFixed(1)} tokens/word):
                </div>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
                  {tokens.map((tok, idx) => {
                    const colors = [
                      'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
                      'bg-purple-500/20 text-purple-300 border-purple-500/30',
                      'bg-amber-500/20 text-amber-300 border-amber-500/30',
                      'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                      'bg-rose-500/20 text-rose-300 border-rose-500/30',
                    ];
                    const color = colors[idx % colors.length];
                    return (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded text-xs font-mono border flex items-center gap-1.5 ${color}`}
                      >
                        <span className="font-bold">{tok.text.replace(' ', '␣')}</span>
                        <span className="text-[9px] opacity-70">#{tok.id}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-300">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="font-semibold text-zinc-100">Why not just use characters or full words?</div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  If models processed every single character, sequences would be too long. If they processed only full words, their vocabulary would need millions of dictionary entries for typos, code, and conjugations. <strong>Byte-Pair Encoding (BPE)</strong> finds the perfect middle ground by combining frequent syllables into ~32,000 sub-word tokens.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="font-semibold text-zinc-100">From Token IDs to Dense Embeddings</div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Each token ID points to a row in an embedding matrix. A token is translated into a list of 2,048 or 4,096 numbers (a high-dimensional vector) where semantically related words ("king" and "queen", or "cat" and "kitten") sit close together in geometric space.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: INT4 & Quantization */}
        {activeSection === 'quantization' && (
          <div className="space-y-6">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>What is Quantization? (FP16 vs. INT8 vs. INT4 AWQ)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                How squeezing 16-bit floating point numbers into 4-bit integers makes huge models fit in your RAM.
              </p>
            </div>

            {/* Interactive Model Size Calculator */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200">
                  Select Precision Bit-Width (Simulating a 7 Billion Parameter Model):
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {quantBits === 32 ? 'FP32 (32-bit float)' : quantBits === 16 ? 'FP16 (Half precision)' : quantBits === 8 ? 'INT8 (8-bit integer)' : 'INT4 AWQ (4-bit integer)'}
                </span>
              </div>

              <div className="flex gap-2">
                {[32, 16, 8, 4].map((bits) => (
                  <button
                    key={bits}
                    onClick={() => setQuantBits(bits)}
                    className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all border ${
                      quantBits === bits
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {bits}-bit ({bits === 4 ? 'INT4' : bits === 8 ? 'INT8' : bits === 16 ? 'FP16' : 'FP32'})
                  </button>
                ))}
              </div>

              {/* Memory Footprint Visualizer */}
              <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-mono">
                    Required VRAM / SRAM Memory
                  </div>
                  <div className="text-2xl font-mono font-bold text-zinc-100 mt-0.5">
                    {getModelSizeGB(quantBits)} GB
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {quantBits === 4 ? '🔥 Fits comfortably on local NPU & standard laptop RAM!' : quantBits === 8 ? 'Moderate footprint, fits on 16GB laptops.' : 'Requires high-end desktop GPU or server.'}
                  </div>
                </div>

                <div className="w-full sm:w-64 bg-zinc-950 h-3 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      quantBits === 4 ? 'bg-emerald-400 w-1/4' : quantBits === 8 ? 'bg-amber-400 w-2/4' : quantBits === 16 ? 'bg-orange-500 w-3/4' : 'bg-red-500 w-full'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-300">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="font-semibold text-zinc-100">Doesn't INT4 lose quality?</div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Old naive quantization rounded numbers uniformly, which ruined the model's accuracy. Modern <strong>AWQ (Activation-aware Weight Quantization)</strong> observes which 1% of weight channels are critical to reasoning and protects their scale factors, preserving 99% of original perplexity while cutting memory by 75%!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="font-semibold text-zinc-100">Why INT4 is faster on NPUs</div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Text generation is <strong>memory-bandwidth bound</strong>. The processor spends 90% of its time waiting for weights to travel from RAM across the bus. Squeezing weights into 4 bits quadruples the effective throughput of your memory bus.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: KV-Cache */}
        {activeSection === 'kvcache' && (
          <div className="space-y-6">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span>What is the KV-Cache? (Key-Value Cache)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                The reason long conversations get slower and consume more memory as they grow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-zinc-950 border border-red-500/30 space-y-2">
                <div className="font-bold text-red-400">Without KV-Cache (O(N²) Disaster)</div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  When generating token #500, the model would have to re-read and re-compute the attention projections for tokens 1 through 499 from scratch. Token #501 would do all 500 again. The system slows to an absolute crawl.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/30 space-y-2">
                <div className="font-bold text-emerald-400">With KV-Cache (O(1) Step Cost)</div>
                <p className="text-zinc-300 leading-relaxed text-[11px]">
                  The model caches the Key (K) and Value (V) matrices of previous tokens in high-speed SRAM. When generating token #500, it only computes the Query (Q) for that single token and looks up past K/V in the cache.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
              <div className="font-semibold text-zinc-200">The Trade-off: Context Memory Growth</div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                While KV-caching saves CPU/NPU compute cycles, it eats RAM. An 8K context conversation can consume over 1 GB of memory solely for the KV cache. This is why architectures use <strong>Grouped-Query Attention (GQA)</strong> to share 8 KV heads across 32 attention heads, cutting KV-cache size by 75%.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 5: Temperature & Sampling */}
        {activeSection === 'sampling' && (
          <div className="space-y-6">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                <span>How Sampling Works: Temperature, Top-P, and Repetition Penalty</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Controlling creativity vs. precision in generative text output.
              </p>
            </div>

            {/* Interactive Temperature Slider */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200">
                  Interactive Temperature Slider:
                </span>
                <span className="text-xs font-mono font-bold text-purple-400">
                  {testTemperature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.05"
                value={testTemperature}
                onChange={(e) => setTestTemperature(parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono pt-1 text-zinc-400">
                <div className={testTemperature < 0.3 ? 'text-cyan-300 font-bold' : ''}>
                  0.0–0.3: Deterministic, Code, Math
                </div>
                <div className={testTemperature >= 0.3 && testTemperature <= 0.8 ? 'text-purple-300 font-bold' : ''}>
                  0.7: Balanced Assistant Chat
                </div>
                <div className={testTemperature > 0.8 ? 'text-rose-300 font-bold' : ''}>
                  1.0+: Highly Creative / Random
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="font-semibold text-zinc-200">Temperature</div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Divides the model's logits before Softmax. Low temperature sharpens the distribution, forcing the model to pick only the single most likely token. High temperature flattens probabilities, giving less common words a chance to be picked.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="font-semibold text-zinc-200">Top-P (Nucleus Sampling)</div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Cuts off the "long tail" of nonsensical words. Top-P = 0.9 means the model only considers the pool of top candidates whose combined probabilities add up to 90%, discarding absurd choices.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="font-semibold text-zinc-200">Repetition Penalty</div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Penalizes tokens that have already appeared in the recent context window. Setting this to 1.15 prevents the model from getting trapped in repetitive linguistic loops.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: RAG */}
        {activeSection === 'rag' && (
          <div className="space-y-6">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <span>What is RAG? (Retrieval-Augmented Generation)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                How to give AI your private documents without expensive retraining.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 font-bold">Step 1: Ingestion</span>
                <div className="font-semibold text-zinc-200">Upload & Chunk</div>
                <p className="text-[11px] text-zinc-400">
                  Documents are split into 300–500 character chunks with small overlaps.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 font-bold">Step 2: Vectorize</span>
                <div className="font-semibold text-zinc-200">Dense Embeddings</div>
                <p className="text-[11px] text-zinc-400">
                  Each chunk is transformed into a vector (a list of numbers representing meaning).
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 font-bold">Step 3: Retrieve</span>
                <div className="font-semibold text-zinc-200">Similarity Search</div>
                <p className="text-[11px] text-zinc-400">
                  When a question is asked, cosine similarity finds the closest matching chunks.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-cyan-500/40 space-y-1">
                <span className="text-[10px] font-mono text-cyan-300 font-bold">Step 4: Generate</span>
                <div className="font-semibold text-zinc-200">Augmented Prompt</div>
                <p className="text-[11px] text-zinc-300">
                  The model receives both the question and the verified chunks, eliminating hallucinations!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 7: Autonomous Agents */}
        {activeSection === 'agents' && (
          <div className="space-y-6">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Bot className="w-5 h-5 text-rose-400" />
                <span>What are AI Agents? (The ReAct Loop)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Going beyond text generation to let AI execute tools and solve real-world problems.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="text-xs font-semibold text-zinc-200">
                The ReAct Paradigm: Reason + Act
              </div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center flex-1 w-full">
                  <div className="text-[10px] font-mono text-purple-400">1. THOUGHT</div>
                  <div className="font-semibold text-zinc-200 mt-1">"I need to query the NPU telemetry."</div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0 hidden md:block" />
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center flex-1 w-full">
                  <div className="text-[10px] font-mono text-amber-400">2. ACTION</div>
                  <div className="font-semibold text-zinc-200 mt-1">npu_profiler.get_status()</div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0 hidden md:block" />
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center flex-1 w-full">
                  <div className="text-[10px] font-mono text-cyan-400">3. OBSERVATION</div>
                  <div className="font-semibold text-zinc-200 mt-1">Active tiles: 16, 48.2 TOPS</div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0 hidden md:block" />
                <div className="p-3 rounded-lg bg-zinc-900 border border-emerald-500/40 text-center flex-1 w-full">
                  <div className="text-[10px] font-mono text-emerald-400">4. FINAL ANSWER</div>
                  <div className="font-semibold text-zinc-200 mt-1">"NPU is running at peak capacity."</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
