import React from 'react';
import { Vent } from '../../types/vent';
import { Grid, AlertTriangle, Lightbulb, BookmarkCheck, Calendar } from 'lucide-react';

interface PriorityMatrixDiagramProps {
  vents: Vent[];
  onSelectVent: (vent: Vent) => void;
}

export const PriorityMatrixDiagram: React.FC<PriorityMatrixDiagramProps> = ({
  vents,
  onSelectVent,
}) => {
  const activeVents = vents.filter((v) => !v.deleted && !v.archived);

  // Quadrants:
  const q1 = activeVents.filter(
    (v) => (v.priority === 'critical' || v.priority === 'high') && v.status !== 'completed'
  );

  const q2 = activeVents.filter(
    (v) => v.priority === 'medium' && (v.type === 'Task' || v.projectId) && v.status !== 'completed'
  );

  const q3 = activeVents.filter(
    (v) => v.priority === 'someday' || v.type === 'Future idea' || v.type === 'Project idea'
  );

  const q4 = activeVents.filter(
    (v) => v.type === 'Reference' || v.type === 'Bookmark' || v.type === 'Note' || v.type === 'Thought'
  );

  return (
    <div className="rounded-2xl app-card app-border p-4 sm:p-5 flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold app-text-main flex items-center gap-2">
            <Grid className="w-4 h-4 text-amber-500" />
            <span>Priority & Urgency Matrix</span>
          </h3>
          <p className="text-xs app-text-muted mt-0.5">
            4-quadrant visual sorting urgency and strategic significance without rigid task bureaucracy.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
        {/* Q1: Urgent & Critical */}
        <div className="p-3.5 rounded-xl app-subtle app-border space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-500 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Urgent / Action Now</span>
              </span>
              <span className="text-[10px] font-mono text-rose-500">{q1.length} items</span>
            </div>
            <p className="text-[11px] app-text-muted mt-0.5">
              Explicit deadlines, critical blockers, or immediate tasks.
            </p>

            <div className="mt-2.5 space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {q1.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  onClick={() => onSelectVent(v)}
                  className="p-2 rounded app-card app-border app-card-hover transition cursor-pointer text-xs app-text-main truncate"
                >
                  <span className="text-rose-500 font-mono text-[10px] mr-1.5 font-bold">!</span>
                  {v.title}
                </div>
              ))}
              {q1.length === 0 && (
                <div className="text-[11px] app-text-muted italic py-2">No urgent blockers.</div>
              )}
            </div>
          </div>
        </div>

        {/* Q2: Strategic / Active Work */}
        <div className="p-3.5 rounded-xl app-subtle app-border space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Active Work & Projects</span>
              </span>
              <span className="text-[10px] font-mono text-indigo-500">{q2.length} items</span>
            </div>
            <p className="text-[11px] app-text-muted mt-0.5">
              Connected tasks and deliverables advancing active initiatives.
            </p>

            <div className="mt-2.5 space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {q2.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  onClick={() => onSelectVent(v)}
                  className="p-2 rounded app-card app-border app-card-hover transition cursor-pointer text-xs app-text-main truncate"
                >
                  <span className="text-indigo-500 font-mono text-[10px] mr-1.5 font-bold">◆</span>
                  {v.title}
                </div>
              ))}
              {q2.length === 0 && (
                <div className="text-[11px] app-text-muted italic py-2">No active tasks.</div>
              )}
            </div>
          </div>
        </div>

        {/* Q3: Someday / Future Ideas */}
        <div className="p-3.5 rounded-xl app-subtle app-border space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Someday & Future Ideas</span>
              </span>
              <span className="text-[10px] font-mono text-amber-500">{q3.length} items</span>
            </div>
            <p className="text-[11px] app-text-muted mt-0.5">
              Hypothetical concepts and creative sparks to revisit at leisure.
            </p>

            <div className="mt-2.5 space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {q3.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  onClick={() => onSelectVent(v)}
                  className="p-2 rounded app-card app-border app-card-hover transition cursor-pointer text-xs app-text-main truncate"
                >
                  <span className="text-amber-500 font-mono text-[10px] mr-1.5 font-bold">✦</span>
                  {v.title}
                </div>
              ))}
              {q3.length === 0 && (
                <div className="text-[11px] app-text-muted italic py-2">No someday ideas yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Q4: References & Notes */}
        <div className="p-3.5 rounded-xl app-subtle app-border space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>References & Knowledge</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-500">{q4.length} items</span>
            </div>
            <p className="text-[11px] app-text-muted mt-0.5">
              Articles, documentation links, snippets, and research notes.
            </p>

            <div className="mt-2.5 space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {q4.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  onClick={() => onSelectVent(v)}
                  className="p-2 rounded app-card app-border app-card-hover transition cursor-pointer text-xs app-text-main truncate"
                >
                  <span className="text-emerald-500 font-mono text-[10px] mr-1.5 font-bold">§</span>
                  {v.title}
                </div>
              ))}
              {q4.length === 0 && (
                <div className="text-[11px] app-text-muted italic py-2">No references yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
