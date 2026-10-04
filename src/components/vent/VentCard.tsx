import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  HelpCircle,
  Folder,
  CheckCircle2,
  Archive,
  Trash2,
  Paperclip,
  Share2,
  Copy,
  Check,
  Download,
  Sparkles,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { Vent, PriorityLevel } from '../../types/vent';

interface VentCardProps {
  vent: Vent;
  onOpenDetail: (vent: Vent) => void;
  onToggleComplete?: (vent: Vent) => void;
  onArchive?: (vent: Vent) => void;
  onSoftDelete?: (vent: Vent) => void;
  compact?: boolean;
  selected?: boolean;
  onToggleSelect?: (ventId: string) => void;
}

export const VentCard: React.FC<VentCardProps> = ({
  vent,
  onOpenDetail,
  onToggleComplete,
  onArchive,
  onSoftDelete,
  compact = false,
  selected = false,
  onToggleSelect,
}) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const [copied, setCopied] = useState(false);

  const getPriorityStyle = (priority: PriorityLevel) => {
    switch (priority) {
      case 'critical':
        return 'text-rose-500 font-semibold';
      case 'high':
        return 'text-amber-500 font-medium';
      case 'medium':
        return 'app-text-main';
      case 'low':
        return 'app-text-muted';
      case 'someday':
        return 'text-indigo-500 italic';
      default:
        return 'app-text-muted';
    }
  };

  const isCompleted = vent.status === 'completed';

  const handleCopyMarkdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    let md = `## ${vent.title}\n`;
    md += `*Type:* ${vent.type} | *Priority:* ${vent.priority}\n`;
    if (vent.projectName) md += `*Project:* ${vent.projectName}\n`;
    if (vent.dueDate) md += `*Due:* ${vent.dueDate}\n`;
    md += `\n> ${vent.originalContent}\n`;
    if (vent.actionItems && vent.actionItems.length > 0) {
      md += `\nAction Items:\n` + vent.actionItems.map((a) => `- [ ] ${a}`).join('\n');
    }

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const data = JSON.stringify(vent, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vent-${vent.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Compact Minimal Row View (Smart Declutter)
  if (compact) {
    return (
      <div
        onClick={() => onOpenDetail(vent)}
        className={`group flex items-center justify-between gap-3 p-3 rounded-xl app-card app-card-hover app-border transition cursor-pointer ${
          selected ? 'ring-2 ring-indigo-500 app-subtle' : ''
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect(vent.id);
              }}
              className="rounded app-border text-indigo-600 focus:ring-0 cursor-pointer"
            />
          )}

          {onToggleComplete && (vent.type === 'Task' || (vent.actionItems && vent.actionItems.length > 0)) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(vent);
              }}
              className={`shrink-0 cursor-pointer ${
                isCompleted ? 'text-emerald-500' : 'app-text-muted hover:text-emerald-500'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-medium app-text-main truncate">
              <span className={`line-clamp-1 ${isCompleted ? 'line-through opacity-60' : ''}`}>
                {vent.title || vent.originalContent.slice(0, 50)}
              </span>
              {vent.attachments && vent.attachments.length > 0 && (
                <Paperclip className="w-3 h-3 text-indigo-500 shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[10px] app-text-muted font-mono truncate mt-0.5">
              <span>{vent.type}</span>
              <span>·</span>
              <span className={getPriorityStyle(vent.priority)}>{vent.priority}</span>
              {vent.projectName && (
                <>
                  <span>·</span>
                  <span className="text-sky-500 truncate">{vent.projectName}</span>
                </>
              )}
              {vent.dueDate && (
                <>
                  <span>·</span>
                  <span className="text-amber-500">{new Date(vent.dueDate).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100"
        >
          <button
            type="button"
            onClick={handleCopyMarkdown}
            title="Copy Markdown"
            className="p-1 app-text-muted hover:opacity-100 rounded transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {onArchive && (
            <button
              type="button"
              onClick={() => onArchive(vent)}
              title={vent.archived ? 'Unarchive' : 'Archive'}
              className="p-1 app-text-muted hover:opacity-100 rounded transition cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          )}
          {onSoftDelete && (
            <button
              type="button"
              onClick={() => onSoftDelete(vent)}
              title="Delete"
              className="p-1 app-text-muted hover:text-rose-500 rounded transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Standard Rich Card View
  return (
    <div
      className={`group relative rounded-xl app-card app-card-hover app-border transition-all p-4 sm:p-5 flex flex-col justify-between shadow-xs ${
        selected ? 'ring-2 ring-indigo-500 app-subtle' : ''
      }`}
    >
      <div>
        {/* Top Unboxed Metadata Header (Zero-Pill Discipline) */}
        <div className="flex items-center justify-between gap-2 text-[11px] app-text-muted font-mono">
          <div className="flex items-center gap-1.5 flex-wrap">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelect(vent.id)}
                className="rounded app-border text-indigo-600 focus:ring-0 mr-1 cursor-pointer"
              />
            )}
            <span className="app-text-main font-sans font-medium">{vent.type}</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span className={getPriorityStyle(vent.priority)}>{vent.priority}</span>

            {vent.projectName && (
              <>
                <span aria-hidden="true" className="opacity-40">·</span>
                <span className="app-text-main flex items-center gap-1">
                  <Folder className="w-3 h-3 text-sky-500" />
                  <span>{vent.projectName}</span>
                </span>
              </>
            )}

            {vent.dueDate && (
              <>
                <span aria-hidden="true" className="opacity-40">·</span>
                <span className="text-amber-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(vent.dueDate).toLocaleDateString()}</span>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            {vent.source === 'audio' && (
              <span className="text-[10px] text-indigo-500 font-mono">audio</span>
            )}
            {vent.attachments && vent.attachments.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] app-text-muted font-mono">
                <Paperclip className="w-3 h-3" />
                <span>{vent.attachments.length}</span>
              </span>
            )}
          </div>
        </div>

        {/* Title & Click to Inspect */}
        <div
          onClick={() => onOpenDetail(vent)}
          className="mt-2.5 cursor-pointer space-y-1.5"
        >
          <h3
            className={`text-sm font-semibold tracking-tight app-text-main hover:text-indigo-500 transition-colors ${
              isCompleted ? 'line-through opacity-60' : ''
            }`}
          >
            {vent.title}
          </h3>

          {/* Raw Dump Excerpt */}
          <p className="text-xs app-text-muted leading-relaxed line-clamp-3 font-sans">
            {vent.originalContent}
          </p>
        </div>

        {/* Action Items Checklist Preview */}
        {vent.actionItems && vent.actionItems.length > 0 && (
          <div className="mt-3 space-y-1.5 pt-2.5 border-t app-border">
            {vent.actionItems.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs app-text-main"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span className="line-clamp-1">{item}</span>
              </div>
            ))}
            {vent.actionItems.length > 3 && (
              <div className="text-[10px] app-text-muted font-mono pl-3.5">
                +{vent.actionItems.length - 3} more items in detail view
              </div>
            )}
          </div>
        )}

        {/* Entities and Tags unboxed */}
        {vent.tags && vent.tags.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap text-[11px] font-mono app-text-muted">
            {vent.tags.slice(0, 4).map((tag, idx) => (
              <span key={idx} className="hover:opacity-100">
                #{tag}
              </span>
            ))}
            {vent.tags.length > 4 && (
              <span className="text-[10px] opacity-60">+{vent.tags.length - 4}</span>
            )}
          </div>
        )}

        {/* Reasoning Dropdown Toggle */}
        {showReasoning && vent.classificationReason && (
          <div className="mt-3 p-2.5 rounded-lg app-subtle app-border text-[11px] app-text-muted space-y-1 animate-fadeIn">
            <div className="font-semibold app-text-main flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Smart Vent Classification Rationale:</span>
            </div>
            <p className="leading-relaxed">{vent.classificationReason}</p>
            {vent.priorityReason && (
              <p className="text-amber-500/90 pt-0.5">
                Priority: {vent.priorityReason}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Reason Toggle + Action Icons */}
      <div className="mt-4 pt-3 border-t app-border flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setShowReasoning(!showReasoning)}
          className="text-[11px] app-text-muted hover:opacity-100 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3 h-3" />
          <span>Why {vent.type}?</span>
        </button>

        <div className="flex items-center gap-1">
          {/* 1-Click Export / Copy Markdown */}
          <button
            type="button"
            onClick={handleCopyMarkdown}
            title="Copy as Markdown"
            className="p-1.5 app-text-muted hover:opacity-100 app-card-hover rounded transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleDownloadSingle}
            title="Download JSON export"
            className="p-1.5 app-text-muted hover:opacity-100 app-card-hover rounded transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {onToggleComplete && (vent.type === 'Task' || vent.actionItems?.length > 0) && (
            <button
              onClick={() => onToggleComplete(vent)}
              title={isCompleted ? 'Mark as active' : 'Mark as done'}
              className={`p-1.5 rounded transition cursor-pointer ${
                isCompleted
                  ? 'text-emerald-500 bg-emerald-950/30'
                  : 'app-text-muted hover:text-emerald-500'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onArchive && (
            <button
              onClick={() => onArchive(vent)}
              title={vent.archived ? 'Unarchive' : 'Archive'}
              className="p-1.5 app-text-muted hover:opacity-100 app-card-hover rounded transition cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          )}

          {onSoftDelete && (
            <button
              onClick={() => onSoftDelete(vent)}
              title="Move to Trash"
              className="p-1.5 app-text-muted hover:text-rose-500 app-card-hover rounded transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
