import React, { useState } from 'react';
import { Sparkles, Play, Square, CheckCircle2, AlertCircle, Clock, Zap, ArrowRight, Brain, Terminal, Database } from 'lucide-react';
import { AgentSession, BackendType } from '../types/engine';
import { AgentRunner } from '../engine/agentRunner';
import { PluginSystem } from '../engine/pluginSystem';

interface AgentTabProps {
  activeBackend: BackendType;
  pluginSystem: PluginSystem;
}

export const AgentTab: React.FC<AgentTabProps> = ({ activeBackend, pluginSystem }) => {
  const [goal, setGoal] = useState('');
  const [session, setSession] = useState<AgentSession | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const activeTools = pluginSystem.getAllActiveTools();

  const sampleGoals = [
    'Audit AMD NPU AIE tile telemetry, verify INT4 AWQ execution capacity, and save snapshot to agent memory.',
    'Calculate KV-Cache requirements for 8K context length across 32 layers and assess NPU SRAM fit.',
    'Lookup Lemonade server launch commands and check sidecar integration status.',
    'Inspect mathematical matrix scaling factors for INT4 symmetric quantization.',
  ];

  const handleRunGoal = async (customGoal?: string) => {
    const targetGoal = customGoal || goal;
    if (!targetGoal.trim() || isRunning) return;

    setIsRunning(true);
    const runner = AgentRunner.getInstance();

    try {
      await runner.runGoal(targetGoal, activeBackend, (updatedSession) => {
        setSession({ ...updatedSession });
      });
    } catch (err) {
      console.error('Agent execution failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    AgentRunner.getInstance().stop();
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900 border border-red-500/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-400" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Autonomous Agent Workstation (ReAct Loop)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
              Modular Plugins Active
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl">
            The agent autonomously plans multi-step tasks, invokes tools registered in the Plugin System (such as AMD NPU Profiler, KV-Cache Calculator, and Memory Store), and synthesizes actionable answers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Plugin Tools</div>
            <div className="text-xs font-mono font-semibold text-zinc-200">
              {activeTools.length} Tools Ready
            </div>
          </div>
          <div className="text-right pl-3 border-l border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Backend</div>
            <div className="text-xs font-mono font-semibold text-red-400 capitalize">
              {activeBackend.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Goal formulation & Presets */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-sm">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Agent Objective
            </h3>

            <textarea
              id="agent-goal-input"
              rows={4}
              placeholder="State a high-level goal for the agent (e.g., 'Inspect AMD NPU tile load, calculate memory needed for 8192 context, and store in memory')..."
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500/60 resize-none font-sans"
            />

            <div className="flex gap-2">
              {isRunning ? (
                <button
                  onClick={handleStop}
                  className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-red-400 font-medium text-xs flex items-center justify-center gap-1.5 border border-red-500/30 transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-red-400" />
                  <span>Halt Agent</span>
                </button>
              ) : (
                <button
                  id="btn-run-agent"
                  onClick={() => handleRunGoal()}
                  disabled={!goal.trim()}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-red-950/40"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Execute Goal</span>
                </button>
              )}
            </div>
          </div>

          {/* Curated Sample Goals */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5">
            <div className="text-xs font-semibold text-zinc-400">Curated Agent Goals</div>
            <div className="space-y-2">
              {sampleGoals.map((sg, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setGoal(sg);
                    handleRunGoal(sg);
                  }}
                  className="w-full text-left text-xs p-2.5 rounded-lg bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800/80 text-zinc-300 hover:text-zinc-100 transition-colors"
                >
                  <div className="font-medium text-zinc-200 mb-0.5 flex items-center gap-1.5">
                    <ArrowRight className="w-3 h-3 text-red-400 shrink-0" />
                    <span>Scenario {idx + 1}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2">{sg}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Active Available Tools in Plugin System */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <div className="text-xs font-semibold text-zinc-400">Connected Plugin Tools</div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {activeTools.map((tool) => (
                <div
                  key={tool.name}
                  className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/60 text-[11px] font-mono"
                >
                  <div className="text-red-400 font-semibold">{tool.name}</div>
                  <div className="text-zinc-400 text-[10px] font-sans line-clamp-1">
                    {tool.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Execution Steps & Observations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col min-h-[520px] shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-zinc-200">
                  Execution Trace & Reasoning Graph
                </span>
                {session && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${
                      session.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : session.status === 'running'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {session.status}
                  </span>
                )}
              </div>

              {session && (
                <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                  <span>Tokens: {session.totalTokens}</span>
                  <span>Time: {session.totalDurationMs} ms</span>
                </div>
              )}
            </div>

            {/* Steps Container */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {session && session.steps.length > 0 ? (
                session.steps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2.5 transition-all"
                  >
                    {/* Step Header */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 font-mono text-[10px] flex items-center justify-center font-bold border border-red-500/30">
                          {step.stepNumber}
                        </span>
                        <span className="font-semibold text-zinc-300">Agent Reasoning Step</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Thought */}
                    <div className="text-xs text-zinc-300 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60 leading-relaxed font-sans">
                      <span className="text-zinc-500 font-semibold mr-1">Thought:</span>
                      {step.thought}
                    </div>

                    {/* Action */}
                    {step.action && (
                      <div className="p-2.5 rounded-lg bg-zinc-900/40 border border-cyan-500/20 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold font-mono">
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Action Invocation: {step.action.tool}()</span>
                        </div>
                        <pre className="text-[11px] font-mono text-zinc-400 overflow-x-auto p-1 bg-zinc-950/60 rounded">
                          {JSON.stringify(step.action.args, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Observation */}
                    {step.observation && (
                      <div className="p-2.5 rounded-lg bg-zinc-900/40 border border-emerald-500/20 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold font-mono">
                          <Database className="w-3.5 h-3.5" />
                          <span>Observation:</span>
                        </div>
                        <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto p-1.5 bg-zinc-950/80 rounded max-h-36">
                          {step.observation}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center space-y-2 py-16">
                  <Sparkles className="w-8 h-8 stroke-1 text-zinc-700" />
                  <p className="text-xs">No active agent run. Formulate a goal on the left to start the loop.</p>
                  <span className="text-[11px] text-zinc-700 font-mono">
                    Steps will display Thought, Tool Action, and Observation dynamically.
                  </span>
                </div>
              )}

              {/* Final Answer Banner */}
              {session?.finalAnswer && (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Synthesized Final Answer</span>
                  </div>
                  <div className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {session.finalAnswer}
                  </div>
                </div>
              )}

              {session?.error && (
                <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 space-y-1 text-xs text-red-300">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span>Execution Terminated with Error</span>
                  </div>
                  <p>{session.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
