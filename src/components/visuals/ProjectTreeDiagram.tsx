import React, { useState } from 'react';
import { Project, Vent } from '../../types/vent';
import { GitBranch, Folder, ChevronRight, ChevronDown, CheckCircle2, FileText, Lightbulb, BookOpen } from 'lucide-react';

interface ProjectTreeDiagramProps {
  projects: Project[];
  vents: Vent[];
  onSelectVent: (vent: Vent) => void;
}

export const ProjectTreeDiagram: React.FC<ProjectTreeDiagramProps> = ({
  projects,
  vents,
  onSelectVent,
}) => {
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    projects.forEach((p) => (initial[p.id] = true));
    return initial;
  });

  const toggleExpand = (id: string) => {
    setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getVentIcon = (type: string) => {
    if (type === 'Task') return <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />;
    if (type === 'Future idea' || type === 'Project idea')
      return <Lightbulb className="w-3.5 h-3.5 text-amber-500" />;
    if (type === 'Reference' || type === 'Bookmark')
      return <BookOpen className="w-3.5 h-3.5 text-emerald-500" />;
    return <FileText className="w-3.5 h-3.5 text-sky-500" />;
  };

  return (
    <div className="rounded-2xl app-card app-border p-4 sm:p-5 flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold app-text-main flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-sky-500" />
            <span>Project Mindmap & Hierarchy Tree</span>
          </h3>
          <p className="text-xs app-text-muted mt-0.5">
            Hierarchical structure displaying how thoughts, tasks, and documents branch from active projects.
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        {projects.map((proj) => {
          const linkedVents = vents.filter((v) => !v.deleted && !v.archived && v.projectId === proj.id);
          const isExpanded = !!expandedProjects[proj.id];

          return (
            <div
              key={proj.id}
              className="p-3.5 rounded-xl app-subtle app-border"
            >
              {/* Project Node (Root) */}
              <div
                onClick={() => toggleExpand(proj.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <button className="app-text-muted hover:opacity-100">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <Folder className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-semibold app-text-main">{proj.name}</span>
                  {proj.isAutoDetected && (
                    <span className="text-[10px] font-mono text-sky-500 px-1.5 py-0.5 rounded app-card app-border">
                      Discovered
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-mono app-text-muted">
                  {linkedVents.length} branches
                </span>
              </div>

              {/* Branches / Children */}
              {isExpanded && (
                <div className="mt-3 pl-6 border-l app-border space-y-2">
                  {linkedVents.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => onSelectVent(v)}
                      className="group flex items-center justify-between p-2 rounded-lg app-card app-card-hover app-border transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {getVentIcon(v.type)}
                        <span className="text-xs app-text-main truncate">
                          {v.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono app-text-muted shrink-0 capitalize">
                        {v.priority}
                      </span>
                    </div>
                  ))}

                  {linkedVents.length === 0 && (
                    <div className="text-xs app-text-muted italic py-1">
                      No linked vents yet. Future dumps matching keywords will sprout here.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {projects.length === 0 && (
          <div className="py-8 text-center text-xs app-text-muted">
            No projects detected yet. Create a project or dump notes to form clusters.
          </div>
        )}
      </div>
    </div>
  );
};
