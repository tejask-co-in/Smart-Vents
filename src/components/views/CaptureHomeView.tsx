import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  Compass,
  Folder,
  ArrowRight,
  LayoutGrid,
  List,
  Network,
  Download,
  Plus,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Archive,
  Trash2,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { Vent, Project, AttachmentMeta } from '../../types/vent';
import { VentInput } from '../vent/VentInput';
import { VentCard } from '../vent/VentCard';
import { KnowledgeGraphVisualizer } from '../visuals/KnowledgeGraphVisualizer';
import { CategoryDistributionChart } from '../visuals/CategoryDistributionChart';
import { PriorityMatrixDiagram } from '../visuals/PriorityMatrixDiagram';
import { demoShowcaseVents, demoShowcaseProjects } from '../../db/initialData';

interface CaptureHomeViewProps {
  vents: Vent[];
  projects: Project[];
  onDump: (text: string, attachments: AttachmentMeta[]) => Promise<void>;
  onOpenDetail: (vent: Vent) => void;
  onToggleComplete: (vent: Vent) => void;
  onArchive: (vent: Vent) => void;
  onSoftDelete: (vent: Vent) => void;
  isProcessing: boolean;
  onNavigateToProjects: () => void;
  onNavigateToInbox: () => void;
  onLoadDemoData?: () => void;
  onOpenExport?: () => void;
}

