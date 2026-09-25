import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { IdeaNode, IdeaEdge, RelationshipType } from '../../types';
import { GlassCard } from '../common/GlassCard';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Edit2,
  Link as LinkIcon,
  CheckSquare,
  HelpCircle,
  Lightbulb,
  Sparkles,
  FileText,
  Bookmark,
  Layers,
  ListTree,
  Network,
  ArrowRight,
  Pin,
  Trash2,
  Plus,
  Play,
  Pause,
  Compass,
  Check,
  X,
  Search,
  Filter,
  Maximize2,
  Sliders,
  Lock,
  Unlock,
  ShieldCheck,
} from 'lucide-react';

interface InteractiveGraphCanvasProps {
  ideas: IdeaNode[];
  edges: IdeaEdge[];
  selectedIdeaId: string | null;
  onSelectIdea: (ideaId: string | null) => void;
  onEditIdea: (idea: IdeaNode) => void;
  onOpenAddConnection: (sourceIdea: IdeaNode) => void;
  onConvertIdeaToTask: (idea: IdeaNode) => void;
  onAddConnectionDirect?: (sourceId: string, targetId: string, relationshipType: RelationshipType) => void;
  onDeleteIdea?: (ideaId: string) => void;
  onCreateIdeaAt?: (x: number, y: number) => void;
}

interface NodePosition {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  pinned?: boolean;
}

