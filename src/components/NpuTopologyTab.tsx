import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Activity,
  Layers,
  Terminal,
  Copy,
  Check,
  Info,
  CheckCircle2,
  Flame,
  Gauge,
  Eye,
  Sliders,
  AlertTriangle,
  Radio,
  BarChart2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { HardwareStatus } from '../types/engine';
import { AmdNpuBridge, NpuTileStatus } from '../engine/npuBridge';

interface NpuTopologyTabProps {
  hardwareStatus: HardwareStatus;
}

type VisualizationMode = 'hybrid' | 'usage_heatmap' | 'thermal_zones' | 'power_density';

export const NpuTopologyTab: React.FC<NpuTopologyTabProps> = ({ hardwareStatus }) => {
  const bridge = AmdNpuBridge.getInstance();
  const [tiles, setTiles] = useState<NpuTileStatus[]>(bridge.getTiles());
  const [selectedTile, setSelectedTile] = useState<NpuTileStatus | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<VisualizationMode>('usage_heatmap');
  const [showValuesOverlay, setShowValuesOverlay] = useState<boolean>(true);
  const [simulatedStress, setSimulatedStress] = useState<'idle' | 'normal' | 'workload_peak'>('normal');

  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Dynamic telemetry loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTiles(bridge.getTiles());
    }, 2000);
    return () => clearInterval(interval);
  }, [bridge]);

  // Keep selectedTile synchronized with pulsing telemetry
  useEffect(() => {
    if (selectedTile) {
      const updated = tiles.find((t) => t.id === selectedTile.id);
      if (updated) {
        setSelectedTile(updated);
      }
    }
  }, [tiles, selectedTile]);

  const configJson = bridge.generateVitisAiConfig();
  const pythonScript = bridge.generatePythonNpuScript();

  const handleCopy = (text: string, type: 'config' | 'script') => {
    navigator.clipboard.writeText(text);
    if (type === 'config') {
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2000);
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  // Compute aggregate matrix metrics
  const avgLoad = Math.round(tiles.reduce((acc, t) => acc + t.loadPercent, 0) / (tiles.length || 1));
  const maxTemp = Math.max(...tiles.map((t) => t.temperatureC));
  const minTemp = Math.min(...tiles.map((t) => t.temperatureC));
  const avgTemp = Math.round(tiles.reduce((acc, t) => acc + t.temperatureC, 0) / (tiles.length || 1));
  const totalPowerW = +(tiles.reduce((acc, t) => acc + (t.powerWatts || 0.4), 0)).toFixed(1);

  // Categorize thermal zone counts
  const thermalZoneBreakdown = {
    cool: tiles.filter((t) => t.thermalZone === 'cool').length,
    optimal: tiles.filter((t) => t.thermalZone === 'optimal').length,
    elevated: tiles.filter((t) => t.thermalZone === 'elevated').length,
    throttling: tiles.filter((t) => t.thermalZone === 'throttling').length,
  };

  // Heatmap gradient resolver for Core Usage
  const getUsageColorStyle = (load: number) => {
    // 0-30% cool teal/cyan, 30-70% emerald/amber, 70-100% hot red/crimson
    if (load < 30) {
      const alpha = 0.15 + (load / 30) * 0.25;
      return {
        bg: `rgba(6, 182, 212, ${alpha})`,
        border: 'rgba(6, 182, 212, 0.45)',
        textGlow: 'text-cyan-400',
        ring: 'ring-cyan-500/30',
        label: 'Low / Idle',
      };
    } else if (load < 70) {
      const factor = (load - 30) / 40;
      const alpha = 0.2 + factor * 0.3;
      return {
        bg: `rgba(234, 179, 8, ${alpha})`,
        border: 'rgba(234, 179, 8, 0.5)',
        textGlow: 'text-amber-400',
        ring: 'ring-amber-500/30',
        label: 'Active GEMM',
      };
    } else {
      const factor = (load - 70) / 30;
      const alpha = 0.3 + factor * 0.45;
      return {
        bg: `rgba(239, 68, 68, ${alpha})`,
        border: 'rgba(239, 68, 68, 0.7)',
        textGlow: 'text-red-400',
        ring: 'ring-red-500/50',
        label: 'Saturated AWQ',
      };
    }
  };

  // Heatmap gradient resolver for Thermal Zones
  const getThermalColorStyle = (tempC: number, zone: string) => {
    switch (zone) {
      case 'cool':
        return {
          bg: 'rgba(14, 165, 233, 0.18)',
          border: 'rgba(56, 189, 248, 0.4)',
          badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          gradient: 'from-sky-950/40 to-zinc-950',
          indicator: 'bg-sky-400',
          glow: 'shadow-[0_0_15px_rgba(56,189,248,0.15)]',
          label: 'Zone 1: Cool (<45°C)',
        };
      case 'optimal':
        return {
          bg: 'rgba(16, 185, 129, 0.22)',
          border: 'rgba(52, 211, 153, 0.45)',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          gradient: 'from-emerald-950/40 to-zinc-950',
          indicator: 'bg-emerald-400',
          glow: 'shadow-[0_0_15px_rgba(52,211,153,0.15)]',
          label: 'Zone 2: Optimal (45–60°C)',
        };
      case 'elevated':
        return {
          bg: 'rgba(249, 115, 22, 0.28)',
          border: 'rgba(251, 146, 60, 0.55)',
          badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
          gradient: 'from-orange-950/40 to-zinc-950',
          indicator: 'bg-orange-400',
          glow: 'shadow-[0_0_20px_rgba(249,115,22,0.25)]',
          label: 'Zone 3: Elevated (60–75°C)',
        };
      case 'throttling':
      default:
        return {
          bg: 'rgba(239, 68, 68, 0.4)',
          border: 'rgba(248, 113, 113, 0.8)',
          badgeBg: 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse',
          gradient: 'from-red-950/60 to-zinc-950',
          indicator: 'bg-red-500',
          glow: 'shadow-[0_0_24px_rgba(239,68,68,0.35)]',
          label: 'Zone 4: Thermal Throttle (>75°C)',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Hardware Status Banner */}
      <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-100">
                  {hardwareStatus.hardwareName}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {hardwareStatus.architecture}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  Spatial AIE-ML
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Driver: {hardwareStatus.driverVersion} • Provider: {hardwareStatus.executionProvider}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-right">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Avg Tile Load</div>
              <div className="text-xs font-mono font-bold text-amber-400">{avgLoad}%</div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-right">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Peak Thermal</div>
              <div className="text-xs font-mono font-bold text-red-400">{maxTemp}°C</div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-right">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Package Power</div>
              <div className="text-xs font-mono font-bold text-zinc-200">{totalPowerW} W</div>
            </div>
          </div>
        </div>

        {/* Cloud Sandbox notice */}
        <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-zinc-200">
              Interactive Spatial Heatmap & Real-Time Thermal Zones
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              The 4x4 spatial array below models the physical 16-core AIE tile grid of AMD XDNA processors (Ryzen 7040/8040 and Strix Point Ryzen AI 300). Switch overlays below to visualize compute density, thermal convection across silicon zones, and per-tile voltage and power telemetry.
            </p>
          </div>
        </div>
      </div>

      {/* Heatmap Mode Toolbar & Thermal Zone Legend */}
      <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        {/* Heatmap Overlay Selector */}
        <div className="space-y-1">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-red-400" />
            <span>Interactive Heatmap Layer</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              id="heatmap-mode-usage"
              onClick={() => setActiveViewMode('usage_heatmap')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                activeViewMode === 'usage_heatmap'
                  ? 'bg-red-500/20 border-red-500/50 text-red-300 shadow-sm shadow-red-950/40'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-red-400" />
              <span>Core Usage Heatmap</span>
            </button>

            <button
              id="heatmap-mode-thermal"
              onClick={() => setActiveViewMode('thermal_zones')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                activeViewMode === 'thermal_zones'
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 shadow-sm shadow-orange-950/40'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Thermal Zones (Convection)</span>
            </button>

            <button
              id="heatmap-mode-hybrid"
              onClick={() => setActiveViewMode('hybrid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                activeViewMode === 'hybrid'
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-sm shadow-purple-950/40'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Hybrid Multi-Vector</span>
            </button>

            <button
              id="heatmap-mode-power"
              onClick={() => setActiveViewMode('power_density')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                activeViewMode === 'power_density'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-950/40'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Power Density</span>
            </button>
          </div>
        </div>

        {/* Display Toggles */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 font-medium select-none">
            <input
              id="toggle-values-overlay"
              type="checkbox"
              checked={showValuesOverlay}
              onChange={(e) => setShowValuesOverlay(e.target.checked)}
              className="accent-red-500 rounded cursor-pointer"
            />
            <span>Show Metric Overlays</span>
          </label>

          <div className="h-6 w-px bg-zinc-800" />

          {/* Quick Filter Status Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>2.0s Telemetry Poll</span>
          </div>
        </div>
      </div>

      {/* Dynamic Heatmap Scale Legend */}
      <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        {activeViewMode === 'thermal_zones' ? (
          <>
            <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Thermal Zone Classification:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-300">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                Cool &lt;45°C ({thermalZoneBreakdown.cool} tiles)
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Optimal 45–60°C ({thermalZoneBreakdown.optimal} tiles)
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-300">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                Elevated 60–75°C ({thermalZoneBreakdown.elevated} tiles)
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-300">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Throttle &gt;75°C ({thermalZoneBreakdown.throttling} tiles)
              </span>
            </div>
          </>
        ) : activeViewMode === 'usage_heatmap' ? (
          <>
            <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
              <Activity className="w-4 h-4 text-red-400" />
              <span>Core Utilization Gradient:</span>
            </div>
            <div className="flex-1 max-w-md mx-2 flex items-center gap-2">
              <span className="text-[10px] font-mono text-cyan-400">0% Idle</span>
              <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-cyan-500 via-amber-500 to-red-600 border border-zinc-700" />
              <span className="text-[10px] font-mono text-red-400">100% Saturated</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-400">
              Global Matrix Load: <span className="text-amber-300 font-bold">{avgLoad}%</span>
            </div>
          </>
        ) : activeViewMode === 'power_density' ? (
          <>
            <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Power Draw Gradient:</span>
            </div>
            <div className="flex-1 max-w-md mx-2 flex items-center gap-2">
              <span className="text-[10px] font-mono text-emerald-400">0.2W Low</span>
              <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 border border-zinc-700" />
              <span className="text-[10px] font-mono text-indigo-400">1.2W Peak</span>
            </div>
            <div className="text-[11px] font-mono text-zinc-400">
              Aggregated Power: <span className="text-emerald-300 font-bold">{totalPowerW} W</span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="font-semibold text-zinc-300">
              Hybrid Multi-Vector: Blending Core Usage Heatmap + Thermal Zone Highlights + SRAM Interconnect
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              Range: {minTemp}°C — {maxTemp}°C
            </span>
          </div>
        )}
      </div>

      {/* Grid: 4x4 Spatial AIE Tile Matrix & Selected Tile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 4x4 Spatial AIE Tile Matrix Heatmap */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                AMD XDNA Spatial Tile Heatmap Matrix (4x4 AIE-ML Array)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              Layer: <span className="text-zinc-200 font-semibold uppercase">{activeViewMode.replace('_', ' ')}</span>
            </span>
          </div>

          {/* Interactive 4x4 Tiles Grid */}
          <div className="grid grid-cols-4 gap-3">
            {tiles.map((tile) => {
              const isSelected = selectedTile?.id === tile.id;
              const isMem = tile.type === 'memory';

              // Usage styling
              const usageStyle = getUsageColorStyle(tile.loadPercent);
              // Thermal styling
              const thermalStyle = getThermalColorStyle(tile.temperatureC, tile.thermalZone);

              // Determine dynamic container background and border according to activeViewMode
              let tileBackground = 'bg-zinc-950';
              let tileBorder = 'border-zinc-800';
              let customStyle: React.CSSProperties = {};
              let glowEffect = '';

              if (activeViewMode === 'usage_heatmap') {
                customStyle = {
                  backgroundColor: usageStyle.bg,
                  borderColor: usageStyle.border,
                };
                glowEffect = tile.loadPercent > 75 ? 'shadow-[0_0_18px_rgba(239,68,68,0.25)]' : '';
              } else if (activeViewMode === 'thermal_zones') {
                customStyle = {
                  backgroundColor: thermalStyle.bg,
                  borderColor: thermalStyle.border,
                };
                glowEffect = thermalStyle.glow;
              } else if (activeViewMode === 'power_density') {
                const pRatio = Math.min(1, Math.max(0, ((tile.powerWatts || 0.4) - 0.2) / 0.9));
                customStyle = {
                  backgroundColor: `rgba(16, 185, 129, ${0.15 + pRatio * 0.45})`,
                  borderColor: `rgba(52, 211, 153, ${0.35 + pRatio * 0.4})`,
                };
              } else {
                // Hybrid mode
                customStyle = {
                  background: `linear-gradient(135deg, ${usageStyle.bg} 0%, ${thermalStyle.bg} 100%)`,
                  borderColor: isMem ? 'rgba(6, 182, 212, 0.6)' : usageStyle.border,
                };
              }

              return (
                <button
                  key={tile.id}
                  onClick={() => setSelectedTile(tile)}
                  style={customStyle}
                  className={`p-3 rounded-xl border text-left transition-all duration-300 relative overflow-hidden group hover:scale-[1.02] cursor-pointer ${glowEffect} ${
                    isSelected
                      ? 'ring-2 ring-red-400 z-10'
                      : 'hover:border-zinc-500'
                  }`}
                >
                  {/* Visual Thermal Corner Flare */}
                  <div
                    className={`absolute top-0 right-0 w-8 h-8 rounded-bl-xl opacity-30 pointer-events-none transition-colors ${
                      tile.thermalZone === 'cool'
                        ? 'bg-sky-400'
                        : tile.thermalZone === 'optimal'
                        ? 'bg-emerald-400'
                        : tile.thermalZone === 'elevated'
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                    }`}
                  />

                  {/* Top Bar: Tile Coordinates and Dynamic Value */}
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1.5 relative z-10">
                    <span className={`font-semibold ${isMem ? 'text-cyan-300' : 'text-zinc-200'}`}>
                      Tile [{tile.row},{tile.col}]
                    </span>

                    {/* Mode-Specific Header Metric */}
                    {activeViewMode === 'thermal_zones' ? (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${thermalStyle.badgeBg}`}>
                        {tile.temperatureC}°C
                      </span>
                    ) : activeViewMode === 'power_density' ? (
                      <span className="text-[10px] font-mono text-emerald-300 font-bold">
                        {tile.powerWatts}W
                      </span>
                    ) : (
                      <span className={`text-[10px] font-bold ${usageStyle.textGlow}`}>
                        {tile.loadPercent}%
                      </span>
                    )}
                  </div>

                  {/* Kernel Tag */}
                  <div className="text-[10px] font-mono truncate text-zinc-100 font-semibold mb-2">
                    {tile.activeKernel}
                  </div>

                  {/* Dynamic Heatmap Gauge Bar */}
                  <div className="space-y-1 relative z-10">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-300">
                      <span>{activeViewMode === 'thermal_zones' ? 'Temp' : 'Load'}</span>
                      <span>
                        {activeViewMode === 'thermal_zones'
                          ? `${tile.temperatureC}°C`
                          : `${tile.loadPercent}%`}
                      </span>
                    </div>

                    <div className="w-full bg-zinc-950/70 h-2 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          activeViewMode === 'thermal_zones'
                            ? tile.thermalZone === 'cool'
                              ? 'bg-sky-400'
                              : tile.thermalZone === 'optimal'
                              ? 'bg-emerald-400'
                              : tile.thermalZone === 'elevated'
                              ? 'bg-orange-400'
                              : 'bg-red-500'
                            : tile.loadPercent > 75
                            ? 'bg-red-500'
                            : isMem
                            ? 'bg-cyan-400'
                            : 'bg-amber-400'
                        }`}
                        style={{
                          width: `${
                            activeViewMode === 'thermal_zones'
                              ? Math.min(100, Math.max(10, ((tile.temperatureC - 35) / 50) * 100))
                              : tile.loadPercent
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Bottom Sub-stats Overlay */}
                  {showValuesOverlay && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-700/40 text-[10px] font-mono flex items-center justify-between text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-zinc-500" />
                        <span className="text-zinc-200">{tile.macOpsPerSec}</span>
                      </span>
                      <span className="text-zinc-300">{tile.voltageV}V</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Matrix Footnote */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-cyan-500/40 border border-cyan-500" />
                Row 0: DMA & 32MB Shared SRAM Memory
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-red-500/40 border border-red-500" />
                Rows 1-3: INT4/INT8 GEMM Vector Cores
              </span>
            </div>
            <span className="text-zinc-500 font-mono">Click any tile to inspect internal register telemetry</span>
          </div>
        </div>

        {/* Right Col: Tile Inspector & Thermal Telemetry */}
        <div className="lg:col-span-1 space-y-4">
          {/* Selected Tile Inspector */}
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 shadow-sm">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-400" />
              {selectedTile
                ? `AIE Tile [${selectedTile.row},${selectedTile.col}] Telemetry`
                : 'Selected Core Inspector'}
            </h3>

            {selectedTile ? (
              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 text-[10px]">Active Microcode Kernel</span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                        selectedTile.thermalZone === 'cool'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : selectedTile.thermalZone === 'optimal'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : selectedTile.thermalZone === 'elevated'
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse'
                      }`}
                    >
                      {selectedTile.thermalZone} Zone
                    </span>
                  </div>
                  <div className="text-red-400 font-bold">{selectedTile.activeKernel}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="text-zinc-500 text-[10px]">Core Utilization</div>
                    <div className="text-zinc-200 font-bold text-sm text-amber-400">
                      {selectedTile.loadPercent}%
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="text-zinc-500 text-[10px]">Junction Temp</div>
                    <div className="text-zinc-200 font-bold text-sm text-orange-400">
                      {selectedTile.temperatureC}°C
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="text-zinc-500 text-[10px]">Core Voltage (VDD)</div>
                    <div className="text-zinc-200">{selectedTile.voltageV} V</div>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="text-zinc-500 text-[10px]">Tile Power</div>
                    <div className="text-zinc-200 text-emerald-400 font-semibold">
                      {selectedTile.powerWatts} W
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                  <div className="text-zinc-500 text-[10px]">Compute Throughput</div>
                  <div className="text-zinc-200 font-semibold">{selectedTile.macOpsPerSec}</div>
                  <div className="text-zinc-500 text-[10px]">SIMD Vector Execution (INT4x512 / INT8x256)</div>
                </div>

                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                  <div className="text-zinc-500 text-[10px]">Silicon Convection Status</div>
                  <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                    {selectedTile.thermalZone === 'cool' &&
                      'Operating well below thermal limits with high clock headroom. Ideal for high batch sizes.'}
                    {selectedTile.thermalZone === 'optimal' &&
                      'Optimal thermal dissipation curve. Peak GEMM energy efficiency (TOPS/Watt).'}
                    {selectedTile.thermalZone === 'elevated' &&
                      'Elevated thermal envelope. Heat spreading to adjacent Row 0 memory tiles.'}
                    {selectedTile.thermalZone === 'throttling' &&
                      'Approaching TJMax safety ceiling. Automatic frequency downclocking active.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-zinc-950 border border-zinc-800 text-center text-zinc-500 space-y-2">
                <Cpu className="w-8 h-8 text-zinc-700 mx-auto stroke-1" />
                <p className="text-xs">
                  Click any tile in the 4x4 spatial matrix to inspect its real-time heat signature, compute load, and thermal dissipation zone.
                </p>
              </div>
            )}
          </div>

          {/* Quick instructions for Bare Metal */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5">
            <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Native Ryzen AI Quick Guide</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-zinc-400 list-disc list-inside">
              {hardwareStatus.instructionsForNative.map((ins, idx) => (
                <li key={idx} className="leading-relaxed">
                  {ins}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Exportable Deployment Kit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vitis-AI Configuration */}
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-semibold text-zinc-200">
                vaip_config.json (ONNX Runtime Vitis-AI EP)
              </h3>
            </div>
            <button
              onClick={() => handleCopy(configJson, 'config')}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              {copiedConfig ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedConfig ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-zinc-950 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-56">
            {configJson}
          </pre>
        </div>

        {/* Python Native NPU Runner */}
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-semibold text-zinc-200">
                run_npu_inference.py (Native + Lemonade Sidecar)
              </h3>
            </div>
            <button
              onClick={() => handleCopy(pythonScript, 'script')}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-zinc-950 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-56">
            {pythonScript}
          </pre>
        </div>
      </div>
    </div>
  );
};
