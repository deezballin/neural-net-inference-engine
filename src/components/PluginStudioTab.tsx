import React, { useState } from 'react';
import { Plug, Plus, Play, CheckCircle2, Trash2, Code2, Sparkles, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Plugin } from '../types/engine';
import { PluginSystem } from '../engine/pluginSystem';

interface PluginStudioTabProps {
  pluginSystem: PluginSystem;
}

export const PluginStudioTab: React.FC<PluginStudioTabProps> = ({ pluginSystem }) => {
  const [plugins, setPlugins] = useState<Plugin[]>(pluginSystem.getPlugins());
  
  // New Plugin Builder Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [toolName, setToolName] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [code, setCode] = useState(`// Custom Tool Handler
// Available arguments: args, memoryStore
const target = args.target || "system";

return {
  executedAt: new Date().toISOString(),
  target: target,
  status: "active",
  analysis: "Plugin executed successfully in sandbox.",
  customScore: 98.4
};`);

  // Testing Sandbox state
  const [testArgs, setTestArgs] = useState('{\n  "target": "AMD_NPU_Core_0"\n}');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const refreshList = () => {
    setPlugins(pluginSystem.getPlugins());
  };

  const handleToggle = (id: string) => {
    pluginSystem.togglePlugin(id);
    refreshList();
  };

  const handleDelete = (id: string) => {
    pluginSystem.deletePlugin(id);
    refreshList();
  };

  const handleTestSandbox = () => {
    setTestError(null);
    setTestResult(null);
    try {
      const parsedArgs = JSON.parse(testArgs);
      const fn = new Function('args', 'memoryStore', `"use strict"; ${code}`);
      const res = fn(parsedArgs, new Map());
      setTestResult(JSON.stringify(res, null, 2));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestError(msg);
    }
  };

  const handleRegisterPlugin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !toolName.trim()) return;

    const id = `plugin-${toolName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    const newPlugin: Plugin = {
      id,
      name: name.trim(),
      version: '1.0.0',
      description: description.trim() || 'User created custom plugin for Aether inference agent.',
      author: 'User Author',
      enabled: true,
      type: 'custom',
      createdAt: Date.now(),
      tools: [
        {
          name: toolName.trim(),
          description: toolDescription.trim() || `Executes tool ${toolName}`,
          parameters: {
            type: 'object',
            properties: {
              target: { type: 'string', description: 'Target parameter' },
            },
          },
        },
      ],
      customHandlerCode: code,
    };

    pluginSystem.registerPlugin(newPlugin);
    refreshList();

    // Reset Form
    setName('');
    setDescription('');
    setToolName('');
    setToolDescription('');
    setSuccessNotice(`Plugin "${newPlugin.name}" successfully registered! The Agent can now invoke "${newPlugin.tools[0].name}()".`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-zinc-900 border border-cyan-500/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Plug className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Modular Plugin Studio & Tool Registry
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Agent Tool Calling
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Create custom tools and lifecycle hooks. Any registered tool is automatically made discoverable by the Agent ReAct loop and can execute custom logic, fetch external data, or interact with hardware telemetry.
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Installed Modules</div>
          <div className="text-xs font-mono font-semibold text-zinc-200">
            {plugins.length} Plugins Registered
          </div>
        </div>
      </div>

      {successNotice && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Registered Plugins List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Plug className="w-4 h-4 text-cyan-400" />
              Active Plugins & Tools ({plugins.length})
            </h3>
            <span className="text-[11px] text-zinc-500">Toggle to enable or disable in agent loop</span>
          </div>

          <div className="space-y-3">
            {plugins.map((plugin) => (
              <div
                key={plugin.id}
                className={`p-4 rounded-xl border transition-all ${
                  plugin.enabled
                    ? 'bg-zinc-900/90 border-zinc-800 shadow-sm'
                    : 'bg-zinc-950/60 border-zinc-900 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-200">{plugin.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        v{plugin.version}
                      </span>
                      <span className="text-[10px] text-zinc-500 capitalize">• {plugin.type}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">{plugin.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plugin.enabled}
                        onChange={() => handleToggle(plugin.id)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>

                    {plugin.type === 'custom' && (
                      <button
                        onClick={() => handleDelete(plugin.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-800 transition-colors"
                        title="Delete Plugin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tools exposed by this plugin */}
                <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                    Callable Tools:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {plugin.tools.map((t) => (
                      <span
                        key={t.name}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-cyan-300 border border-zinc-800"
                        title={t.description}
                      >
                        {t.name}()
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive Plugin Authoring & Sandbox */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Plugin Authoring Studio
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">TypeScript / JS Sandbox</span>
            </div>

            <form onSubmit={handleRegisterPlugin} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="plugin-name-input" className="text-xs text-zinc-400 font-medium">Plugin Display Name</label>
                  <input
                    id="plugin-name-input"
                    type="text"
                    required
                    placeholder="e.g. Cloud SQL Optimizer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-cyan-500/60"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="plugin-tool-name-input" className="text-xs text-zinc-400 font-medium">Tool Function Name</label>
                  <input
                    id="plugin-tool-name-input"
                    type="text"
                    required
                    placeholder="e.g. optimize_sql_query"
                    value={toolName}
                    onChange={(e) => setToolName(e.target.value)}
                    className="w-full text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-cyan-500/60"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="plugin-desc-input" className="text-xs text-zinc-400 font-medium">Plugin Description</label>
                <input
                  id="plugin-desc-input"
                  type="text"
                  placeholder="What does this plugin do?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              {/* Handler Code Editor */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="plugin-handler-code" className="text-zinc-400 font-medium">Handler Code Execution Sandbox</label>
                  <span className="text-[10px] text-zinc-500 font-mono">args, memoryStore</span>
                </div>
                <textarea
                  id="plugin-handler-code"
                  rows={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full font-mono text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-cyan-200 focus:outline-none focus:border-cyan-500/60 resize-none leading-relaxed"
                />
              </div>

              {/* Test arguments & Sandbox Run */}
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="plugin-test-args" className="text-zinc-400">Test Input Parameters (JSON):</label>
                  <button
                    type="button"
                    onClick={handleTestSandbox}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-cyan-400 text-xs flex items-center gap-1 font-medium transition-colors"
                  >
                    <Play className="w-3 h-3 fill-cyan-400" />
                    <span>Run Sandbox Test</span>
                  </button>
                </div>

                <textarea
                  id="plugin-test-args"
                  rows={2}
                  value={testArgs}
                  onChange={(e) => setTestArgs(e.target.value)}
                  className="w-full font-mono text-[11px] bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-300 resize-none"
                />

                {testResult && (
                  <div className="space-y-1 pt-1">
                    <div className="text-[10px] text-emerald-400 font-mono">Output Result:</div>
                    <pre className="p-2 rounded bg-zinc-900 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-24">
                      {testResult}
                    </pre>
                  </div>
                )}

                {testError && (
                  <div className="p-2 rounded bg-red-950/40 border border-red-500/40 text-[11px] text-red-300 font-mono">
                    {testError}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!name.trim() || !toolName.trim()}
                className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-cyan-950/40"
              >
                <Plus className="w-4 h-4" />
                <span>Register Plugin & Bind to Agent</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