export const InteractiveGraphCanvas: React.FC<InteractiveGraphCanvasProps> = ({
  ideas,
  edges,
  selectedIdeaId,
  onSelectIdea,
  onEditIdea,
  onOpenAddConnection,
  onConvertIdeaToTask,
  onAddConnectionDirect,
  onDeleteIdea,
  onCreateIdeaAt,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // View state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [viewStyle, setViewStyle] = useState<'canvas' | 'hierarchical'>('canvas');

  // Node positions and physics
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({});
  const [physicsActive, setPhysicsActive] = useState<boolean>(true);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Interactive Direct-Connect Mode
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pendingTargetId, setPendingTargetId] = useState<string | null>(null);
  const [showRelationPicker, setShowRelationPicker] = useState(false);

  // In-canvas search & filter
  const [canvasSearch, setCanvasSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Mini-map toggle
  const [showMiniMap, setShowMiniMap] = useState(true);

  // Spacing & Layout controls
  const [spacingMode, setSpacingMode] = useState<'compact' | 'balanced' | 'expansive'>('balanced');

  // Stability & Freeze controls
  const [isLayoutStable, setIsLayoutStable] = useState<boolean>(true);
  const [layoutFrozen, setLayoutFrozen] = useState<boolean>(false);
  const alphaRef = useRef<number>(1.0);
  const [simulationEpoch, setSimulationEpoch] = useState<number>(0);

  const reheatSimulation = useCallback((initialAlpha = 1.0) => {
    alphaRef.current = initialAlpha;
    setIsLayoutStable(false);
    setSimulationEpoch((prev) => prev + 1);
  }, []);



  // Initialize node positions with expansive, anti-clustering distribution
  useEffect(() => {
    const width = containerRef.current?.clientWidth || 900;
    const height = containerRef.current?.clientHeight || 650;
    const centerX = width / 2;
    const centerY = height / 2;
    const count = ideas.length;

    setNodePositions((prev) => {
      const updated: Record<string, NodePosition> = { ...prev };
      let newAdded = false;

      ideas.forEach((idea, index) => {
        if (!updated[idea.id]) {
          newAdded = true;
          if (idea.metadata?.x !== undefined && idea.metadata?.y !== undefined) {
            updated[idea.id] = {
              x: idea.metadata.x,
              y: idea.metadata.y,
              vx: 0,
              vy: 0,
              pinned: idea.metadata.pinned || false,
            };
          } else if (count === 1) {
            updated[idea.id] = { x: centerX, y: centerY, vx: 0, vy: 0, pinned: false };
          } else {
            // Expansive circular spread with staggered radii to prevent initial clustering
            const baseRadius = count <= 5 ? 270 : count <= 10 ? 330 : 390;
            const radius = baseRadius + (index % 3) * 65;
            const angle = (index / count) * 2 * Math.PI + 0.25;
            updated[idea.id] = {
              x: centerX + radius * Math.cos(angle),
              y: centerY + radius * Math.sin(angle),
              vx: 0,
              vy: 0,
              pinned: idea.metadata?.pinned || false,
            };
          }
        }
      });
      if (newAdded) {
        reheatSimulation(0.8);
      }
      return newAdded ? updated : prev;
    });
  }, [ideas, reheatSimulation]);

  // Rock-Solid Critically-Damped Physics Engine with Alpha Energy Cooling
  // Simulates organic settling and cools down completely to 0 velocity, stopping the RAF loop
  useEffect(() => {
    if (!physicsActive || layoutFrozen) {
      setIsLayoutStable(true);
      return;
    }

    let animId: number;
    let isRunning = true;

    const spacingMultiplier = spacingMode === 'expansive' ? 1.35 : spacingMode === 'compact' ? 0.85 : 1.05;
    const minCollisionDist = 240 * spacingMultiplier;
    const idealSpringDist = 260 * spacingMultiplier;
    const repulsionConstant = 16000 * spacingMultiplier;

    const runPhysicsStep = () => {
      if (!isRunning) return;

      const alpha = alphaRef.current;
      // When kinetic energy cools down below threshold, halt simulation completely
      if (alpha < 0.005) {
        setIsLayoutStable(true);
        return;
      }

      // Smooth decay factor: cools down over ~45-55 frames (~0.8 to 1.0 seconds)
      alphaRef.current *= 0.94;

      setNodePositions((prev) => {
        const next = { ...prev };
        const keys = Object.keys(next);
        const nodeCount = keys.length;
        if (nodeCount <= 1) return prev;

        const currentCenterX = containerRef.current ? containerRef.current.clientWidth / 2 : 450;
        const currentCenterY = containerRef.current ? containerRef.current.clientHeight / 2 : 325;

        // 1. Soft Coulomb Repulsion & Anti-Collision between node pairs
        for (let i = 0; i < nodeCount; i++) {
          const idA = keys[i];
          const nodeA = next[idA];
          if (!nodeA) continue;

          for (let j = i + 1; j < nodeCount; j++) {
            const idB = keys[j];
            const nodeB = next[idB];
            if (!nodeB) continue;

            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq) || 0.1;

            // Soft bounded repulsion scaled by alpha energy
            const safeDistSq = Math.max(distSq, 3600);
            const repulsionForce = (repulsionConstant / safeDistSq) * alpha;
            let fx = (dx / dist) * repulsionForce;
            let fy = (dy / dist) * repulsionForce;

            // Smooth linear anti-collision boundary without quadratic bounce
            if (dist < minCollisionDist) {
              const overlap = minCollisionDist - dist;
              const pushForce = overlap * 0.06 * alpha;
              fx += (dx / dist) * pushForce;
              fy += (dy / dist) * pushForce;
            }

            if (idA !== draggedNodeId && !nodeA.pinned) {
              nodeA.vx = (nodeA.vx || 0) - fx;
              nodeA.vy = (nodeA.vy || 0) - fy;
            }
            if (idB !== draggedNodeId && !nodeB.pinned) {
              nodeB.vx = (nodeB.vx || 0) + fx;
              nodeB.vy = (nodeB.vy || 0) + fy;
            }
          }
        }

        // 2. Spring attraction along connected edges (Hooke's Law)
        edges.forEach((edge) => {
          const nodeA = next[edge.sourceId];
          const nodeB = next[edge.targetId];
          if (!nodeA || !nodeB) return;

          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const springForce = (dist - idealSpringDist) * 0.015 * alpha;

          const fx = (dx / dist) * springForce;
          const fy = (dy / dist) * springForce;

          if (edge.sourceId !== draggedNodeId && !nodeA.pinned) {
            nodeA.vx = (nodeA.vx || 0) + fx;
            nodeA.vy = (nodeA.vy || 0) + fy;
          }
          if (edge.targetId !== draggedNodeId && !nodeB.pinned) {
            nodeB.vx = (nodeB.vx || 0) - fx;
            nodeB.vy = (nodeB.vy || 0) - fy;
          }
        });

        // 3. Gentle Centering Drift & Critical Velocity Damping
        let maxMovement = 0;
        keys.forEach((id) => {
          const node = next[id];
          if (!node || id === draggedNodeId || node.pinned) return;

          const cdx = currentCenterX - node.x;
          const cdy = currentCenterY - node.y;
          const distFromCenter = Math.sqrt(cdx * cdx + cdy * cdy);

          // Center pull scaled by alpha
          const centerPull = (distFromCenter > 500 ? 0.0006 : 0.00012) * alpha;
          node.vx = (node.vx || 0) + cdx * centerPull;
          node.vy = (node.vy || 0) + cdy * centerPull;

          // Critical damping (0.58) stops oscillations immediately
          const damping = 0.58;
          node.vx *= damping;
          node.vy *= damping;

          // Velocity cap scaled with alpha
          const maxSpeed = 5 * Math.max(alpha, 0.1);
          const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
          if (speed > maxSpeed) {
            node.vx = (node.vx / speed) * maxSpeed;
            node.vy = (node.vy / speed) * maxSpeed;
          }

          node.x += node.vx;
          node.y += node.vy;

          if (speed > maxMovement) maxMovement = speed;
        });

        // If kinetic movement has stopped, sleep immediately
        if (maxMovement < 0.02) {
          alphaRef.current = 0;
        }

        return next;
      });

      animId = requestAnimationFrame(runPhysicsStep);
    };

    animId = requestAnimationFrame(runPhysicsStep);
    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
    };
  }, [physicsActive, draggedNodeId, edges, spacingMode, layoutFrozen, simulationEpoch]);



  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.25));
  const handleZoomOut = () => setZoom((z) => Math.max(0.35, z - 0.25));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Fit View
  const handleFitView = () => {
    const coords = Object.values(nodePositions);
    if (coords.length === 0 || !containerRef.current) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    coords.forEach((c) => {
      if (c.x < minX) minX = c.x;
      if (c.x > maxX) maxX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.y > maxY) maxY = c.y;
    });

    const graphWidth = maxX - minX + 160;
    const graphHeight = maxY - minY + 160;
    const containerWidth = containerRef.current.clientWidth || 800;
    const containerHeight = containerRef.current.clientHeight || 550;

    const fitZoom = Math.min(containerWidth / graphWidth, containerHeight / graphHeight, 1.2);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setZoom(fitZoom);
    setPan({
      x: containerWidth / 2 - centerX * fitZoom,
      y: containerHeight / 2 - centerY * fitZoom,
    });
  };

  // Double click canvas to create node
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      if (onCreateIdeaAt) {
        onCreateIdeaAt(Math.round(x), Math.round(y));
      }
    }
  };

  // Toggle node pinning
  const togglePin = (nodeId: string) => {
    setNodePositions((prev) => {
      const current = prev[nodeId];
      if (!current) return prev;
      return {
        ...prev,
        [nodeId]: { ...current, pinned: !current.pinned },
      };
    });
  };

  // Node Type styling
  const getNodeVisuals = (type: string) => {
    switch (type) {
      case 'concept':
        return {
          fill: '#090d1f',
          stroke: '#6366f1',
          glow: 'rgba(99, 102, 241, 0.5)',
          textColor: '#e0e7ff',
          icon: Lightbulb,
        };
      case 'hypothesis':
        return {
          fill: '#15092a',
          stroke: '#a855f7',
          glow: 'rgba(168, 85, 247, 0.5)',
          textColor: '#f3e8ff',
          icon: Sparkles,
        };
      case 'insight':
        return {
          fill: '#041f17',
          stroke: '#10b981',
          glow: 'rgba(16, 185, 129, 0.5)',
          textColor: '#d1fae5',
          icon: Bookmark,
        };
      case 'question':
        return {
          fill: '#240f02',
          stroke: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.5)',
          textColor: '#fef3c7',
          icon: HelpCircle,
        };
      case 'resource':
        return {
          fill: '#041a24',
          stroke: '#06b6d4',
          glow: 'rgba(6, 182, 212, 0.5)',
          textColor: '#cffafe',
          icon: Layers,
        };
      default:
        return {
          fill: '#0a0f1d',
          stroke: '#94a3b8',
          glow: 'rgba(148, 163, 184, 0.4)',
          textColor: '#f8fafc',
          icon: FileText,
        };
    }
  };

  // Edge stroke color
  const getEdgeStroke = (relType: RelationshipType) => {
    switch (relType) {
      case 'supports':
        return '#10b981'; // Emerald
      case 'contradicts':
        return '#f43f5e'; // blue
      case 'depends_on':
        return '#f59e0b'; // Amber
      case 'inspired_by':
        return '#ec4899'; // Pink
      case 'part_of':
        return '#8b5cf6'; // red
      default:
        return '#6366f1'; // blue
    }
  };

  const selectedIdea = ideas.find((i) => i.id === selectedIdeaId);
  const connectSourceNode = ideas.find((i) => i.id === connectSourceId);

  // Click on a node handler
  const handleNodeClick = (e: React.MouseEvent, idea: IdeaNode) => {
    e.stopPropagation();

    if (connectSourceId) {
      if (connectSourceId === idea.id) {
        // Cancel connect
        setConnectSourceId(null);
        return;
      }
      // Target selected! Show quick relationship picker
      setPendingTargetId(idea.id);
      setShowRelationPicker(true);
      return;
    }

    onSelectIdea(idea.id === selectedIdeaId ? null : idea.id);
  };

  // Confirm connection creation
  const handleSelectRelationship = (relType: RelationshipType) => {
    if (connectSourceId && pendingTargetId && onAddConnectionDirect) {
      onAddConnectionDirect(connectSourceId, pendingTargetId, relType);
    }
    setConnectSourceId(null);
    setPendingTargetId(null);
    setShowRelationPicker(false);
  };

  // Filter ideas by in-canvas search & type
  const isNodeMatchingFilter = (idea: IdeaNode) => {
    if (filterType !== 'all' && idea.type !== filterType) return false;
    if (canvasSearch.trim()) {
      const q = canvasSearch.toLowerCase();
      const mTitle = idea.title.toLowerCase().includes(q);
      const mContent = idea.content.toLowerCase().includes(q);
      const mTag = idea.tags?.some((t) => t.toLowerCase().includes(q));
      if (!mTitle && !mContent && !mTag) return false;
    }
    return true;
  };

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        {/* View Mode & Physics Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl bg-white/10 border border-white/[0.14] p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewStyle('canvas')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewStyle === 'canvas'
                  ? 'bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/30'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Interactive Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setViewStyle('hierarchical')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewStyle === 'hierarchical'
                  ? 'bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/30'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <ListTree className="w-3.5 h-3.5" />
              <span>Relationship Tree</span>
            </button>
          </div>

          
        </div>

        {/* Canvas Zoom & Tool Controls */}
        {viewStyle === 'canvas' && (
          <div className="flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/[0.14] p-1 shadow-sm">
            <button
              type="button"
              onClick={handleZoomIn}
              aria-label="Zoom in"
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-white/80 px-1 font-semibold">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomOut}
              aria-label="Zoom out"
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

            <button
              type="button"
              onClick={handleFitView}
              aria-label="Fit graph to view"
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Fit all nodes in view"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              aria-label="Reset zoom and center"
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: INTERACTIVE SVG CANVAS */}
      {viewStyle === 'canvas' ? (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          
          onDoubleClick={handleDoubleClick}
          className="relative w-full h-[640px] md:h-[680px] rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/[0.18] overflow-hidden select-none cursor-grab active:cursor-grabbing shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6),inset_0_1px_1px_0_rgba(255,255,255,0.25)]"
        >
          {/* Luminous background refraction mesh */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl" />
            <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-red-600/15 blur-3xl" />
          </div>

          {/* Precision Dot Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.14] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1.2px, transparent 1.2px)',
              backgroundSize: '28px 28px',
              backgroundPosition: `${pan.x}px ${pan.y}px`,
            }}
          />

          {/* Interactive Connect Mode Banner */}
          {connectSourceNode && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
              <GlassCard
                variant="glow"
                className="px-4 py-2 border-blue-500/50 shadow-2xl flex items-center gap-3 backdrop-blur-2xl"
              >
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                <span className="text-sm font-semibold text-blue-200">
                  Connecting from{' '}
                  <strong className="text-white font-bold">"{connectSourceNode.title}"</strong>: Click any
                  other node to connect
                </span>
                <button
                  type="button"
                  onClick={() => setConnectSourceId(null)}
                  className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white/80 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </GlassCard>
            </div>
          )}

          {/* Canvas Search & Quick Filter Overlay */}
          <div className="absolute top-6 left-4 z-20 flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/60" />
              <input
                type="text"
                value={canvasSearch}
                onChange={(e) => setCanvasSearch(e.target.value)}
                placeholder="Highlight nodes..."
                className="w-40 sm:w-52 pl-8 pr-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-2xl border border-white/20 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 shadow-lg"
              />
              {canvasSearch && (
                <button
                  type="button"
                  onClick={() => setCanvasSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-sm"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-2xl border border-white/20 text-sm text-white focus:outline-none cursor-pointer capitalize shadow-lg"
            >
              <option value="all">All Types</option>
              <option value="concept">Concept</option>
              <option value="hypothesis">Hypothesis</option>
              <option value="insight">Insight</option>
              <option value="question">Question</option>
              <option value="resource">Resource</option>
            </select>
          </div>

          {/* SVG Graph rendering */}
          <svg
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            <defs>
              {/* Arrow markers for edges */}
              {['supports', 'contradicts', 'depends_on', 'inspired_by', 'part_of', 'related_to'].map(
                (type) => (
                  <marker
                    key={type}
                    id={`arrow-${type}`}
                    viewBox="0 0 10 10"
                    refX="30"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path
                      d="M 0 1.5 L 8 5 L 0 8.5 z"
                      fill={getEdgeStroke(type as RelationshipType)}
                    />
                  </marker>
                )
              )}
            </defs>

            {/* Edges layer */}
            <g className="edges-layer">
              {edges.map((edge) => {
                const sourcePos = nodePositions[edge.sourceId];
                const targetPos = nodePositions[edge.targetId];
                if (!sourcePos || !targetPos) return null;

                const isConnectedToFocus =
                  activeFocusId &&
                  (edge.sourceId === activeFocusId || edge.targetId === activeFocusId);
                const isDimmed = activeFocusId && !isConnectedToFocus;

                // Midpoint for label
                const midX = (sourcePos.x + targetPos.x) / 2;
                const midY = (sourcePos.y + targetPos.y) / 2;
                const strokeColor = getEdgeStroke(edge.relationshipType);

                return (
                  <g key={edge.id} className="transition-opacity duration-200">
                    {/* Glowing under-line for connected focus */}
                    {isConnectedToFocus && (
                      <line
                        x1={sourcePos.x}
                        y1={sourcePos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke={strokeColor}
                        strokeWidth="7"
                        strokeOpacity="0.25"
                      />
                    )}

                    {/* Primary connection line */}
                    <line
                      x1={sourcePos.x}
                      y1={sourcePos.y}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke={strokeColor}
                      strokeWidth={isConnectedToFocus ? 2.8 : 1.8}
                      strokeDasharray={
                        edge.relationshipType === 'contradicts'
                          ? '6 4'
                          : edge.relationshipType === 'depends_on'
                          ? '8 4'
                          : undefined
                      }
                      strokeOpacity={isDimmed ? 0.12 : isConnectedToFocus ? 1 : 0.65}
                      markerEnd={`url(#arrow-${edge.relationshipType})`}
                    />

                    {/* Animated directional flow dash on active edge */}
                    {isConnectedToFocus && (
                      <line
                        x1={sourcePos.x}
                        y1={sourcePos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        strokeDasharray="4 16"
                        className="graph-edge-flow"
                        strokeOpacity="0.85"
                      />
                    )}

                    {/* Relationship Badge in middle of edge */}
                    <g
                      transform={`translate(${midX}, ${midY})`}
                      opacity={isDimmed ? 0.12 : isConnectedToFocus ? 1 : 0.85}
                      className="pointer-events-none drop-shadow-md"
                    >
                      <rect
                        x="-32"
                        y="-10"
                        width="64"
                        height="20"
                        rx="10"
                        fill="#030712"
                        stroke={strokeColor}
                        strokeWidth="1.2"
                        fillOpacity="0.9"
                      />
                      <text
                        textAnchor="middle"
                        y="3.5"
                        fill="#f8fafc"
                        fontSize="9.5"
                        fontFamily="monospace"
                        fontWeight="700"
                        letterSpacing="0.03em"
                      >
                        {edge.relationshipType.replace('_', ' ')}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Dynamic Connecting Line while in Connect Mode */}
              {connectSourceId && nodePositions[connectSourceId] && (
                <line
                  x1={nodePositions[connectSourceId].x}
                  y1={nodePositions[connectSourceId].y}
                  x2={mouseCanvasPos.x}
                  y2={mouseCanvasPos.y}
                  stroke="#818cf8"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  className="graph-edge-flow"
                  strokeOpacity="0.9"
                />
              )}
            </g>

            {/* Nodes layer */}
            <g className="nodes-layer">
              {ideas.map((idea) => {
                const pos = nodePositions[idea.id];
                if (!pos) return null;

                const isSelected = selectedIdeaId === idea.id;
                const isHovered = hoveredNodeId === idea.id;
                const isConnectSource = connectSourceId === idea.id;
                const isConnected = connectedNodeIds.has(idea.id);
                const matchesFilter = isNodeMatchingFilter(idea);
                const isDimmed = (activeFocusId && !isConnected) || !matchesFilter;

                const visuals = getNodeVisuals(idea.type);
                const nodeRadius = isSelected ? 34 : 29;

                return (
                  <g
                    key={idea.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggedNodeId(idea.id);
                    }}
                    onClick={(e) => handleNodeClick(e, idea)}
                    onMouseEnter={() => setHoveredNodeId(idea.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    className="cursor-pointer transition-opacity duration-200"
                    opacity={isDimmed ? 0.15 : 1}
                  >
                    {/* Glow ring when selected or active */}
                    {(isSelected || isHovered || isConnectSource) && (
                      <circle
                        r={isSelected ? 16 : 12}
                        fill="none"
                        stroke={visuals.stroke}
                        strokeWidth="1.5"
                        opacity={isSelected ? 0.8 : 0.4}
                      />
                    )}

                    {/* Obsidian style node dot */}
                    <circle
                      r={isSelected ? 7 : 5}
                      fill={visuals.stroke} // Use the stroke color for solid dot
                      className="transition-all duration-200"
                    />

                    {/* Pinned marker */}
                    {pos.pinned && (
                      <circle cx="0" cy="0" r="2" fill="#030712" className="pointer-events-none" />
                    )}

                    {/* Title Label next to circle (Obsidian style) */}
                    {(isHovered || isSelected || zoom > 0.6) && (
                      <text
                        x="12"
                        y="4"
                        fill={isSelected ? '#ffffff' : '#94a3b8'}
                        fontSize="11"
                        fontWeight={isSelected ? 'bold' : '500'}
                        className="select-none pointer-events-none"
                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,1)' }}
                      >
                        {idea.title.length > 40 ? `${idea.title.substring(0, 38)}...` : idea.title}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Inline Relationship Selector Popup (when connecting two nodes) */}
          {showRelationPicker && pendingTargetId && (
            <div className="absolute inset-0 z-40 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm animate-in fade-in duration-150">
              <GlassCard variant="elevated" className="p-6 max-w-sm w-full border-blue-500/40">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                    <LinkIcon className="w-4 h-4 text-blue-500" />
                    <span>Choose Relationship</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRelationPicker(false);
                      setConnectSourceId(null);
                    }}
                    className="text-white/60 hover:text-white text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3.5">
                  {[
                    { id: 'supports', label: 'Supports', color: 'text-emerald-300 border-emerald-500/40' },
                    { id: 'depends_on', label: 'Depends On', color: 'text-amber-300 border-red-500/40' },
                    { id: 'contradicts', label: 'Contradicts', color: 'text-blue-300 border-blue-500/40' },
                    { id: 'inspired_by', label: 'Inspired By', color: 'text-pink-300 border-blue-500/40' },
                    { id: 'part_of', label: 'Part Of', color: 'text-red-300 border-red-500/40' },
                    { id: 'related_to', label: 'Related To', color: 'text-blue-300 border-blue-500/40' },
                  ].map((rel) => (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => handleSelectRelationship(rel.id as RelationshipType)}
                      className={`p-2.5 rounded-xl bg-white/10 hover:bg-white/10 border text-sm font-semibold text-left transition-all cursor-pointer ${rel.color}`}
                    >
                      {rel.label}
                    </button>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}

          {/* Mini-Map / Radar in bottom left corner */}
          {showMiniMap && (
            <div className="absolute bottom-4 left-4 z-20">
              <GlassCard
                variant="subtle"
                className="w-36 h-28 p-1.5 relative overflow-hidden border-white/10 bg-white/10 backdrop-blur-2xl shadow-xl"
              >
                
                <svg className="w-full h-full">
                  {/* Mini nodes */}
                  {ideas.map((idea) => {
                    const pos = nodePositions[idea.id];
                    if (!pos) return null;
                    // Scale 800x550 into 140x100
                    const mx = (pos.x / 800) * 130 + 5;
                    const my = (pos.y / 550) * 85 + 15;
                    const isFocus = idea.id === selectedIdeaId;

                    return (
                      <circle
                        key={idea.id}
                        cx={mx}
                        cy={my}
                        r={isFocus ? 3.5 : 2}
                        fill={isFocus ? '#818cf8' : '#94a3b8'}
                        opacity={isFocus ? 1 : 0.6}
                      />
                    );
                  })}
                  {/* Mini viewport box */}
                  <rect
                    x={Math.max(0, (-pan.x / (800 * zoom)) * 130 + 5)}
                    y={Math.max(0, (-pan.y / (550 * zoom)) * 85 + 15)}
                    width={Math.min(130, (1 / zoom) * 130)}
                    height={Math.min(85, (1 / zoom) * 85)}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                </svg>
              </GlassCard>
            </div>
          )}

          {/* Interactive Node Inspector Glass Drawer (When node is selected) */}
          {selectedIdea && (
            <div className="absolute bottom-4 right-4 z-30 w-80 sm:w-96 animate-in slide-in-from-bottom-3 duration-200">
              <GlassCard
                variant="elevated"
                className="p-6 border-blue-500/50 shadow-2xl backdrop-blur-2xl bg-white/10"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 border border-blue-500/40">
                      {selectedIdea.type}
                    </span>
                    <span className="text-sm text-white/60 font-medium">
                      {edges.filter((e) => e.sourceId === selectedIdea.id || e.targetId === selectedIdea.id).length}{' '}
                      connections
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => togglePin(selectedIdea.id)}
                      className={`p-1 rounded-lg border transition-colors cursor-pointer ${
                        nodePositions[selectedIdea.id]?.pinned
                          ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                          : 'bg-white/5 text-white/60 hover:text-white border-white/10'
                      }`}
                      title={nodePositions[selectedIdea.id]?.pinned ? 'Unpin Position' : 'Pin Position'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectIdea(null)}
                      className="p-1 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <h4 className="text-base font-bold text-white mt-2 leading-tight">
                  {selectedIdea.title}
                </h4>
                <p className="text-sm text-white/80 mt-1 line-clamp-3 leading-relaxed">
                  {selectedIdea.content}
                </p>

                {/* Direct Action Buttons */}
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setConnectSourceId(selectedIdea.id);
                    }}
                    className="py-1.5 px-2 rounded-xl bg-blue-500/30 hover:bg-blue-500/50 text-blue-200 border border-blue-500/40 text-sm font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Connect this node to another"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditIdea(selectedIdea)}
                    className="py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-sm font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onConvertIdeaToTask(selectedIdea)}
                    className="py-1.5 px-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 text-sm font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Convert into task"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Task</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteIdea) {
                        onDeleteIdea(selectedIdea.id);
                        onSelectIdea(null);
                      }
                    }}
                    className="py-1.5 px-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-blue-500/40 text-sm font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Delete Idea"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Quick Double-Click Instruction Cue */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none text-[11px] text-white/60/80 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 hidden sm:block">
            Tip: Scroll to zoom &bull; Drag to pan &bull; Drag nodes to rearrange &bull; Double-click to spawn idea
          </div>
        </div>
      ) : (
        /* VIEW 2: HIERARCHICAL / STRUCTURED TREE LIST */
        <div className="space-y-3">
          {ideas.map((idea) => {
            const outgoing = edges.filter((e) => e.sourceId === idea.id);
            const incoming = edges.filter((e) => e.targetId === idea.id);
            const ideaMap = new Map(ideas.map((i) => [i.id, i]));

            return (
              <GlassCard key={idea.id} className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-blue-950/70 text-blue-300 border border-blue-500/30">
                        {idea.type}
                      </span>
                      <h4 className="text-base font-semibold text-white">{idea.title}</h4>
                    </div>
                    <p className="text-sm text-white/60 mt-1 leading-relaxed">{idea.content}</p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenAddConnection(idea)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
                      title="Add Connection"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditIdea(idea)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
                      title="Edit Node"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Relationships summary */}
                {(outgoing.length > 0 || incoming.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2 items-center">
                    {outgoing.map((edge) => {
                      const target = ideaMap.get(edge.targetId);
                      return (
                        <span
                          key={edge.id}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-black/20 border border-white/10 text-white/80"
                        >
                          <span className="font-mono text-blue-300 text-[10px]">
                            {edge.relationshipType}
                          </span>
                          <ArrowRight className="w-3 h-3 text-white/60" />
                          <span className="font-semibold text-white">
                            {target ? target.title.substring(0, 24) : edge.targetId}
                          </span>
                        </span>
                      );
                    })}

                    {incoming.map((edge) => {
                      const source = ideaMap.get(edge.sourceId);
                      return (
                        <span
                          key={edge.id}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-black/20 border border-white/10 text-white/80"
                        >
                          <span className="font-semibold text-white">
                            {source ? source.title.substring(0, 24) : edge.sourceId}
                          </span>
                          <ArrowRight className="w-3 h-3 text-white/60" />
                          <span className="font-mono text-red-300 text-[10px]">
                            {edge.relationshipType}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
