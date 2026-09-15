import React from 'react';
import {
  Cpu,
  Terminal,
  Sparkles,
  Box,
  Plug,
  Zap,
  Server,
  ShieldCheck,
  CheckCircle2,
  Trophy,
  Database,
  BookOpen,
  Brain,
} from 'lucide-react';
import { BackendType, HardwareStatus, LemonadeConfig } from '../types/engine';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeBackend: BackendType;
  setActiveBackend: (b: BackendType) => void;
  hardwareStatus: HardwareStatus;
  lemonadeConfig: LemonadeConfig;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeBackend,
  setActiveBackend,
  hardwareStatus,
  lemonadeConfig,
}) => {
  const tabs = [
    { id: 'playground', label: 'Inference Playground', icon: Terminal },
    { id: 'subconscious', label: 'Subconscious Mind', icon: Brain },
    { id: 'arena', label: 'Benchmark Arena', icon: Trophy },
    { id: 'rag', label: 'RAG Knowledge Base', icon: Database },
    { id: 'primer', label: 'AI 101 Primer', icon: BookOpen },
    { id: 'agent', label: 'Agent Console', icon: Sparkles },
    { id: 'npu', label: 'AMD NPU & Topology', icon: Cpu },
    { id: 'lemonade', label: 'Lemonade Sidecar', icon: Server },
    { id: 'plugins', label: 'Plugin Studio', icon: Plug },
    { id: 'api', label: 'API & Endpoints', icon: Box },
  ];

  const backendLabels: Record<BackendType, { label: string; badge: string; color: string }> = {
    amd_npu: { label: 'AMD Ryzen AI NPU', badge: 'XDNA 2', color: 'border-red-500/40 text-red-400 bg-red-950/20' },
    lemonade: {
      label: 'Lemonade Sidecar',
      badge: lemonadeConfig.status === 'connected' ? 'Connected' : 'Sidecar',
      color: lemonadeConfig.status === 'connected' ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20' : 'border-amber-500/40 text-amber-400 bg-amber-950/20',
    },
    scratch_engine: { label: 'Scratch Transformer Engine', badge: 'INT4 AWQ', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20' },
    gemini_cloud: { label: 'Gemini Cloud Engine', badge: 'API Fallback', color: 'border-indigo-500/40 text-indigo-400 bg-indigo-950/20' },
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Brand & Engine identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-950/50">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-zinc-100 tracking-tight">
                  Aether Inference Engine
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Scratch Architecture • AMD NPU XDNA • Lemonade Sidecar • Agent Runtime
              </p>
            </div>
          </div>

          {/* Quick Hardware & Backend Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
              <Cpu className="w-3.5 h-3.5 text-red-400" />
              <span className="text-zinc-400">NPU:</span>
              <span className="font-mono text-zinc-200">{hardwareStatus.npuTops} TOPS</span>
              <span className="text-zinc-500 text-[10px]">({hardwareStatus.architecture})</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${lemonadeConfig.status === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-zinc-400">Lemonade:</span>
              <span className="font-mono text-zinc-200 capitalize">{lemonadeConfig.status}</span>
            </div>

            <div className="relative">
              <select
                id="active-backend-selector"
                value={activeBackend}
                onChange={(e) => setActiveBackend(e.target.value as BackendType)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border appearance-none pr-7 cursor-pointer outline-none focus:ring-1 focus:ring-red-500/50 transition-colors ${backendLabels[activeBackend].color}`}
              >
                <option value="amd_npu" className="bg-zinc-900 text-zinc-100">
                  AMD Ryzen AI NPU (XDNA)
                </option>
                <option value="lemonade" className="bg-zinc-900 text-zinc-100">
                  Lemonade Server Sidecar
                </option>
                <option value="scratch_engine" className="bg-zinc-900 text-zinc-100">
                  Scratch Transformer Engine
                </option>
                <option value="gemini_cloud" className="bg-zinc-900 text-zinc-100">
                  Gemini Cloud Fallback
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-400 text-xs">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto scrollbar-none py-1 border-t border-zinc-800/60" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-red-400' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
