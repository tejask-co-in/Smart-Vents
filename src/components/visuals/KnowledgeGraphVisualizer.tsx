import React, { useState, useEffect, useRef } from 'react';
import { Vent, Project } from '../../types/vent';
import { Sparkles, ZoomIn, ZoomOut, RotateCcw, Download, Eye } from 'lucide-react';

interface KnowledgeGraphVisualizerProps {
  vents: Vent[];
  projects: Project[];
  onSelectVent: (vent: Vent) => void;
}

interface Node {
  id: string;
  label: string;
  type: 'project' | 'task' | 'idea' | 'reference' | 'note' | 'tag';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  ventRef?: Vent;
}

interface Edge {
  source: string;
  target: string;
  type: string;
}

export const KnowledgeGraphVisualizer: React.FC<KnowledgeGraphVisualizerProps> = ({
  vents,
  projects,
  onSelectVent,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Build graph nodes and edges
  useEffect(() => {
    const width = 800;
    const height = 480;
    const activeVents = vents.filter((v) => !v.deleted && !v.archived);

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const nodeMap = new Map<string, Node>();

    // 1. Project nodes
    projects.forEach((proj, idx) => {
      const angle = (idx / Math.max(projects.length, 1)) * 2 * Math.PI;
      const radius = 130;
      const n: Node = {
        id: proj.id,
        label: proj.name,
        type: 'project',
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: 20,
      };
      newNodes.push(n);
      nodeMap.set(proj.id, n);
    });

    // 2. Vent nodes
    activeVents.forEach((v, idx) => {
      let type: Node['type'] = 'note';
      if (v.type === 'Task') type = 'task';
      else if (v.type === 'Future idea' || v.type === 'Project idea') type = 'idea';
      else if (v.type === 'Reference' || v.type === 'Bookmark') type = 'reference';

      const angle = (idx / Math.max(activeVents.length, 1)) * 2 * Math.PI + 0.3;
      const dist = 210 + (idx % 3) * 45;
      const n: Node = {
        id: v.id,
        label: v.title,
        type,
        x: width / 2 + Math.cos(angle) * dist,
        y: height / 2 + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: v.priority === 'critical' || v.priority === 'high' ? 14 : 10,
        ventRef: v,
      };
      newNodes.push(n);
      nodeMap.set(v.id, n);

      // Connect to project if linked
      if (v.projectId && nodeMap.has(v.projectId)) {
        newEdges.push({
          source: v.id,
          target: v.projectId,
          type: 'project_link',
        });
      }
    });

    // 3. Connect similar vents or common tags
    for (let i = 0; i < activeVents.length; i++) {
      for (let j = i + 1; j < activeVents.length; j++) {
        const vA = activeVents[i];
        const vB = activeVents[j];
        const commonTags = (vA.tags || []).filter((t) => (vB.tags || []).includes(t));
        if (commonTags.length >= 2) {
          newEdges.push({
            source: vA.id,
            target: vB.id,
            type: 'common_tag',
          });
        }
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [vents, projects]);

  const getNodeColor = (type: Node['type']) => {
    switch (type) {
      case 'project':
        return '#0284c7'; // Sky
      case 'task':
        return '#6366f1'; // Indigo
      case 'idea':
        return '#f59e0b'; // Amber
      case 'reference':
        return '#10b981'; // Emerald
      default:
        return '#64748b'; // Slate
    }
  };

  const handleExportGraph = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-vent-knowledge-graph-${new Date().toISOString().slice(0, 10)}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredNodes = nodes.filter((n) => {
    if (selectedType === 'all') return true;
    if (selectedType === 'projects') return n.type === 'project';
    if (selectedType === 'tasks') return n.type === 'task';
    if (selectedType === 'ideas') return n.type === 'idea';
    if (selectedType === 'references') return n.type === 'reference';
    return true;
  });

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = edges.filter(
    (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );

  return (
    <div className="rounded-2xl app-card app-border p-4 sm:p-5 flex flex-col space-y-4">
      {/* Visual Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold app-text-main flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Interactive Knowledge & Relationship Graph</span>
          </h3>
          <p className="text-xs app-text-muted mt-0.5">
            Visual topology mapping connected thoughts, projects, references, and emergent links.
          </p>
        </div>

        {/* Filter, Export & Zoom Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-0.5 rounded-lg app-subtle app-border text-xs">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-2 py-0.5 rounded transition ${
                selectedType === 'all' ? 'bg-indigo-600 text-white font-medium' : 'app-text-muted'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedType('projects')}
              className={`px-2 py-0.5 rounded transition ${
                selectedType === 'projects' ? 'bg-indigo-600 text-white font-medium' : 'app-text-muted'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setSelectedType('tasks')}
              className={`px-2 py-0.5 rounded transition ${
                selectedType === 'tasks' ? 'bg-indigo-600 text-white font-medium' : 'app-text-muted'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setSelectedType('ideas')}
              className={`px-2 py-0.5 rounded transition ${
                selectedType === 'ideas' ? 'bg-indigo-600 text-white font-medium' : 'app-text-muted'
              }`}
            >
              Ideas
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleExportGraph}
              className="flex items-center gap-1 px-2.5 py-1 text-xs app-card app-card-hover app-border rounded transition"
              title="Export Graph as SVG image"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.8))}
              className="p-1.5 app-card app-card-hover app-border rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.6))}
              className="p-1.5 app-card app-card-hover app-border rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 app-card app-card-hover app-border rounded"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        ref={containerRef}
        className="relative w-full h-[480px] rounded-xl app-subtle app-border overflow-hidden flex items-center justify-center select-none"
      >
        <svg
          ref={svgRef}
          viewBox="0 0 800 480"
          className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Subtle grid background */}
          <defs>
            <pattern id="graph-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#graph-grid)" />

          {/* Edges */}
          {filteredEdges.map((edge, idx) => {
            const src = nodes.find((n) => n.id === edge.source);
            const tgt = nodes.find((n) => n.id === edge.target);
            if (!src || !tgt) return null;

            const isHighlighted =
              hoveredNode && (hoveredNode.id === src.id || hoveredNode.id === tgt.id);

            return (
              <line
                key={idx}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={isHighlighted ? '#6366f1' : 'currentColor'}
                strokeOpacity={isHighlighted ? 0.9 : 0.18}
                strokeWidth={isHighlighted ? 2.5 : 1.2}
                strokeDasharray={edge.type === 'common_tag' ? '4 4' : 'none'}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Nodes */}
          {filteredNodes.map((node) => {
            const isHovered = hoveredNode?.id === node.id;
            const color = getNodeColor(node.type);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => {
                  if (node.ventRef) onSelectVent(node.ventRef);
                }}
                className="cursor-pointer"
              >
                {/* Glow ring on hover */}
                {isHovered && (
                  <circle
                    r={node.radius + 8}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    opacity="0.4"
                    className="animate-pulse"
                  />
                )}

                <circle
                  r={node.radius}
                  fill={color}
                  opacity={isHovered ? 1 : 0.9}
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                {/* Node Label */}
                <text
                  y={node.radius + 14}
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize={node.type === 'project' ? '12px' : '10px'}
                  fontWeight={node.type === 'project' ? '600' : '400'}
                  className="pointer-events-none select-none"
                >
                  {node.label.length > 20 ? `${node.label.slice(0, 18)}...` : node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover inspector card overlay */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 p-3 rounded-lg app-card app-border shadow-xl max-w-xs pointer-events-none text-xs">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getNodeColor(hoveredNode.type) }}
              />
              <span className="font-semibold app-text-main capitalize">{hoveredNode.type}</span>
            </div>
            <div className="font-medium app-text-main mt-1 truncate">{hoveredNode.label}</div>
            {hoveredNode.ventRef && (
              <p className="mt-1 text-[11px] app-text-muted line-clamp-2">
                {hoveredNode.ventRef.originalContent}
              </p>
            )}
            <div className="mt-2 text-[10px] text-indigo-500 font-mono flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>Click to inspect</span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-3 right-3 flex items-center gap-3 p-2 rounded-lg app-card app-border text-[10px] font-mono app-text-muted shadow-sm">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-500" /> Projects
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500" /> Tasks
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Ideas
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> References
          </span>
        </div>
      </div>
    </div>
  );
};
