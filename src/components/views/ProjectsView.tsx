import React, { useState } from 'react';
import {
  Folder,
  Plus,
  Sparkles,
  X,
  Trash2,
  Download,
  Check,
  FileText,
  Info,
  ChevronDown,
  ChevronUp,
  Table,
  FileCode,
} from 'lucide-react';
import { Project, Vent } from '../../types/vent';
import { VentCard } from '../vent/VentCard';

interface ProjectsViewProps {
  projects: Project[];
  vents: Vent[];
  onCreateProject: (name: string, description: string, triggers: string[]) => void;
  onDeleteProject: (id: string) => void;
  onOpenDetail: (vent: Vent) => void;
  onToggleComplete: (vent: Vent) => void;
  onArchive: (vent: Vent) => void;
  onSoftDelete: (vent: Vent) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  vents,
  onCreateProject,
  onDeleteProject,
  onOpenDetail,
  onToggleComplete,
  onArchive,
  onSoftDelete,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects.length > 0 ? projects[0].id : null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectTriggers, setNewProjectTriggers] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const activeProjects = projects;
  const currentProject = activeProjects.find((p) => p.id === selectedProjectId);
  const projectVents = vents.filter(
    (v) => !v.deleted && !v.archived && v.projectId === selectedProjectId
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const triggers = newProjectTriggers
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    onCreateProject(newProjectName.trim(), newProjectDesc.trim(), triggers);
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectTriggers('');
    setIsCreating(false);
  };

  const handleExportProjectMD = () => {
    if (!currentProject) return;

    let md = `# Project: ${currentProject.name}\n`;
    md += `*${currentProject.description}*\n\n`;
    md += `**Total Connected Items:** ${projectVents.length}\n\n---\n\n`;

    projectVents.forEach((v) => {
      md += `### ${v.title} (${v.type} - Priority: ${v.priority})\n`;
      md += `> ${v.originalContent.replace(/\n/g, '\n> ')}\n\n`;
      if (v.actionItems && v.actionItems.length > 0) {
        md += `**Action Items:**\n`;
        v.actionItems.forEach((item) => (md += `- [ ] ${item}\n`));
        md += `\n`;
      }
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.toLowerCase().replace(/\s+/g, '-')}-project.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportProjectCSV = () => {
    if (!currentProject) return;
    const headers = ['ID', 'Title', 'Type', 'Priority', 'Status', 'Tags', 'Content'];
    const rows = projectVents.map((v) => [
      `"${v.id}"`,
      `"${(v.title || '').replace(/"/g, '""')}"`,
      `"${v.type}"`,
      `"${v.priority}"`,
      `"${v.status}"`,
      `"${(v.tags || []).join(', ')}"`,
      `"${(v.originalContent || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.toLowerCase().replace(/\s+/g, '-')}-project.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    if (!currentProject) return;
    onDeleteProject(currentProject.id);
    setShowDeleteConfirm(false);
    setSelectedProjectId(activeProjects.length > 1 ? activeProjects[0].id : null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b app-border">
        <div>
          <h2 className="text-lg font-semibold app-text-main flex items-center gap-2">
            <Folder className="w-5 h-5 text-indigo-500" />
            <span>Projects & Emergent Clusters</span>
          </h2>
          <p className="text-xs app-text-muted mt-1">
            Projects can be created manually or emerge dynamically from your recurring notes and thoughts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowExplainer(!showExplainer)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs app-subtle app-border rounded-md app-text-muted hover:opacity-100 transition cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>Why projects show?</span>
            {showExplainer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 rounded-md transition shadow-xs cursor-pointer hover:opacity-90"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Explainer Callout */}
      {showExplainer && (
        <div className="p-4 rounded-xl app-subtle app-border text-xs space-y-2">
          <div className="font-semibold app-text-main flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>How Smart Vent Project Detection Works (Real deterministic grouping)</span>
          </div>
          <p className="app-text-muted leading-relaxed">
            Smart Vent was built so you never have to manually create folders before writing. When you dump notes containing keywords like "project: Marketing" or multiple related tasks, Smart Vent automatically clusters them together.
          </p>
          <p className="app-text-muted leading-relaxed">
            <strong>Is it fake?</strong> No! Every project here has real entries linked in your device database. If an unwanted project appeared or was pre-loaded, you can delete or unlink it with 1 click below.
          </p>
        </div>
      )}

      {/* Creation Drawer */}
      {isCreating && (
        <div className="p-4 rounded-xl app-card app-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold app-text-main">Create New Project</h4>
            <button
              onClick={() => setIsCreating(false)}
              className="app-text-muted hover:opacity-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleCreateSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-mono app-text-muted uppercase">Project Name</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Website Launch, College Thesis, Finance Tracking"
                className="mt-1 w-full p-2 text-xs rounded-lg app-input app-border focus:outline-none focus:border-indigo-500"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] font-mono app-text-muted uppercase">Description</label>
              <input
                type="text"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="Brief summary of what this project encompasses"
                className="mt-1 w-full p-2 text-xs rounded-lg app-input app-border focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono app-text-muted uppercase">
                Keyword Triggers for Auto-Discovery (comma separated)
              </label>
              <input
                type="text"
                value={newProjectTriggers}
                onChange={(e) => setNewProjectTriggers(e.target.value)}
                placeholder="e.g. website, deployment, design, launch"
                className="mt-1 w-full p-2 text-xs rounded-lg app-input app-border focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 text-xs app-text-muted hover:opacity-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 rounded-lg cursor-pointer hover:opacity-90"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Grid / Selector */}
      {activeProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {activeProjects.map((p) => {
            const count = vents.filter((v) => !v.deleted && !v.archived && v.projectId === p.id).length;
            const isSelected = p.id === selectedProjectId;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'app-card border-indigo-500 shadow-xs ring-1 ring-indigo-500/50'
                    : 'app-subtle app-border hover:border-neutral-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs app-text-main">{p.name}</span>
                  {p.isAutoDetected && (
                    <span
                      className="text-[10px] font-mono text-indigo-500 flex items-center gap-1"
                      title="Discovered automatically by Smart Vent"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      Auto
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] app-text-muted line-clamp-1">{p.description || 'No description'}</p>
                <div className="mt-2 text-[10px] font-mono app-text-muted flex items-center justify-between">
                  <span>{count} connected items</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Selected Project Content */}
      {currentProject ? (
        <div className="pt-4 border-t app-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold app-text-main">{currentProject.name}</h3>
                {currentProject.isAutoDetected && (
                  <span className="text-[10px] font-mono text-indigo-500 px-1.5 py-0.5 rounded app-subtle app-border">
                    Emergent Discovery
                  </span>
                )}
              </div>
              <p className="text-xs app-text-muted mt-0.5">{currentProject.description}</p>
            </div>

            {/* Project Actions: Export & Delete */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportProjectMD}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs app-subtle app-border rounded transition cursor-pointer hover:opacity-90 app-text-main"
                title="Export all project notes and tasks as Markdown"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>Export (.md)</span>
              </button>

              <button
                type="button"
                onClick={handleExportProjectCSV}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs app-subtle app-border rounded transition cursor-pointer hover:opacity-90 app-text-main"
                title="Export project items as CSV"
              >
                <Table className="w-3.5 h-3.5 text-emerald-500" />
                <span>Export (.csv)</span>
              </button>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-500 hover:text-rose-400 app-subtle app-border rounded transition cursor-pointer"
                  title="Delete or dismiss this project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Project</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 app-card p-1 rounded border border-rose-500/50 text-xs">
                  <span className="text-[11px] text-rose-500">Delete project?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-1.5 py-0.5 app-text-muted hover:opacity-100 text-[11px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {projectVents.length === 0 ? (
            <div className="py-12 text-center rounded-xl app-subtle app-border p-6 text-xs app-text-muted">
              No vents linked to this project yet. Mentioning "{currentProject.name}" in any dump will associate it automatically.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectVents.map((vent) => (
                <VentCard
                  key={vent.id}
                  vent={vent}
                  onOpenDetail={onOpenDetail}
                  onToggleComplete={onToggleComplete}
                  onArchive={onArchive}
                  onSoftDelete={onSoftDelete}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 text-center text-xs app-text-muted app-card app-border rounded-xl p-8">
          No projects created yet. Dump your thoughts freely, or click "New Project" above.
        </div>
      )}
    </div>
  );
};
