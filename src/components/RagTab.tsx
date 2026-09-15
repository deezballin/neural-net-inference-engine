import React, { useState, useRef } from 'react';
import {
  Database,
  Upload,
  Search,
  FileText,
  Trash2,
  Plus,
  Sparkles,
  Layers,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Code,
  Tag,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { RagEngine } from '../engine/ragEngine';
import { RagDocument, RagChunk, RagSearchResult } from '../types/engine';

export const RagTab: React.FC = () => {
  const rag = RagEngine.getInstance();
  const [documents, setDocuments] = useState<RagDocument[]>(rag.getDocuments());
  const [selectedDoc, setSelectedDoc] = useState<RagDocument | null>(documents[0] || null);
  const [activeChunkModal, setActiveChunkModal] = useState<RagChunk | null>(null);

  // Search tester state
  const [searchQuery, setSearchQuery] = useState('What are the memory benefits of INT4 AWQ on XDNA 2?');
  const [searchResults, setSearchResults] = useState<RagSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshDocs = () => {
    const docs = rag.getDocuments();
    setDocuments([...docs]);
    if (selectedDoc) {
      const updated = docs.find((d) => d.id === selectedDoc.id);
      setSelectedDoc(updated || docs[0] || null);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const results = rag.search(searchQuery, 4);
    setSearchResults(results);
    setHasSearched(true);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
        const fileType = (['txt', 'md', 'json', 'code'].includes(ext) ? ext : 'txt') as 'txt' | 'md' | 'json' | 'code';
        const doc = rag.addDocument(file.name.replace(/\.[^/.]+$/, ''), file.name, text, fileType);
        setSelectedDoc(doc);
      } catch (err) {
        console.error('Failed to read file:', err);
      }
    }
    refreshDocs();
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualContent.trim()) return;
    const doc = rag.addDocument(manualTitle.trim(), `${manualTitle.trim().toLowerCase().replace(/\s+/g, '_')}.md`, manualContent.trim(), 'manual');
    setManualTitle('');
    setManualContent('');
    setShowAddManual(false);
    setSelectedDoc(doc);
    refreshDocs();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    rag.deleteDocument(id);
    refreshDocs();
  };

  const handleResetDefaults = () => {
    rag.resetToDefaults();
    refreshDocs();
  };

  const allChunksCount = rag.getAllChunks().length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-100">
                  RAG (Retrieval-Augmented Generation) & Knowledge Base
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Vector Engine
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Ground model inferences in your private documents, architecture specs, and custom guides.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-right">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Indexed Docs</div>
              <div className="text-xs font-mono font-bold text-zinc-200">{documents.length}</div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-right">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Vector Chunks</div>
              <div className="text-xs font-mono font-bold text-cyan-400">{allChunksCount}</div>
            </div>
            <button
              onClick={handleResetDefaults}
              title="Reset to default reference docs"
              className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Explainers for beginner users */}
        <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-300 flex items-start gap-2.5">
          <BookOpen className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-zinc-200">How RAG works in this engine</div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              1. <strong>Chunking</strong> breaks documents into 350-character overlapping semantic snippets. 
              2. <strong>Vectorization</strong> computes a dense 64-dimensional semantic embedding for each chunk. 
              3. When you prompt the model (or test search below), the vector engine performs cosine similarity search to retrieve the most relevant facts and feeds them directly into the context window.
            </p>
          </div>
        </div>
      </div>

      {/* Semantic Search Tester Section */}
      <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              Semantic Vector Similarity Tester
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">Cosine Similarity Matching (Top-4)</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Type a query to search vector embeddings..."
            className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:border-cyan-500 focus:outline-none"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-zinc-100 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Vectors</span>
          </button>
        </div>

        {/* Search Results Display */}
        {hasSearched && (
          <div className="space-y-3 pt-2">
            <div className="text-xs text-zinc-400">
              Matched {searchResults.length} relevant vector chunks for query: <span className="text-cyan-300 font-mono">"{searchQuery}"</span>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {searchResults.map((result, idx) => (
                  <div
                    key={result.chunk.id}
                    className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-cyan-500/50 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-200 truncate flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-cyan-500/20 text-cyan-300 text-[10px] flex items-center justify-center font-mono">
                          #{idx + 1}
                        </span>
                        {result.chunk.docTitle}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        result.score > 0.5 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {(result.score * 100).toFixed(1)}% Match
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-300 leading-relaxed font-sans bg-zinc-900/60 p-2 rounded border border-zinc-800/80">
                      {result.chunk.content}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
                      <span>Chunk index: {result.chunk.chunkIndex}</span>
                      <span>{result.chunk.tokenCount} tokens</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-zinc-950 text-center text-xs text-zinc-500">
                No matching chunks found above the similarity threshold. Try rephrasing your search query.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Studio Grid: Document Library & Chunk Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Document Upload & List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileUpload(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/20'
                : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files)}
              multiple
              accept=".txt,.md,.json,.py,.ts,.js,.c,.cpp,.h"
              className="hidden"
            />
            <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <div className="text-xs font-semibold text-zinc-200">
              Drag & drop files or click to upload
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              Supports .txt, .md, .json, source code (.py, .ts, .cpp)
            </p>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Document Library ({documents.length})</span>
            </h3>
            <button
              onClick={() => setShowAddManual(!showAddManual)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Write Document</span>
            </button>
          </div>

          {/* Manual text form modal/drawer */}
          {showAddManual && (
            <form onSubmit={handleManualAdd} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Document Title (e.g. My Architecture Notes)"
                className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-cyan-500"
                required
              />
              <textarea
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                placeholder="Paste or write document text here..."
                rows={4}
                className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-cyan-500"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddManual(false)}
                  className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-cyan-600 text-zinc-100 hover:bg-cyan-500"
                >
                  Index Document
                </button>
              </div>
            </form>
          )}

          {/* Document List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {documents.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-cyan-950/20 border-cyan-500/50 shadow-sm'
                      : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-cyan-300 uppercase">
                        {doc.fileType}
                      </span>
                      <div className="text-xs font-semibold text-zinc-200 truncate">
                        {doc.title}
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-2">
                      <span>{doc.chunkCount} chunks</span>
                      <span>•</span>
                      <span>{(doc.sizeBytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    title="Delete document"
                    className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Document Inspector & Vector Chunks */}
        <div className="lg:col-span-2 space-y-4">
          {selectedDoc ? (
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-zinc-100">
                      {selectedDoc.title}
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-400">
                      ({selectedDoc.fileName})
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    Indexed into {selectedDoc.chunkCount} vector chunks with 64-dim embeddings
                  </div>
                </div>

                <div className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-800/40">
                  Total Size: {(selectedDoc.sizeBytes / 1024).toFixed(1)} KB
                </div>
              </div>

              {/* Document Vector Chunks Viewer */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Calculated Chunks & Embeddings</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Overlap: 60 chars • Window: ~380 chars
                  </span>
                </div>

                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {selectedDoc.chunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/90 hover:border-zinc-700 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-cyan-400 font-semibold">
                          Chunk #{chunk.chunkIndex + 1}
                        </span>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <span>{chunk.tokenCount} tokens</span>
                          <span>•</span>
                          <span>{chunk.content.length} chars</span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap bg-zinc-900/60 p-2.5 rounded border border-zinc-800">
                        {chunk.content}
                      </p>

                      {/* Vector embedding preview */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-mono text-zinc-500">Vector Head [0..7]:</span>
                        <div className="flex items-center gap-1 font-mono text-[9px] text-cyan-400/90 overflow-x-auto">
                          {chunk.embeddingPreview.map((val, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/40">
                              {val.toFixed(2)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-xl bg-zinc-900/90 border border-zinc-800 text-center text-zinc-500 space-y-3">
              <Database className="w-10 h-10 mx-auto text-zinc-700 stroke-1" />
              <p className="text-xs">
                Select or upload a document to inspect its generated vector chunks and embedding representations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
