import React from 'react';
import { Network, Sparkles, Clock, Tag, Folder, ArrowRight, Link as LinkIcon } from 'lucide-react';
import { Vent, Project } from '../../types/vent';

interface InsightsViewProps {
  vents: Vent[];
  projects: Project[];
  onOpenVent: (vent: Vent) => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ vents, projects, onOpenVent }) => {
  const activeVents = vents.filter((v) => !v.archived && !v.deleted);

  // Group vents by tags to find topic clusters
  const tagCounts: Record<string, Vent[]> = {};
  activeVents.forEach((v) => {
    (v.tags || []).forEach((t) => {
      if (!tagCounts[t]) tagCounts[t] = [];
      tagCounts[t].push(v);
    });
  });

  const popularTopics = Object.entries(tagCounts)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8);

  // Resurfaced candidates
  const resurfaced = activeVents.filter((v) => v.resurfaceReason);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      <div className="pb-4 border-b border-neutral-800">
        <h2 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
          <Network className="w-5 h-5 text-indigo-400" />
          <span>Insights & Intelligent Connections</span>
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Elegantly surfaced patterns, topic affinities, and forgotten ideas across your digital dumping ground.
        </p>
      </div>

      {/* Resurfaced Memory Cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Smart Resurfacing</h3>
        </div>
        <p className="text-xs text-neutral-400">
          Smart Vent periodically surfaces items when they become contextually relevant or after low-pressure dormancy.
        </p>

        {resurfaced.length === 0 ? (
          <div className="p-6 rounded-xl bg-neutral-900/30 border border-neutral-800 text-xs text-neutral-400 text-center">
            No items resurfaced currently. As your dump archive grows, forgotten thoughts and ideas will quietly re-emerge here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resurfaced.map((vent) => (
              <div
                key={vent.id}
                onClick={() => onOpenVent(vent)}
                className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="text-[11px] font-mono text-indigo-400 flex items-center gap-1.5 mb-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{vent.resurfaceReason}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{vent.title}</h4>
                  <p className="mt-1 text-xs text-neutral-400 line-clamp-3">
                    {vent.originalContent}
                  </p>
                </div>
                <div className="mt-3 text-xs text-neutral-300 flex items-center gap-1">
                  <span>Revisit item</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Topic Affinity Clusters */}
      <div className="space-y-4 pt-4 border-t border-neutral-800">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Topic Affinity Clusters</h3>
        </div>
        <p className="text-xs text-neutral-400">
          Implicit connections forged by recurring themes in your notes and tasks.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {popularTopics.map(([topic, groupVents]) => (
            <div
              key={topic}
              className="p-3.5 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-medium text-emerald-400">#{topic}</span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {groupVents.length} vent{groupVents.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="mt-2.5 space-y-1.5">
                {groupVents.slice(0, 3).map((v) => (
                  <div
                    key={v.id}
                    onClick={() => onOpenVent(v)}
                    className="text-[11px] text-neutral-300 hover:text-white truncate cursor-pointer"
                  >
                    • {v.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project & Tag Web Matrix */}
      <div className="space-y-4 pt-4 border-t border-neutral-800">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-white">Project Connection Matrix</h3>
        </div>

        <div className="space-y-3">
          {projects.map((proj) => {
            const linked = activeVents.filter((v) => v.projectId === proj.id);
            return (
              <div
                key={proj.id}
                className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-sky-400" />
                    <span className="text-sm font-semibold text-white">{proj.name}</span>
                  </div>
                  <span className="text-xs font-mono text-neutral-400">
                    {linked.length} linked item{linked.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {linked.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => onOpenVent(v)}
                      className="text-xs px-2.5 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition"
                    >
                      {v.title}
                    </button>
                  ))}
                  {linked.length === 0 && (
                    <span className="text-xs text-neutral-400 italic">No linked vents yet</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
