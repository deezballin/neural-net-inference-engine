import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Brain,
  Zap,
  Activity,
  Cpu,
  Database,
  Terminal,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Sliders,
  Maximize2,
  Info,
  Radio,
  Share2,
} from 'lucide-react';
import { SubconsciousEngine } from '../engine/subconsciousEngine';

export interface ThoughtStreamNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  role: string;
  category: 'main_engine' | 'subconscious_daemon' | 'sub_agent';
  status: 'active' | 'primed' | 'consolidating' | 'streaming';
  color: string;
  badge: string;
  throughputKbps: number;
  packetsCount: number;
  lastPayload: string;
  powerWatts?: number;
  size: number;
}

export interface ThoughtStreamLink extends d3.SimulationLinkDatum<ThoughtStreamNode> {
  id: string;
  source: string | ThoughtStreamNode;
  target: string | ThoughtStreamNode;
  protocol: string;
  bandwidth: string;
  latencyMs: number;
  activePayload: string;
  color: string;
}

interface Particle {
  id: number;
  linkId: string;
  sourceId: string;
  targetId: string;
  progress: number; // 0 to 1
  speed: number;
  color: string;
  size: number;
}

export const ThoughtStreamD3Graph: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const engine = SubconsciousEngine.getInstance();

  const [isRunning, setIsRunning] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [filterMode, setFilterMode] = useState<'all' | 'npu' | 'rag' | 'memory'>('all');
  const [selectedNode, setSelectedNode] = useState<ThoughtStreamNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<ThoughtStreamLink | null>(null);
  const [streamTick, setStreamTick] = useState(0);

  // Initial nodes configuration representing the multi-agent cognitive mesh
  const initialNodes: ThoughtStreamNode[] = useMemo(
    () => [
      {
        id: 'main_loop',
        name: 'Main Engine Conscious Loop',
        role: 'Core Inference, Token Decoding & Context Execution',
        category: 'main_engine',
        status: 'active',
        color: '#ef4444', // Red-500
        badge: 'Foreground Core',
        throughputKbps: 480.2,
        packetsCount: 4210,
        lastPayload: 'Token GEMM kernel execution on AIE-ML tiles',
        powerWatts: 14.5,
        size: 34,
      },
      {
        id: 'subconscious_daemon',
        name: 'Subconscious Pre-Warming Daemon',
        role: 'Background Anticipation, Vector Dispatch & Intuition Synthesis',
        category: 'subconscious_daemon',
        status: 'active',
        color: '#a855f7', // Purple-500
        badge: '24/7 Daemon',
        throughputKbps: 184.6,
        packetsCount: 3120,
        lastPayload: 'Pre-injecting primed SRAM latent vectors to Core',
        powerWatts: 3.8,
        size: 28,
      },
      {
        id: 'rag_agent',
        name: 'RAG Vector Priming Agent',
        role: 'Semantic embeddings, high-cosine chunk retrieval, SRAM staging',
        category: 'sub_agent',
        status: 'primed',
        color: '#06b6d4', // Cyan-500
        badge: 'RAG Vector',
        throughputKbps: 64.2,
        packetsCount: 1420,
        lastPayload: 'Cosine sim 0.94 staged: "AMD Ryzen AI XDNA AIE-ML Tile Mesh"',
        size: 20,
      },
      {
        id: 'npu_telemetry_agent',
        name: 'NPU Silicon Telemetry Agent',
        role: 'Real-time AIE-ML tile matrix load, INT4 SIMD bus, thermal 41°C',
        category: 'sub_agent',
        status: 'streaming',
        color: '#f43f5e', // Rose-500
        badge: 'Hardware Bus',
        throughputKbps: 92.4,
        packetsCount: 5210,
        lastPayload: 'AIE Tile 3-7 active (INT4 AWQ 50 TOPS)',
        powerWatts: 1.2,
        size: 22,
      },
      {
        id: 'dream_agent',
        name: 'Memory Consolidation (Dream) Agent',
        role: 'Sleep & consolidation cycle, synaptic plasticity reweighting',
        category: 'sub_agent',
        status: 'consolidating',
        color: '#6366f1', // Indigo-500
        badge: 'Plasticity',
        throughputKbps: 28.5,
        packetsCount: 940,
        lastPayload: 'Reinforcing 8 knowledge vertices; synaptic weight +1.2',
        size: 20,
      },
      {
        id: 'tool_anticipator_agent',
        name: 'Tool Sandbox Anticipator',
        role: 'Pre-warming Python sandbox, Lemonade sidecar RPC pipes',
        category: 'sub_agent',
        status: 'primed',
        color: '#f59e0b', // Amber-500
        badge: 'Tool Pre-warm',
        throughputKbps: 45.1,
        packetsCount: 890,
        lastPayload: 'Python Sandbox & Lemonade sidecar pipe pre-connected',
        size: 20,
      },
      {
        id: 'sensory_streamer_agent',
        name: 'Sensory Token Streamer',
        role: 'Keystroke velocity analysis & predictive intent categorization',
        category: 'sub_agent',
        status: 'active',
        color: '#10b981', // Emerald-500
        badge: 'Sensory Input',
        throughputKbps: 112.8,
        packetsCount: 2840,
        lastPayload: 'User query stream: "INT4 quantization efficiency"',
        size: 22,
      },
      {
        id: 'context_decay_agent',
        name: 'Attention Entropy & Cache Pruner',
        role: 'Decay analysis, KV-cache offloading, sliding-window retention',
        category: 'sub_agent',
        status: 'active',
        color: '#3b82f6', // Blue-500
        badge: 'KV Pruning',
        throughputKbps: 34.0,
        packetsCount: 1120,
        lastPayload: 'Entropy index: 0.18 (Healthy attention focus)',
        size: 19,
      },
    ],
    []
  );

  const initialLinks: ThoughtStreamLink[] = useMemo(
    () => [
      {
        id: 'link-sub-to-core',
        source: 'subconscious_daemon',
        target: 'main_loop',
        protocol: 'AIE SRAM Shared Bus',
        bandwidth: '128 GB/s',
        latencyMs: 0.08,
        activePayload: 'Whisper: Pre-warmed INT4 tiles and 2 primed RAG chunks',
        color: '#c084fc',
      },
      {
        id: 'link-rag-to-sub',
        source: 'rag_agent',
        target: 'subconscious_daemon',
        protocol: 'HNSW Latent Search',
        bandwidth: '48 MB/s',
        latencyMs: 0.42,
        activePayload: 'Primed 3 chunks: AMD XDNA Hardware Architecture',
        color: '#22d3ee',
      },
      {
        id: 'link-npu-to-sub',
        source: 'npu_telemetry_agent',
        target: 'subconscious_daemon',
        protocol: 'RyzenAI DMA Stream',
        bandwidth: '64 MB/s',
        latencyMs: 0.12,
        activePayload: 'Thermal 41.2°C, 3.8W low-power daemon partition',
        color: '#fb7185',
      },
      {
        id: 'link-npu-to-core',
        source: 'npu_telemetry_agent',
        target: 'main_loop',
        protocol: 'Direct Tile Matrix Driver',
        bandwidth: '256 GB/s',
        latencyMs: 0.04,
        activePayload: 'Executing INT4 GEMM kernel @ 1.8GHz clock',
        color: '#f43f5e',
      },
      {
        id: 'link-dream-to-sub',
        source: 'dream_agent',
        target: 'subconscious_daemon',
        protocol: 'Synaptic Plasticity Bridge',
        bandwidth: '12 MB/s',
        latencyMs: 1.15,
        activePayload: '12 consolidated memory nodes synchronized',
        color: '#818cf8',
      },
      {
        id: 'link-tool-to-sub',
        source: 'tool_anticipator_agent',
        target: 'subconscious_daemon',
        protocol: 'IPC Pre-warm Socket',
        bandwidth: '32 MB/s',
        latencyMs: 0.28,
        activePayload: 'Lemonade sidecar bridge warm & listening',
        color: '#fbbf24',
      },
      {
        id: 'link-tool-to-core',
        source: 'tool_anticipator_agent',
        target: 'main_loop',
        protocol: 'Direct Tool Execution RPC',
        bandwidth: '80 MB/s',
        latencyMs: 0.35,
        activePayload: 'Python Sandbox ready for instant execution',
        color: '#f59e0b',
      },
      {
        id: 'link-sensory-to-sub',
        source: 'sensory_streamer_agent',
        target: 'subconscious_daemon',
        protocol: 'Sensory Intent Feed',
        bandwidth: '18 MB/s',
        latencyMs: 0.15,
        activePayload: 'Live tokens incoming from Playground chat input',
        color: '#34d399',
      },
      {
        id: 'link-decay-to-core',
        source: 'context_decay_agent',
        target: 'main_loop',
        protocol: 'KV Attention Mask Buffer',
        bandwidth: '96 MB/s',
        latencyMs: 0.18,
        activePayload: 'Purged 14 stale tokens from active sliding window',
        color: '#60a5fa',
      },
    ],
    []
  );

  // Filtered links based on selected mode
  const currentFilteredLinks = useMemo(() => {
    if (filterMode === 'all') return initialLinks;
    if (filterMode === 'npu') {
      return initialLinks.filter(
        (l) => l.source === 'npu_telemetry_agent' || l.target === 'npu_telemetry_agent' || l.id === 'link-sub-to-core'
      );
    }
    if (filterMode === 'rag') {
      return initialLinks.filter(
        (l) => l.source === 'rag_agent' || l.target === 'rag_agent' || l.id === 'link-sub-to-core'
      );
    }
    if (filterMode === 'memory') {
      return initialLinks.filter(
        (l) => l.source === 'dream_agent' || l.target === 'dream_agent' || l.id === 'link-sub-to-core'
      );
    }
    return initialLinks;
  }, [filterMode, initialLinks]);

  // Particles state for animated pulse flows
  const particlesRef = useRef<Particle[]>([]);
  const nextParticleIdRef = useRef(1);

  // Function to burst inject thought pulses
  const handleInjectPulse = () => {
    const burstParticles: Particle[] = [];
    currentFilteredLinks.forEach((link) => {
      const srcId = typeof link.source === 'string' ? link.source : (link.source as ThoughtStreamNode).id;
      const tgtId = typeof link.target === 'string' ? link.target : (link.target as ThoughtStreamNode).id;
      for (let i = 0; i < 3; i++) {
        burstParticles.push({
          id: nextParticleIdRef.current++,
          linkId: link.id,
          sourceId: srcId,
          targetId: tgtId,
          progress: i * 0.25,
          speed: (0.012 + Math.random() * 0.008) * speedMultiplier,
          color: link.color,
          size: 4.5,
        });
      }
    });
    particlesRef.current = [...particlesRef.current, ...burstParticles].slice(-45);
  };

  // Keep particle population flowing continuously
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setStreamTick((t) => t + 1);

      // Randomly spawn regular thought pulses along links
      if (particlesRef.current.length < 24) {
        const link = currentFilteredLinks[Math.floor(Math.random() * currentFilteredLinks.length)];
        if (link) {
          const srcId = typeof link.source === 'string' ? link.source : (link.source as ThoughtStreamNode).id;
          const tgtId = typeof link.target === 'string' ? link.target : (link.target as ThoughtStreamNode).id;
          particlesRef.current.push({
            id: nextParticleIdRef.current++,
            linkId: link.id,
            sourceId: srcId,
            targetId: tgtId,
            progress: 0,
            speed: (0.008 + Math.random() * 0.006) * speedMultiplier,
            color: link.color,
            size: 3.5,
          });
        }
      }
    }, 120 / speedMultiplier);

    return () => clearInterval(interval);
  }, [isRunning, speedMultiplier, currentFilteredLinks]);

  // Main D3 Rendering and Force Simulation
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 760;
    const height = 480;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', height);

    // Definitions for glow filters and markers
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'thought-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Arrow markers for links
    initialLinks.forEach((link) => {
      defs
        .append('marker')
        .attr('id', `arrow-${link.id}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 22)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4L8,0L0,4')
        .attr('fill', link.color)
        .attr('opacity', 0.8);
    });

    // Background decorative grid
    const gridGroup = svg.append('g').attr('class', 'grid-layer').attr('opacity', 0.12);
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      gridGroup.append('line').attr('x1', x).attr('y1', 0).attr('x2', x).attr('y2', height).attr('stroke', '#71717a').attr('stroke-width', 0.5);
    }
    for (let y = 0; y < height; y += gridSize) {
      gridGroup.append('line').attr('x1', 0).attr('y1', y).attr('x2', width).attr('y2', y).attr('stroke', '#71717a').attr('stroke-width', 0.5);
    }

    // Radial background glow behind Core and Subconscious
    const radialGrad = defs
      .append('radialGradient')
      .attr('id', 'core-back-glow')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    radialGrad.append('stop').attr('offset', '0%').attr('stop-color', '#a855f7').attr('stop-opacity', 0.18);
    radialGrad.append('stop').attr('offset', '100%').attr('stop-color', '#a855f7').attr('stop-opacity', 0);

    svg
      .append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', Math.min(width, height) * 0.42)
      .attr('fill', 'url(#core-back-glow)');

    // Deep clones for D3 simulation to prevent reference clobbering
    const simulationNodes: ThoughtStreamNode[] = JSON.parse(JSON.stringify(initialNodes));
    const simulationLinks: ThoughtStreamLink[] = JSON.parse(JSON.stringify(currentFilteredLinks));

    // Fix initial positions around center
    simulationNodes.forEach((node, i) => {
      if (node.id === 'main_loop') {
        node.fx = width / 2 + 60;
        node.fy = height / 2;
      } else if (node.id === 'subconscious_daemon') {
        node.fx = width / 2 - 80;
        node.fy = height / 2;
      } else {
        // Distribute subagents in an orbit around the center
        const angle = (i / (simulationNodes.length - 2)) * Math.PI * 2;
        const radius = Math.min(width, height) * 0.36;
        node.x = width / 2 + Math.cos(angle) * radius;
        node.y = height / 2 + Math.sin(angle) * radius;
      }
    });

    // Create D3 Force Simulation
    const simulation = d3
      .forceSimulation<ThoughtStreamNode>(simulationNodes)
      .force(
        'link',
        d3
          .forceLink<ThoughtStreamNode, ThoughtStreamLink>(simulationLinks)
          .id((d) => d.id)
          .distance(120)
          .strength(0.6)
      )
      .force('charge', d3.forceManyBody().strength(-350))
      .force('collision', d3.forceCollide().radius((d) => (d as ThoughtStreamNode).size + 24))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.08));

    // Container groups
    const linksGroup = svg.append('g').attr('class', 'links-group');
    const particlesGroup = svg.append('g').attr('class', 'particles-group');
    const nodesGroup = svg.append('g').attr('class', 'nodes-group');

    // Render Link Paths
    const linkElements = linksGroup
      .selectAll<SVGPathElement, ThoughtStreamLink>('path')
      .data(simulationLinks)
      .enter()
      .append('path')
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', (d) => (d.id === 'link-sub-to-core' ? 3.5 : 2))
      .attr('stroke-opacity', 0.6)
      .attr('stroke-dasharray', (d) => (d.id === 'link-sub-to-core' ? 'none' : '4,3'))
      .attr('fill', 'none')
      .attr('marker-end', (d) => `url(#arrow-${d.id})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedLink(d);
        setSelectedNode(null);
      });

    // Link hover effect
    linkElements
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('stroke-opacity', 1).attr('stroke-width', 4);
      })
      .on('mouseleave', function (event, d) {
        d3.select(this).attr('stroke-opacity', 0.6).attr('stroke-width', d.id === 'link-sub-to-core' ? 3.5 : 2);
      });

    // Drag behavior for nodes
    const drag = d3
      .drag<SVGGElement, ThoughtStreamNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        // If it's not main loop or subconscious, allow it to float
        if (d.id !== 'main_loop' && d.id !== 'subconscious_daemon') {
          d.fx = null;
          d.fy = null;
        }
      });

    // Render Nodes Group
    const nodeElements = nodesGroup
      .selectAll<SVGGElement, ThoughtStreamNode>('g')
      .data(simulationNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'grab')
      .call(drag)
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
        setSelectedLink(null);
      });

    // Outer pulsating halo for main engine and subconscious daemon
    nodeElements
      .filter((d) => d.category !== 'sub_agent')
      .append('circle')
      .attr('r', (d) => d.size + 8)
      .attr('fill', (d) => d.color)
      .attr('opacity', 0.2)
      .attr('filter', 'url(#thought-glow)');

    // Main Node circle
    nodeElements
      .append('circle')
      .attr('r', (d) => d.size)
      .attr('fill', '#09090b')
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#thought-glow)');

    // Inner icon or pulsing core dot
    nodeElements
      .append('circle')
      .attr('r', (d) => (d.category === 'sub_agent' ? 6 : 10))
      .attr('fill', (d) => d.color)
      .attr('opacity', 0.85);

    // Node Labels
    nodeElements
      .append('text')
      .attr('dy', (d) => d.size + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e4e4e7')
      .attr('font-size', (d) => (d.category === 'main_engine' ? '12px' : '10px'))
      .attr('font-weight', '600')
      .attr('font-family', 'ui-monospace, monospace')
      .text((d) => d.name.replace(' Agent', ''));

    // Status Badges under labels
    nodeElements
      .append('text')
      .attr('dy', (d) => d.size + 25)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => d.color)
      .attr('font-size', '9px')
      .attr('font-mono', 'true')
      .text((d) => `[${d.badge}]`);

    // Curve calculation helper for organic curved paths
    function calculateCurvedPath(s: ThoughtStreamNode, t: ThoughtStreamNode): string {
      const dx = (t.x || 0) - (s.x || 0);
      const dy = (t.y || 0) - (s.y || 0);
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.25;
      return `M${s.x},${s.y}A${dr},${dr} 0 0,1 ${t.x},${t.y}`;
    }

    // Simulation tick handler
    simulation.on('tick', () => {
      // Keep within bounds
      simulationNodes.forEach((d) => {
        d.x = Math.max(d.size + 10, Math.min(width - d.size - 10, d.x || width / 2));
        d.y = Math.max(d.size + 10, Math.min(height - d.size - 30, d.y || height / 2));
      });

      // Update curved link paths
      linkElements.attr('d', (d) => {
        const s = d.source as ThoughtStreamNode;
        const t = d.target as ThoughtStreamNode;
        return calculateCurvedPath(s, t);
      });

      // Update node positions
      nodeElements.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // Particle Animation Loop (RAF)
    let animationFrameId: number;

    const animateParticles = () => {
      if (isRunning) {
        // Update particles along curved paths
        const currentParticles = particlesRef.current;
        const remainingParticles: Particle[] = [];

        // Map link paths for point calculation
        const linkPathMap = new Map<string, SVGPathElement>();
        linkElements.each(function (d) {
          linkPathMap.set(d.id, this);
        });

        currentParticles.forEach((p) => {
          p.progress += p.speed * speedMultiplier;
          if (p.progress <= 1) {
            remainingParticles.push(p);
          }
        });

        particlesRef.current = remainingParticles;

        // Render particles in SVG
        const particleSelection = particlesGroup
          .selectAll<SVGCircleElement, Particle>('circle')
          .data(remainingParticles, (d) => d.id);

        particleSelection.exit().remove();

        const enterParticles = particleSelection
          .enter()
          .append('circle')
          .attr('r', (d) => d.size)
          .attr('fill', (d) => d.color)
          .attr('filter', 'url(#thought-glow)')
          .attr('opacity', 0.95);

        particleSelection
          .merge(enterParticles)
          .each(function (d) {
            const pathElem = linkPathMap.get(d.linkId);
            if (pathElem) {
              try {
                const totalLen = pathElem.getTotalLength();
                const pt = pathElem.getPointAtLength(d.progress * totalLen);
                d3.select(this).attr('cx', pt.x).attr('cy', pt.y);
              } catch {
                // Ignore transient geometry errors during resize
              }
            }
          });
      }

      animationFrameId = requestAnimationFrame(animateParticles);
    };

    animationFrameId = requestAnimationFrame(animateParticles);

    // Initial pulse on graph boot
    handleInjectPulse();

    return () => {
      cancelAnimationFrame(animationFrameId);
      simulation.stop();
    };
  }, [currentFilteredLinks, initialLinks, isRunning, speedMultiplier]);

  // Sizing via ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      // Re-render when container size changes
      setStreamTick((t) => t + 1);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-sm">
      {/* Header and Telemetry Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
            <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-purple-400" />
              Real-Time Sub-Agent Thought-Stream Graph (D3.js)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Live Topology
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Interactive D3 visualization of active background sub-agents feeding real-time latent context, RAG vectors, and telemetry into the main engine loop.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Inject Pulse Button */}
          <button
            onClick={handleInjectPulse}
            className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            title="Inject real-time synaptic pulse across all active links"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Inject Thought Pulse</span>
          </button>

          {/* Speed Toggle */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 text-[11px] font-mono">
            <button
              onClick={() => setSpeedMultiplier(0.5)}
              className={`px-2 py-1 rounded ${speedMultiplier === 0.5 ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              0.5x
            </button>
            <button
              onClick={() => setSpeedMultiplier(1)}
              className={`px-2 py-1 rounded ${speedMultiplier === 1 ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              1.0x
            </button>
            <button
              onClick={() => setSpeedMultiplier(2)}
              className={`px-2 py-1 rounded ${speedMultiplier === 2 ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              2.0x
            </button>
          </div>

          {/* Run/Pause */}
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              isRunning
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
            }`}
            title={isRunning ? 'Pause Thought Stream' : 'Resume Thought Stream'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-zinc-500 font-mono text-[11px] mr-1">Stream Filter:</span>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all ${
              filterMode === 'all'
                ? 'bg-purple-500/20 text-purple-200 border-purple-500/50'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            All Sub-Agents (8 Nodes)
          </button>
          <button
            onClick={() => setFilterMode('npu')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all ${
              filterMode === 'npu'
                ? 'bg-rose-500/20 text-rose-200 border-rose-500/50'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            AMD NPU Silicon Bus
          </button>
          <button
            onClick={() => setFilterMode('rag')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all ${
              filterMode === 'rag'
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            RAG Vector Priming
          </button>
          <button
            onClick={() => setFilterMode('memory')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all ${
              filterMode === 'memory'
                ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/50'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            Memory & Dream Plasticity
          </button>
        </div>

        <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          <span>Stream Throughput: <strong>968.8 KB/s</strong></span>
        </div>
      </div>

      {/* D3 Canvas Visualization Stage */}
      <div
        ref={containerRef}
        className="relative w-full h-[480px] bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-inner select-none"
        onClick={() => {
          setSelectedNode(null);
          setSelectedLink(null);
        }}
      >
        <svg ref={svgRef} className="w-full h-full block" />

        {/* Corner Legend / Hint */}
        <div className="absolute top-3 left-3 pointer-events-none text-[10px] font-mono text-zinc-500 space-y-1 bg-zinc-900/80 p-2 rounded border border-zinc-800/80 backdrop-blur-sm">
          <div className="text-zinc-300 font-semibold flex items-center gap-1">
            <Info className="w-3 h-3 text-purple-400" />
            <span>Interactive Guide</span>
          </div>
          <div>• Drag nodes to test spring forces</div>
          <div>• Click node or link to inspect live payload</div>
          <div>• Glowing particles = active thought streams</div>
        </div>

        {/* Selected Node Telemetry Drawer */}
        {selectedNode && (
          <div
            className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md p-3.5 rounded-xl bg-zinc-900/95 border border-purple-500/40 text-xs space-y-2 shadow-2xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedNode.color }}
                />
                <span className="font-bold text-zinc-100 font-mono">{selectedNode.name}</span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
              >
                ✕
              </button>
            </div>

            <div className="text-zinc-300 text-[11px] leading-relaxed">
              {selectedNode.role}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
              <div className="p-2 rounded bg-zinc-950 border border-zinc-800 space-y-0.5">
                <span className="text-zinc-500">Live Throughput</span>
                <div className="text-zinc-200 font-semibold">{selectedNode.throughputKbps} KB/s</div>
              </div>
              <div className="p-2 rounded bg-zinc-950 border border-zinc-800 space-y-0.5">
                <span className="text-zinc-500">Packets Processed</span>
                <div className="text-emerald-400 font-semibold">{selectedNode.packetsCount} pkts</div>
              </div>
              {selectedNode.powerWatts && (
                <div className="p-2 rounded bg-zinc-950 border border-zinc-800 space-y-0.5 col-span-2">
                  <span className="text-zinc-500">Silicon Allocation & Power Draw</span>
                  <div className="text-purple-300 font-semibold">{selectedNode.powerWatts} Watts (Dedicated NPU partition)</div>
                </div>
              )}
            </div>

            <div className="p-2 rounded bg-purple-950/40 border border-purple-800/40 text-[10px] font-mono text-purple-200">
              <span className="text-purple-400 font-semibold">Active Thought Payload:</span>{' '}
              {selectedNode.lastPayload}
            </div>
          </div>
        )}

        {/* Selected Link Telemetry Drawer */}
        {selectedLink && (
          <div
            className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md p-3.5 rounded-xl bg-zinc-900/95 border border-cyan-500/40 text-xs space-y-2 shadow-2xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-zinc-100 font-mono">Synaptic Channel Telemetry</span>
              </div>
              <button
                onClick={() => setSelectedLink(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 rounded bg-zinc-950 border border-zinc-800 space-y-0.5">
                <span className="text-zinc-500">Hardware Protocol</span>
                <div className="text-zinc-200 font-semibold">{selectedLink.protocol}</div>
              </div>
              <div className="p-2 rounded bg-zinc-950 border border-zinc-800 space-y-0.5">
                <span className="text-zinc-500">Bus Bandwidth</span>
                <div className="text-cyan-300 font-semibold">{selectedLink.bandwidth}</div>
              </div>
              <div className="p-2 rounded bg-zinc-950 border border-zinc-800 space-y-0.5 col-span-2">
                <span className="text-zinc-500">Handoff Latency</span>
                <div className="text-emerald-400 font-semibold">&lt; {selectedLink.latencyMs} ms (Zero DRAM overhead)</div>
              </div>
            </div>

            <div className="p-2 rounded bg-cyan-950/40 border border-cyan-800/40 text-[10px] font-mono text-cyan-200">
              <span className="text-cyan-400 font-semibold">Real-time Stream Signal:</span>{' '}
              {selectedLink.activePayload}
            </div>
          </div>
        )}
      </div>

      {/* Summary Footer: Live Activity Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
        <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
          <div className="text-[10px] text-zinc-500 font-mono uppercase">Main Loop Integration</div>
          <div className="text-zinc-200 font-semibold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-red-400" />
            <span>Direct Conscious Handoff</span>
          </div>
          <p className="text-[10px] text-zinc-400">
            Subconscious signals enter the active generation context at zero latency.
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
          <div className="text-[10px] text-zinc-500 font-mono uppercase">Multi-Agent Concurrency</div>
          <div className="text-purple-300 font-semibold flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span>6 Background Sub-Agents</span>
          </div>
          <p className="text-[10px] text-zinc-400">
            RAG vector pre-fetch, AIE telemetry, memory consolidation, and sandbox warming run in parallel.
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
          <div className="text-[10px] text-zinc-500 font-mono uppercase">Energy Efficiency</div>
          <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dedicated NPU Tiles (3.8W)</span>
          </div>
          <p className="text-[10px] text-zinc-400">
            Independent tile mesh prevents battery drain and CPU context-switch latency.
          </p>
        </div>
      </div>
    </div>
  );
};
