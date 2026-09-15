import React, { useState } from 'react';
import { Box, Terminal, Copy, Check, Play, Send, ShieldCheck } from 'lucide-react';

export const ApiDocsTab: React.FC = () => {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedPython, setCopiedPython] = useState(false);
  const [copiedJs, setCopiedJs] = useState(false);
  
  const [endpointMethod, setEndpointMethod] = useState<'POST' | 'GET'>('POST');
  const [endpointPath, setEndpointPath] = useState('/v1/chat/completions');
  const [testPayload, setTestPayload] = useState(`{
  "model": "aether-scratch-int4",
  "messages": [
    {"role": "user", "content": "Benchmark AMD NPU INT4 execution speed."}
  ],
  "stream": false
}`);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const curlSnippet = `curl -X POST http://localhost:3000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "aether-scratch-int4",
    "messages": [{"role": "user", "content": "Hello Aether Engine"}],
    "stream": true
  }'`;

  const pythonSnippet = `from openai import OpenAI

# Connect to Aether Inference Engine as an Ollama/Lemonade drop-in
client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="not-needed"
)

response = client.chat.completions.create(
    model="amd-npu-xdna2-quant",
    messages=[{"role": "user", "content": "Execute agent tool loop"}],
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")`;

  const jsSnippet = `const response = await fetch("http://localhost:3000/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "aether-scratch-int4",
    messages: [{ role: "user", content: "Inspect NPU tiles" }],
    stream: false
  })
});
const data = await response.json();
console.log(data.choices[0].message.content);`;

  const handleCopy = (text: string, type: 'curl' | 'py' | 'js') => {
    navigator.clipboard.writeText(text);
    if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else if (type === 'py') {
      setCopiedPython(true);
      setTimeout(() => setCopiedPython(false), 2000);
    } else {
      setCopiedJs(true);
      setTimeout(() => setCopiedJs(false), 2000);
    }
  };

  const handleTestApi = async () => {
    setIsLoading(true);
    setApiResponse(null);
    try {
      const res = await fetch(endpointPath, {
        method: endpointMethod,
        headers: endpointMethod === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body: endpointMethod === 'POST' ? testPayload : undefined,
      });

      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setApiResponse(JSON.stringify(json, null, 2));
      } catch {
        setApiResponse(text);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setApiResponse(`Request Failed: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
        <div className="flex items-center gap-2">
          <Box className="w-5 h-5 text-red-400" />
          <h2 className="text-sm font-semibold text-zinc-100">
            OpenAI & Ollama Compatible Inference API
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
            REST / SSE
          </span>
        </div>
        <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
          AetherEngine exposes standard endpoints on port 3000 (`/v1/models`, `/v1/chat/completions`, `/api/engine/status`, `/api/lemonade/proxy`), enabling you to use this engine as an Ollama or Lemonade drop-in with any external client (Open WebUI, LangChain, Cursor, or AutoGen).
        </p>
      </div>

      {/* Code Snippets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* cURL */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200">cURL (Streaming SSE)</span>
            <button
              onClick={() => handleCopy(curlSnippet, 'curl')}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded bg-zinc-800"
            >
              {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCurl ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-zinc-950 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-44">
            {curlSnippet}
          </pre>
        </div>

        {/* Python */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200">Python (OpenAI SDK)</span>
            <button
              onClick={() => handleCopy(pythonSnippet, 'py')}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded bg-zinc-800"
            >
              {copiedPython ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedPython ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-zinc-950 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-44">
            {pythonSnippet}
          </pre>
        </div>

        {/* TypeScript */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200">Node / Fetch</span>
            <button
              onClick={() => handleCopy(jsSnippet, 'js')}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded bg-zinc-800"
            >
              {copiedJs ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedJs ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-zinc-950 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-44">
            {jsSnippet}
          </pre>
        </div>
      </div>

      {/* Interactive API Endpoint Tester */}
      <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
            Interactive API Tester & Inspector
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">Hits live Express server</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={endpointMethod}
            onChange={(e) => setEndpointMethod(e.target.value as 'POST' | 'GET')}
            className="w-24 text-xs font-mono font-bold bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100"
          >
            <option value="POST">POST</option>
            <option value="GET">GET</option>
          </select>

          <select
            value={endpointPath}
            onChange={(e) => {
              const path = e.target.value;
              setEndpointPath(path);
              if (path === '/v1/models' || path === '/api/engine/status') {
                setEndpointMethod('GET');
              } else {
                setEndpointMethod('POST');
              }
            }}
            className="flex-1 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100"
          >
            <option value="/v1/chat/completions">/v1/chat/completions (OpenAI Chat format)</option>
            <option value="/v1/models">/v1/models (Catalog of models)</option>
            <option value="/api/engine/status">/api/engine/status (Hardware NPU & Sidecar probe)</option>
          </select>

          <button
            onClick={handleTestApi}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Executing...' : 'Send Request'}</span>
          </button>
        </div>

        {endpointMethod === 'POST' && (
          <div className="space-y-1">
            <label className="text-xs text-zinc-400 font-medium">Request Body (JSON):</label>
            <textarea
              rows={4}
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="w-full font-mono text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-red-500/60 resize-none"
            />
          </div>
        )}

        {apiResponse && (
          <div className="space-y-1.5 pt-2">
            <div className="text-xs font-semibold text-zinc-300">Live Response Payload:</div>
            <pre className="p-3 rounded-lg bg-zinc-950 font-mono text-xs text-emerald-300 overflow-x-auto max-h-64 border border-zinc-800">
              {apiResponse}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
