/**
 * Aether Modular Inference Engine & Agent System
 * Full-stack scratch engine with AMD NPU XDNA telemetry, Lemonade server sidecar,
 * modular plugin studio, and autonomous ReAct agent loop.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { PlaygroundTab } from './components/PlaygroundTab';
import { AgentTab } from './components/AgentTab';
import { NpuTopologyTab } from './components/NpuTopologyTab';
import { LemonadeTab } from './components/LemonadeTab';
import { PluginStudioTab } from './components/PluginStudioTab';
import { ApiDocsTab } from './components/ApiDocsTab';

import { BackendType, HardwareStatus, LemonadeConfig } from './types/engine';
import { ScratchInferenceEngine } from './engine/scratchEngine';
import { AmdNpuBridge } from './engine/npuBridge';
import { LemonadeBridge } from './engine/lemonadeBridge';
import { PluginSystem } from './engine/pluginSystem';

export default function App() {
  const [activeTab, setActiveTab] = useState('playground');
  const [activeBackend, setActiveBackend] = useState<BackendType>('amd_npu');

  const npuBridge = AmdNpuBridge.getInstance();
  const lemonadeBridge = LemonadeBridge.getInstance();
  const pluginSystem = PluginSystem.getInstance();
  const [scratchEngine] = useState(() => new ScratchInferenceEngine());

  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus>(() => npuBridge.getStatus());
  const [lemonadeConfig, setLemonadeConfig] = useState<LemonadeConfig>(() => lemonadeBridge.getConfig());

  // Check backend server status on mount
  useEffect(() => {
    async function checkServerStatus() {
      try {
        const res = await fetch('/api/engine/status');
        if (res.ok) {
          const data = await res.json();
          if (data.amdNpu) {
            setHardwareStatus((prev) => ({
              ...prev,
              isAmdNpuDetected: data.amdNpu.isHardwareDetected,
              details: data.amdNpu.isHardwareDetected
                ? 'Direct AMD NPU hardware device node (/dev/accel) detected!'
                : prev.details,
            }));
          }
        }
      } catch {
        // Fallback to client-side detection values
      }
    }

    checkServerStatus();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-red-500/30 selection:text-red-200">
      {/* Top App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeBackend={activeBackend}
        setActiveBackend={setActiveBackend}
        hardwareStatus={hardwareStatus}
        lemonadeConfig={lemonadeConfig}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'playground' && (
              <PlaygroundTab
                activeBackend={activeBackend}
                setActiveBackend={setActiveBackend}
                scratchEngine={scratchEngine}
                lemonadeBridge={lemonadeBridge}
                pluginSystem={pluginSystem}
              />
            )}

            {activeTab === 'agent' && (
              <AgentTab
                activeBackend={activeBackend}
                pluginSystem={pluginSystem}
              />
            )}

            {activeTab === 'npu' && (
              <NpuTopologyTab hardwareStatus={hardwareStatus} />
            )}

            {activeTab === 'lemonade' && (
              <LemonadeTab
                lemonadeConfig={lemonadeConfig}
                setLemonadeConfig={setLemonadeConfig}
                onSelectBackend={() => {
                  setActiveBackend('lemonade');
                  setActiveTab('playground');
                }}
              />
            )}

            {activeTab === 'plugins' && (
              <PluginStudioTab pluginSystem={pluginSystem} />
            )}

            {activeTab === 'api' && <ApiDocsTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