export const CaptureHomeView: React.FC<CaptureHomeViewProps> = ({
  vents,
  projects,
  onDump,
  onOpenDetail,
  onToggleComplete,
  onArchive,
  onSoftDelete,
  isProcessing,
  onNavigateToProjects,
  onNavigateToInbox,
  onLoadDemoData,
  onOpenExport,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [homeDisplayMode, setHomeDisplayMode] = useState<'feed' | 'visuals'>('feed');
  const [cardDensity, setCardDensity] = useState<'compact' | 'detailed'>('detailed');
  const [showStats, setShowStats] = useState<boolean>(true);
  const [showResurfaced, setShowResurfaced] = useState<boolean>(true);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // Multi-select for batch actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);

  const activeVents = vents.filter((v) => !v.archived && !v.deleted);

  // Contextual metrics
  const waitingInboxCount = activeVents.filter((v) => v.status === 'inbox' || v.status === 'raw').length;
  const needAttentionCount = activeVents.filter(
    (v) => (v.priority === 'critical' || v.priority === 'high') && v.status !== 'completed'
  ).length;
  const resurfacedCount = activeVents.filter((v) => v.resurfaceReason).length;
  const linkedToProjectsCount = activeVents.filter((v) => v.projectId).length;

  const resurfacedVents = activeVents.filter((v) => v.resurfaceReason).slice(0, 3);

  const filteredVents = activeVents.filter((v) => {
    if (filterType === 'all') return true;
    if (filterType === 'tasks') return v.type === 'Task' || (v.actionItems && v.actionItems.length > 0);
    if (filterType === 'ideas') return v.type === 'Future idea' || v.type === 'Project idea';
    if (filterType === 'references') return v.type === 'Reference' || v.type === 'Bookmark';
    if (filterType === 'notes') return v.type === 'Note' || v.type === 'Thought' || v.type === 'Meeting note';
    return true;
  });

  const toggleSelectVent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredVents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredVents.map((v) => v.id));
    }
  };

  const handleBatchExport = () => {
    const selectedVents = activeVents.filter((v) => selectedIds.includes(v.id));
    if (selectedVents.length === 0) return;

    let md = `# Smart Vent Batch Export (${selectedVents.length} items)\n\n`;
    selectedVents.forEach((v) => {
      md += `## ${v.title}\n`;
      md += `- **Type**: ${v.type} | **Priority**: ${v.priority}\n`;
      if (v.projectName) md += `- **Project**: ${v.projectName}\n`;
      md += `\n> ${v.originalContent.replace(/\n/g, '\n> ')}\n\n`;
      if (v.actionItems && v.actionItems.length > 0) {
        md += `**Action Items:**\n`;
        v.actionItems.forEach((i) => (md += `- [ ] ${i}\n`));
        md += `\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-vent-batch-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBatchArchive = () => {
    selectedIds.forEach((id) => {
      const v = activeVents.find((item) => item.id === id);
      if (v && onArchive) onArchive(v);
    });
    setSelectedIds([]);
    setIsSelectMode(false);
  };

  const handleBatchDelete = () => {
    selectedIds.forEach((id) => {
      const v = activeVents.find((item) => item.id === id);
      if (v && onSoftDelete) onSoftDelete(v);
    });
    setSelectedIds([]);
    setIsSelectMode(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Smart Declutter Bar */}
      <div className="flex items-center justify-between gap-2 text-xs app-text-muted pb-1">
        <div className="flex items-center gap-2">
          {/* Focus Mode Toggle (Smart Clutter Reducer) */}
          <button
            type="button"
            onClick={() => {
              const next = !isFocusMode;
              setIsFocusMode(next);
              if (next) {
                setShowStats(false);
                setShowResurfaced(false);
              } else {
                setShowStats(true);
                setShowResurfaced(true);
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg app-border transition cursor-pointer ${
              isFocusMode
                ? 'bg-indigo-600 text-white font-medium shadow-xs'
                : 'app-subtle app-text-main hover:opacity-100'
            }`}
            title="Focus Mode: Hides peripheral panels for zero distraction"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isFocusMode ? 'Focus Active' : 'Focus Mode'}</span>
          </button>

          {/* Quick Stats Pill (when stats are hidden or minimized) */}
          {!showStats && (
            <button
              type="button"
              onClick={() => setShowStats(true)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg app-subtle app-border text-xs app-text-main hover:opacity-90 transition cursor-pointer"
            >
              <span>{waitingInboxCount} inbox · {needAttentionCount} urgent · {linkedToProjectsCount} projects</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>
          )}
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2">
          {onOpenExport && (
            <button
              type="button"
              onClick={onOpenExport}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg app-subtle app-border text-xs app-text-main hover:opacity-90 transition cursor-pointer"
              title="Export notes, JSON backups, CSV, or PDF"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          {showStats && (
            <button
              type="button"
              onClick={() => setShowStats(false)}
              className="flex items-center gap-1 text-[11px] app-text-muted hover:opacity-100 transition cursor-pointer"
              title="Hide top metric cards"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hide Stats</span>
            </button>
          )}
        </div>
      </div>

      {/* Contextual Status Bar (Collapsible to keep clean) */}
      {showStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 animate-fadeIn">
          <button
            onClick={onNavigateToInbox}
            className="p-3 sm:p-4 rounded-xl app-card app-card-hover app-border text-left transition-colors cursor-pointer"
          >
            <div className="text-xl sm:text-2xl font-mono font-semibold app-text-main tabular-nums">
              {waitingInboxCount}
            </div>
            <div className="text-xs app-text-muted mt-1">waiting in inbox</div>
          </button>

          <div className="p-3 sm:p-4 rounded-xl app-card app-border text-left">
            <div className="text-xl sm:text-2xl font-mono font-semibold text-amber-500 tabular-nums">
              {needAttentionCount}
            </div>
            <div className="text-xs app-text-muted mt-1">need attention</div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl app-card app-border text-left">
            <div className="text-xl sm:text-2xl font-mono font-semibold text-indigo-500 tabular-nums">
              {resurfacedCount}
            </div>
            <div className="text-xs app-text-muted mt-1">ideas resurfaced</div>
          </div>

          <button
            onClick={onNavigateToProjects}
            className="p-3 sm:p-4 rounded-xl app-card app-card-hover app-border text-left transition-colors cursor-pointer"
          >
            <div className="text-xl sm:text-2xl font-mono font-semibold text-sky-500 tabular-nums">
              {linkedToProjectsCount}
            </div>
            <div className="text-xs app-text-muted mt-1">linked to projects</div>
          </button>
        </div>
      )}

      {/* Primary Capture Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold app-text-main tracking-tight">
            What's on your mind?
          </h2>
          <span className="text-[11px] sm:text-xs app-text-muted font-mono">
            Dump first · Organize later
          </span>
        </div>

        <VentInput onDump={onDump} isProcessing={isProcessing} />
      </div>

      {/* Smart Resurfacing Section (Collapsible drawer to reduce clutter) */}
      {resurfacedVents.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs sm:text-sm font-semibold app-text-main">
                Resurfaced For You ({resurfacedVents.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowResurfaced(!showResurfaced)}
              className="text-[11px] app-text-muted hover:opacity-100 flex items-center gap-1 cursor-pointer"
            >
              <span>{showResurfaced ? 'Hide' : 'Show'}</span>
              {showResurfaced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {showResurfaced && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {resurfacedVents.map((vent) => (
                <div
                  key={vent.id}
                  onClick={() => onOpenDetail(vent)}
                  className="p-3.5 rounded-xl app-card app-card-hover app-border transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="text-[11px] font-mono text-indigo-500 flex items-center gap-1 mb-1 font-semibold">
                      <Clock className="w-3 h-3" />
                      <span>{vent.resurfaceReason || 'Revisit candidate'}</span>
                    </div>
                    <h4 className="text-xs font-semibold app-text-main line-clamp-1">
                      {vent.title}
                    </h4>
                    <p className="mt-1 text-[11px] app-text-muted line-clamp-2">
                      {vent.originalContent}
                    </p>
                  </div>
                  <div className="mt-2.5 text-[10px] app-text-muted flex items-center gap-1">
                    <span>Open dump</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Captured Knowledge Section */}
      <div className="space-y-4 pt-4 border-t app-border">
        {/* Controls Toolbar: View mode, Card density, Filters, Multi-select */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h3 className="text-base font-semibold app-text-main">
              Knowledge Feed
            </h3>

            {/* View Mode Toggle: Cards vs Visuals */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg app-subtle app-border text-xs">
              <button
                type="button"
                onClick={() => setHomeDisplayMode('feed')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                  homeDisplayMode === 'feed'
                    ? 'app-card app-text-main font-semibold shadow-xs'
                    : 'app-text-muted hover:opacity-100'
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setHomeDisplayMode('visuals')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                  homeDisplayMode === 'visuals'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'app-text-muted hover:opacity-100'
                }`}
              >
                <Network className="w-3 h-3" />
                <span>Visuals & Graphs</span>
              </button>
            </div>

            {/* Density Toggle (Compact vs Detailed Cards) */}
            {homeDisplayMode === 'feed' && (
              <div className="flex items-center gap-0.5 p-0.5 rounded-lg app-subtle app-border text-xs">
                <button
                  type="button"
                  onClick={() => setCardDensity('detailed')}
                  title="Detailed Cards view"
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    cardDensity === 'detailed'
                      ? 'app-card app-text-main shadow-xs'
                      : 'app-text-muted hover:opacity-100'
                  }`}
                >
                  <LayoutGrid className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setCardDensity('compact')}
                  title="Compact List view (Hide clutter)"
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    cardDensity === 'compact'
                      ? 'app-card app-text-main shadow-xs'
                      : 'app-text-muted hover:opacity-100'
                  }`}
                >
                  <List className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Interactive filter controls & Select Mode */}
          {homeDisplayMode === 'feed' && activeVents.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-0.5 rounded-lg app-subtle app-border overflow-x-auto text-xs">
                {(['all', 'tasks', 'ideas', 'references', 'notes'] as const).map((ft) => (
                  <button
                    key={ft}
                    onClick={() => setFilterType(ft)}
                    className={`px-2.5 py-1 font-medium rounded-md transition capitalize whitespace-nowrap cursor-pointer ${
                      filterType === ft
                        ? 'app-card app-text-main font-semibold shadow-xs'
                        : 'app-text-muted hover:opacity-100'
                    }`}
                  >
                    {ft === 'all' ? `All (${activeVents.length})` : ft}
                  </button>
                ))}
              </div>

              {/* Multi-select toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsSelectMode(!isSelectMode);
                  if (isSelectMode) setSelectedIds([]);
                }}
                className={`p-1.5 text-xs rounded-lg app-subtle app-border transition cursor-pointer ${
                  isSelectMode ? 'bg-indigo-600 text-white' : 'app-text-muted hover:opacity-100'
                }`}
                title="Select multiple dumps for batch actions"
              >
                <CheckSquare className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Floating Batch Actions Bar (when items are selected) */}
        {isSelectMode && (
          <div className="p-2.5 rounded-xl app-card app-border flex items-center justify-between gap-3 text-xs shadow-md animate-fadeIn">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="font-medium app-text-main hover:underline cursor-pointer"
              >
                {selectedIds.length === filteredVents.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="app-text-muted">·</span>
              <span className="font-semibold text-indigo-500">
                {selectedIds.length} selected
              </span>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBatchExport}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Export ({selectedIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleBatchArchive}
                  className="flex items-center gap-1 px-2.5 py-1 rounded app-subtle app-border app-text-main hover:opacity-90 transition cursor-pointer"
                >
                  <Archive className="w-3 h-3" />
                  <span>Archive</span>
                </button>
                <button
                  type="button"
                  onClick={handleBatchDelete}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 text-white hover:bg-rose-500 transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Visual Formats Container */}
        {homeDisplayMode === 'visuals' ? (
          <div className="space-y-6 pt-2">
            <KnowledgeGraphVisualizer
              vents={vents}
              projects={projects}
              onSelectVent={onOpenDetail}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CategoryDistributionChart vents={vents} />
              <PriorityMatrixDiagram vents={vents} onSelectVent={onOpenDetail} />
            </div>
          </div>
        ) : filteredVents.length === 0 ? (
          <div className="py-16 text-center rounded-2xl app-card app-border p-8 space-y-4">
            <Compass className="w-8 h-8 app-text-muted mx-auto" />
            <div>
              <h4 className="text-sm font-semibold app-text-main">Your canvas is clean & private.</h4>
              <p className="text-xs app-text-muted max-w-sm mx-auto mt-1">
                Dump any raw thought, todo, idea, or link above. Smart Vent will automatically understand and organize it.
              </p>
            </div>

            {onLoadDemoData && (
              <button
                type="button"
                onClick={onLoadDemoData}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium app-subtle app-border app-text-main hover:opacity-90 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Load 2 Example Dumps to Explore</span>
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              cardDensity === 'compact'
                ? 'space-y-2'
                : 'grid grid-cols-1 md:grid-cols-2 gap-4'
            }
          >
            {filteredVents.map((vent) => (
              <VentCard
                key={vent.id}
                vent={vent}
                onOpenDetail={onOpenDetail}
                onToggleComplete={onToggleComplete}
                onArchive={onArchive}
                onSoftDelete={onSoftDelete}
                compact={cardDensity === 'compact'}
                selected={selectedIds.includes(vent.id)}
                onToggleSelect={isSelectMode ? toggleSelectVent : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
