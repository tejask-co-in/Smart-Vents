import React, { useState } from 'react';
import { Vent, Project } from '../../types/vent';
import { KnowledgeGraphVisualizer } from '../visuals/KnowledgeGraphVisualizer';
import { CategoryDistributionChart } from '../visuals/CategoryDistributionChart';
import { PriorityMatrixDiagram } from '../visuals/PriorityMatrixDiagram';
import { ProjectTreeDiagram } from '../visuals/ProjectTreeDiagram';
import { Network, PieChart, Grid, GitBranch, LayoutDashboard, Download, Check } from 'lucide-react';

interface VisualStudioViewProps {
  vents: Vent[];
  projects: Project[];
  onSelectVent: (vent: Vent) => void;
}

export const VisualStudioView: React.FC<VisualStudioViewProps> = ({
  vents,
  projects,
  onSelectVent,
}) => {
  const [activeFormat, setActiveFormat] = useState<
    'all' | 'graph' | 'distribution' | 'matrix' | 'mindmap'
  >('all');
  const [copied, setCopied] = useState(false);

  const activeVents = vents.filter((v) => !v.archived && !v.deleted);

  const handleExportVisualSummary = () => {
    // Generate visual metrics summary
    const typeCount: Record<string, number> = {};
    const priorityCount: Record<string, number> = {};
    activeVents.forEach((v) => {
      typeCount[v.type] = (typeCount[v.type] || 0) + 1;
      priorityCount[v.priority] = (priorityCount[v.priority] || 0) + 1;
    });

    let md = `# Smart Vent Visual Understanding Report\n*Generated on ${new Date().toLocaleString()}*\n\n`;
    md += `## 1. Overview\n`;
    md += `- Total Active Dumps: ${activeVents.length}\n`;
    md += `- Projects Emerged/Active: ${projects.length}\n\n`;

    md += `## 2. Category Distribution Breakdown\n`;
    Object.entries(typeCount).forEach(([type, count]) => {
      const pct = Math.round((count / (activeVents.length || 1)) * 100);
      md += `- **${type}**: ${count} (${pct}%)\n`;
    });
    md += `\n`;

    md += `## 3. Priority Matrix Distribution\n`;
    Object.entries(priorityCount).forEach(([prio, count]) => {
      md += `- **${prio.toUpperCase()}**: ${count}\n`;
    });
    md += `\n`;

    md += `## 4. Emergent Projects & Linked Knowledge\n`;
    projects.forEach((p) => {
      const linked = activeVents.filter((v) => v.projectId === p.id);
      md += `### ${p.name} (${linked.length} linked dumps)\n`;
      linked.forEach((v) => {
        md += `- [${v.type}] ${v.title} (Priority: ${v.priority})\n`;
      });
      md += `\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-vent-visual-report-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b app-border">
        <div>
          <h2 className="text-lg font-semibold app-text-main flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-indigo-500" />
            <span>Visual Formats & Interactive Diagrams</span>
          </h2>
          <p className="text-xs app-text-muted mt-1">
            Visual representations of your digital dumping ground: interactive network graphs, priority matrices, and concept mindmaps.
          </p>
        </div>

        {/* Actions & Format Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportVisualSummary}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs app-subtle app-border rounded-md app-text-main hover:opacity-90 transition cursor-pointer"
            title="Download structured markdown report of your visual data"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Download className="w-3.5 h-3.5 text-indigo-500" />}
            <span>{copied ? 'Report Exported!' : 'Export Visual Report'}</span>
          </button>

          <div className="flex items-center gap-1 p-0.5 app-subtle rounded-lg app-border overflow-x-auto text-xs">
            <button
              onClick={() => setActiveFormat('all')}
              className={`px-2.5 py-1 font-medium rounded-md transition cursor-pointer whitespace-nowrap ${
                activeFormat === 'all'
                  ? 'app-card app-text-main font-semibold shadow-xs'
                  : 'app-text-muted hover:opacity-100'
              }`}
            >
              All Formats
            </button>
            <button
              onClick={() => setActiveFormat('graph')}
              className={`flex items-center gap-1 px-2.5 py-1 font-medium rounded-md transition cursor-pointer whitespace-nowrap ${
                activeFormat === 'graph'
                  ? 'app-card text-indigo-500 font-semibold shadow-xs'
                  : 'app-text-muted hover:opacity-100'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-indigo-500" />
              <span>Graph</span>
            </button>
            <button
              onClick={() => setActiveFormat('distribution')}
              className={`flex items-center gap-1 px-2.5 py-1 font-medium rounded-md transition cursor-pointer whitespace-nowrap ${
                activeFormat === 'distribution'
                  ? 'app-card text-emerald-500 font-semibold shadow-xs'
                  : 'app-text-muted hover:opacity-100'
              }`}
            >
              <PieChart className="w-3.5 h-3.5 text-emerald-500" />
              <span>Charts</span>
            </button>
            <button
              onClick={() => setActiveFormat('matrix')}
              className={`flex items-center gap-1 px-2.5 py-1 font-medium rounded-md transition cursor-pointer whitespace-nowrap ${
                activeFormat === 'matrix'
                  ? 'app-card text-amber-500 font-semibold shadow-xs'
                  : 'app-text-muted hover:opacity-100'
              }`}
            >
              <Grid className="w-3.5 h-3.5 text-amber-500" />
              <span>Matrix</span>
            </button>
            <button
              onClick={() => setActiveFormat('mindmap')}
              className={`flex items-center gap-1 px-2.5 py-1 font-medium rounded-md transition cursor-pointer whitespace-nowrap ${
                activeFormat === 'mindmap'
                  ? 'app-card text-sky-500 font-semibold shadow-xs'
                  : 'app-text-muted hover:opacity-100'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 text-sky-500" />
              <span>Mindmap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Components Feed */}
      <div className="space-y-6">
        {(activeFormat === 'all' || activeFormat === 'graph') && (
          <div className="animate-fadeIn">
            <KnowledgeGraphVisualizer
              vents={vents}
              projects={projects}
              onSelectVent={onSelectVent}
            />
          </div>
        )}

        {(activeFormat === 'all' || activeFormat === 'distribution') && (
          <div className="animate-fadeIn">
            <CategoryDistributionChart vents={vents} />
          </div>
        )}

        {(activeFormat === 'all' || activeFormat === 'matrix') && (
          <div className="animate-fadeIn">
            <PriorityMatrixDiagram vents={vents} onSelectVent={onSelectVent} />
          </div>
        )}

        {(activeFormat === 'all' || activeFormat === 'mindmap') && (
          <div className="animate-fadeIn">
            <ProjectTreeDiagram
              projects={projects}
              vents={vents}
              onSelectVent={onSelectVent}
            />
          </div>
        )}
      </div>
    </div>
  );
};
