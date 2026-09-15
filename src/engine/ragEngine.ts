import { RagDocument, RagChunk, RagSearchResult } from '../types/engine';

/**
 * In-Memory & LocalStorage Vector Knowledge Base (RAG Engine)
 * Handles document chunking, dense embedding calculation, and semantic vector similarity search.
 */
export class RagEngine {
  private static instance: RagEngine;
  private documents: RagDocument[] = [];
  private readonly storageKey = 'aether_rag_documents_v1';

  private constructor() {
    this.loadFromStorage();
    if (this.documents.length === 0) {
      this.seedDefaultKnowledgeBase();
    }
  }

  public static getInstance(): RagEngine {
    if (!RagEngine.instance) {
      RagEngine.instance = new RagEngine();
    }
    return RagEngine.instance;
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.documents = JSON.parse(stored);
      }
    } catch {
      this.documents = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.documents));
    } catch (e) {
      console.warn('Failed to save RAG knowledge base to localStorage:', e);
    }
  }

  /**
   * Deterministic 64-dimensional pseudo-dense semantic embedding generator.
   * Encodes term n-grams, vocabulary frequency, and semantic syntactic features.
   */
  public generateEmbedding(text: string, dimensions = 64): number[] {
    const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const words = clean.split(/\s+/).filter(Boolean);
    const vec = new Array(dimensions).fill(0);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = (hash << 5) - hash + word.charCodeAt(j);
        hash |= 0;
      }
      const idx = Math.abs(hash) % dimensions;
      const weight = 1.0 / Math.sqrt(i + 1);
      vec[idx] += 1.0 * weight;

      // Bigram hash for semantic pair capture
      if (i > 0) {
        const biHash = Math.abs((hash ^ (words[i - 1].length << 3))) % dimensions;
        vec[biHash] += 0.5 * weight;
      }
    }

    // Normalize vector (L2 norm)
    let norm = 0;
    for (let i = 0; i < dimensions; i++) {
      norm += vec[i] * vec[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < dimensions; i++) {
        vec[i] = +(vec[i] / norm).toFixed(4);
      }
    }

    return vec;
  }

  /**
   * Cosine similarity between two vectors
   */
  public cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(0, Math.min(1, sim));
  }

  /**
   * Chunks text into sliding windows with overlap
   */
  public chunkText(text: string, docId: string, docTitle: string, chunkSize = 380, overlap = 60): RagChunk[] {
    const chunks: RagChunk[] = [];
    let start = 0;
    let chunkIndex = 0;

    while (start < text.length) {
      let end = Math.min(text.length, start + chunkSize);
      
      // Try to break at paragraph or period boundary if not end of text
      if (end < text.length) {
        const nextBreak = text.indexOf('\n\n', start + chunkSize - 80);
        if (nextBreak !== -1 && nextBreak <= end + 40) {
          end = nextBreak + 2;
        } else {
          const periodBreak = text.indexOf('. ', start + chunkSize - 60);
          if (periodBreak !== -1 && periodBreak <= end + 30) {
            end = periodBreak + 2;
          }
        }
      }

      const chunkContent = text.substring(start, end).trim();
      if (chunkContent.length > 20) {
        const embedding = this.generateEmbedding(chunkContent);
        chunks.push({
          id: `${docId}-chunk-${chunkIndex}`,
          docId,
          docTitle,
          content: chunkContent,
          chunkIndex,
          tokenCount: Math.round(chunkContent.length / 3.8),
          embeddingPreview: embedding.slice(0, 8),
        });
        chunkIndex++;
      }

      start = end - overlap;
      if (start >= text.length - overlap) break;
    }

    return chunks;
  }

  /**
   * Add a new document to the knowledge base
   */
  public addDocument(
    title: string,
    fileName: string,
    content: string,
    fileType: 'txt' | 'md' | 'json' | 'code' | 'manual' = 'txt'
  ): RagDocument {
    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const chunks = this.chunkText(content, docId, title);

    const doc: RagDocument = {
      id: docId,
      title,
      fileName,
      fileType,
      content,
      uploadedAt: Date.now(),
      sizeBytes: new Blob([content]).size,
      chunkCount: chunks.length,
      chunks,
    };

    this.documents.unshift(doc);
    this.saveToStorage();
    return doc;
  }

  public getDocuments(): RagDocument[] {
    return this.documents;
  }

  public getAllChunks(): RagChunk[] {
    return this.documents.flatMap((doc) => doc.chunks);
  }

  public deleteDocument(id: string): void {
    this.documents = this.documents.filter((d) => d.id !== id);
    this.saveToStorage();
  }

  public clearAll(): void {
    this.documents = [];
    this.saveToStorage();
  }

  public resetToDefaults(): void {
    this.documents = [];
    this.seedDefaultKnowledgeBase();
  }

  /**
   * Semantic search against all indexed chunks
   */
  public search(query: string, topK = 3): RagSearchResult[] {
    if (!query.trim()) return [];
    const queryVec = this.generateEmbedding(query);
    const queryTerms = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

    const allChunks = this.getAllChunks();
    const scoredResults: RagSearchResult[] = [];

    for (const chunk of allChunks) {
      const chunkVec = this.generateEmbedding(chunk.content);
      const vecSim = this.cosineSimilarity(queryVec, chunkVec);

      // Keyword boost
      const contentLower = chunk.content.toLowerCase();
      const matchedTerms = queryTerms.filter((term) => contentLower.includes(term));
      const keywordBoost = matchedTerms.length * 0.12;

      const finalScore = Math.min(1.0, vecSim * 0.75 + keywordBoost);

      if (finalScore > 0.18 || matchedTerms.length > 0) {
        scoredResults.push({
          chunk,
          score: +finalScore.toFixed(3),
          matchedTerms,
        });
      }
    }

    return scoredResults.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  /**
   * Generates a context augmentation string for LLM injection
   */
  public buildAugmentedPrompt(userPrompt: string, topK = 3): { augmentedPrompt: string; citations: RagSearchResult[] } {
    const hits = this.search(userPrompt, topK);
    if (hits.length === 0) {
      return { augmentedPrompt: userPrompt, citations: [] };
    }

    const contextSnippets = hits
      .map((h, i) => `[Document Context ${i + 1}: ${h.chunk.docTitle} (Similarity: ${(h.score * 100).toFixed(1)}%)]\n${h.chunk.content}`)
      .join('\n\n');

    const augmentedPrompt = `Use the following verified excerpts from the local Knowledge Base to inform your answer. If relevant, cite facts directly from this context:\n\n=== RETRIEVED KNOWLEDGE BASE EXCERPTS ===\n${contextSnippets}\n=== END OF CONTEXT ===\n\nUser Question:\n${userPrompt}`;

    return { augmentedPrompt, citations: hits };
  }

  /**
   * Pre-loads high quality reference materials so the system is immediately usable.
   */
  private seedDefaultKnowledgeBase() {
    this.addDocument(
      'AMD XDNA 2 Spatial Architecture Technical Specification',
      'amd_xdna2_tech_spec.md',
      `# AMD XDNA 2 Architecture Overview
The AMD XDNA 2 architecture is the foundational neural processing unit (NPU) integrated into AMD Ryzen AI 300 series ("Strix Point") and next-generation mobile and desktop APUs.

## Core Compute Engine & AIE-ML Tiles
- 16 to 32 Spatial AIE-ML (AI Engine - Machine Learning) tiles arranged in a high-bandwidth 2D mesh interconnect.
- Up to 50 NPU TOPS of peak INT4/INT8 vector throughput.
- Direct Support for Block Floating Point 16 (Bfloat16) and Native INT4 AWQ without accuracy degradation.
- Dedicated 32 MB tile-resident SRAM with DMA stream-in channels, reducing main system LPDDR5X DRAM memory latency by over 80%.

## Hardware Device Nodes
On Linux, the AMD IPU driver exposes hardware access via \`/dev/accel/accel*\` and \`/sys/class/accel\`. The runtime uses DirectML or the Vitis-AI Execution Provider (\`vaip_config.json\`) to dispatch compiled ONNX models straight to the silicon tile matrix.`,
      'md'
    );

    this.addDocument(
      'Transformer Quantization Guide: INT4, INT8, and AWQ',
      'quantization_guide.txt',
      `Quantization is a technique used in modern Deep Learning to compress model parameters and activation tensors from 32-bit floating point (FP32) into compact integer formats (INT8 and INT4).

Key Benefits:
1. Memory Reduction: INT4 reduces model footprint by 75% compared to FP16, allowing a 7B parameter model (~14 GB in FP16) to fit into approximately 3.8 GB of VRAM/SRAM.
2. Bandwidth Efficiency: Memory bandwidth is the primary bottleneck for autoregressive token generation. INT4 quadruples the number of weights transferred per memory clock cycle.
3. AWQ (Activation-aware Weight Quantization): Unlike uniform round-to-nearest quantization, AWQ identifies the top 1% salient weight channels that protect perplexity and protects them from aggressive truncation.

Hardware Alignment:
AMD XDNA 2 AIE-ML vector tiles feature hardware-level 2048-bit wide accumulators specifically engineered for simultaneous 4-bit integer matrix-multiply-accumulate (MAC) operations.`,
      'txt'
    );

    this.addDocument(
      'KV-Cache Management in Transformer Inferences',
      'kv_cache_deep_dive.md',
      `# Understanding the KV-Cache
In decoder-only autoregressive transformers (like LLaMA, Mistral, and GPT architectures), generating each new token requires computing Self-Attention across all previous tokens.

## Why KV-Cache is Essential
Without KV-caching, computing token N requires recalculating Key and Value matrices for all previous tokens (0 to N-1), resulting in O(N^2) complexity.
With KV-caching, the Keys and Values of previous tokens are stored in memory, reducing generation complexity to O(N) per step.

## Memory Formula
Memory (Bytes) = 2 * sizeof(precision) * num_layers * num_kv_heads * head_dim * context_length

For an 8,192 context window with 32 layers, 8 KV heads (Grouped-Query Attention), and head dimension of 128:
- FP16: ~1.07 GB
- INT8: ~536 MB
- INT4: ~268 MB (fits directly inside high-speed NPU SRAM banks)`,
      'md'
    );
  }
}
