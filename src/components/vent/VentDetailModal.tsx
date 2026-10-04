import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Tag,
  Paperclip,
  CheckCircle2,
  Trash2,
  Archive,
  Save,
  FileText,
  Download,
  Copy,
  Check,
  Folder,
} from 'lucide-react';
import { Vent, VentClassification, PriorityLevel, Project } from '../../types/vent';
import { formatFileSize } from '../../services/storage/fileManager';

interface VentDetailModalProps {
  vent: Vent | null;
  projects: Project[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: Vent) => void;
  onArchive: (vent: Vent) => void;
  onSoftDelete: (vent: Vent) => void;
}

const ALL_CLASSIFICATIONS: VentClassification[] = [
  'Task',
  'Project',
  'Project idea',
  'Future idea',
  'Goal',
  'Reminder',
  'Event',
  'Note',
  'Thought',
  'Draft',
  'Prompt',
  'Template',
  'Reference',
  'Bookmark',
  'Research',
  'Learning material',
  'Decision',
  'Question',
  'Problem',
  'Solution',
  'Meeting note',
  'Personal',
  'Work',
  'Academic',
  'Technical',
  'Creative',
  'Financial',
  'Travel',
  'Shopping',
  'Communication',
  'Document',
  'Media',
];

export const VentDetailModal: React.FC<VentDetailModalProps> = ({
  vent,
  projects,
  isOpen,
  onClose,
  onUpdate,
  onArchive,
  onSoftDelete,
}) => {
  if (!isOpen || !vent) return null;

  const [activeTab, setActiveTab] = useState<'smart' | 'raw' | 'files'>('smart');
  const [editedTitle, setEditedTitle] = useState(vent.title);
  const [editedRaw, setEditedRaw] = useState(vent.originalContent);
  const [editedType, setEditedType] = useState<VentClassification>(vent.type);
  const [editedPriority, setEditedPriority] = useState<PriorityLevel>(vent.priority);
  const [editedProjectId, setEditedProjectId] = useState<string>(vent.projectId || '');
  const [editedTags, setEditedTags] = useState<string>((vent.tags || []).join(', '));
  const [newActionItem, setNewActionItem] = useState('');
  const [actionItems, setActionItems] = useState<string[]>(vent.actionItems || []);
  const [copiedMd, setCopiedMd] = useState(false);

  const handleSave = () => {
    const chosenProject = projects.find((p) => p.id === editedProjectId);
    const tagsArray = editedTags
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    const updatedVent: Vent = {
      ...vent,
      title: editedTitle.trim() || vent.title,
      originalContent: editedRaw,
      type: editedType,
      priority: editedPriority,
      projectId: editedProjectId || undefined,
      projectName: chosenProject ? chosenProject.name : undefined,
      tags: tagsArray,
      actionItems,
      userEdited: true,
      updatedAt: Date.now(),
      syncState: 'pending',
    };

    onUpdate(updatedVent);
    onClose();
  };

  const handleExportMarkdown = () => {
    let md = `# ${vent.title}\n`;
    md += `*Type:* ${vent.type} | *Priority:* ${vent.priority} | *Captured:* ${new Date(vent.createdAt).toLocaleString()}\n`;
    if (vent.projectName) md += `*Project:* ${vent.projectName}\n`;
    if (vent.tags && vent.tags.length > 0) md += `*Tags:* ${vent.tags.map((t) => `#${t}`).join(' ')}\n`;
    md += `\n## Original Raw Content\n> ${vent.originalContent.replace(/\n/g, '\n> ')}\n\n`;
    if (vent.actionItems && vent.actionItems.length > 0) {
      md += `## Action Items\n` + vent.actionItems.map((a) => `- [ ] ${a}`).join('\n') + `\n\n`;
    }
    if (vent.classificationReason) {
      md += `## Smart Vent Analysis\n${vent.classificationReason}\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vent-${vent.id.slice(-6)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    let md = `# ${vent.title}\n> ${vent.originalContent}\n`;
    if (vent.actionItems && vent.actionItems.length > 0) {
      md += `\nAction Items:\n` + vent.actionItems.map((a) => `- [ ] ${a}`).join('\n');
    }
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const addActionItem = () => {
    if (!newActionItem.trim()) return;
    setActionItems((prev) => [...prev, newActionItem.trim()]);
    setNewActionItem('');
  };

  const removeActionItem = (idx: number) => {
    setActionItems((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl app-card app-border p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b app-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono app-text-muted">
              Vent #{vent.id.slice(-6)}
            </span>
            <span className="opacity-40">·</span>
            <span className="text-xs app-text-muted">
              Captured {new Date(vent.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Export Tools */}
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1 px-2.5 py-1 text-xs app-subtle app-border rounded transition cursor-pointer"
              title="Copy formatted Markdown"
            >
              {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Copy</span>
            </button>

            <button
              type="button"
              onClick={handleExportMarkdown}
              className="flex items-center gap-1 px-2.5 py-1 text-xs app-subtle app-border rounded transition cursor-pointer"
              title="Download as Markdown file"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button onClick={onClose} className="p-1 app-text-muted hover:opacity-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View mode tabs */}
        <div className="mt-4 flex items-center gap-2 p-1 app-subtle rounded-lg app-border shrink-0">
          <button
            onClick={() => setActiveTab('smart')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
              activeTab === 'smart' ? 'app-card shadow-sm font-semibold' : 'app-text-muted hover:opacity-100'
            }`}
          >
            Smart Interpretation
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
              activeTab === 'raw' ? 'app-card shadow-sm font-semibold' : 'app-text-muted hover:opacity-100'
            }`}
          >
            Original Raw Dump
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
              activeTab === 'files' ? 'app-card shadow-sm font-semibold' : 'app-text-muted hover:opacity-100'
            }`}
          >
            Attachments ({vent.attachments?.length || 0})
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="mt-4 overflow-y-auto pr-1 flex-1 space-y-4">
          {activeTab === 'smart' && (
            <>
              {/* Title editor */}
              <div>
                <label className="text-[11px] app-text-muted font-mono uppercase tracking-wider block">
                  Title
                </label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="mt-1 w-full p-2 text-sm rounded app-subtle app-border app-text-main focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>

              {/* Grid: Type, Priority, Project */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] app-text-muted font-mono uppercase tracking-wider block">
                    Classification
                  </label>
                  <select
                    value={editedType}
                    onChange={(e) => setEditedType(e.target.value as VentClassification)}
                    className="mt-1 w-full p-2 text-xs rounded app-subtle app-border app-text-main focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {ALL_CLASSIFICATIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] app-text-muted font-mono uppercase tracking-wider block">
                    Priority
                  </label>
                  <select
                    value={editedPriority}
                    onChange={(e) => setEditedPriority(e.target.value as PriorityLevel)}
                    className="mt-1 w-full p-2 text-xs rounded app-subtle app-border app-text-main focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="someday">Someday</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] app-text-muted font-mono uppercase tracking-wider block">
                    Project
                  </label>
                  <select
                    value={editedProjectId}
                    onChange={(e) => setEditedProjectId(e.target.value)}
                    className="mt-1 w-full p-2 text-xs rounded app-subtle app-border app-text-main focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">No Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags editor */}
              <div>
                <label className="text-[11px] app-text-muted font-mono uppercase tracking-wider block">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={editedTags}
                  onChange={(e) => setEditedTags(e.target.value)}
                  placeholder="e.g. portfolio, react, urgent"
                  className="mt-1 w-full p-2 text-xs rounded app-subtle app-border app-text-main focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* Why Classified Explanation */}
              <div className="p-3 rounded-lg app-subtle app-border">
                <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-mono mb-1 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Why Smart Vent classified this:</span>
                </div>
                <p className="text-xs app-text-muted leading-relaxed">
                  {vent.classificationReason}
                </p>
                {vent.priorityReason && (
                  <p className="mt-1.5 text-[11px] app-text-muted italic">
                    Priority rationale: {vent.priorityReason}
                  </p>
                )}
              </div>

              {/* Action items checklist */}
              <div>
                <label className="text-[11px] app-text-muted font-mono uppercase tracking-wider block mb-1">
                  Actionable Items ({actionItems.length})
                </label>
                <div className="space-y-1.5">
                  {actionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded app-subtle app-border text-xs app-text-main"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => removeActionItem(idx)}
                        className="app-text-muted hover:text-rose-500 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={newActionItem}
                      onChange={(e) => setNewActionItem(e.target.value)}
                      placeholder="Add an actionable item..."
                      className="flex-1 p-2 text-xs rounded app-subtle app-border app-text-main focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addActionItem();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addActionItem}
                      className="px-3 py-2 text-xs app-card app-card-hover app-border rounded"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'raw' && (
            <div>
              <p className="text-xs app-text-muted mb-2">
                The exact dump you originally typed or pasted. Smart Vent never permanently mutates your words.
              </p>
              <textarea
                value={editedRaw}
                onChange={(e) => setEditedRaw(e.target.value)}
                rows={10}
                className="w-full p-3 text-xs sm:text-sm rounded-lg app-subtle app-border app-text-main leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans resize-none"
              />
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-3">
              {(!vent.attachments || vent.attachments.length === 0) && (
                <div className="text-xs app-text-muted p-4 text-center">
                  No attachments associated with this vent.
                </div>
              )}

              {vent.attachments?.map((file) => (
                <div
                  key={file.id}
                  className="p-3 rounded-lg app-subtle app-border space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span className="font-medium app-text-main">{file.name}</span>
                      <span className="app-text-muted font-mono text-[10px]">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>

                    {file.dataUrl && (
                      <a
                        href={file.dataUrl}
                        download={file.name}
                        className="text-xs text-indigo-500 hover:opacity-80 flex items-center gap-1 font-medium"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    )}
                  </div>

                  <p className="text-[11px] app-text-muted">{file.summary}</p>

                  {/* Image preview */}
                  {file.mimeType.startsWith('image/') && file.dataUrl && (
                    <div className="mt-2 max-h-60 overflow-hidden rounded app-border">
                      <img
                        src={file.dataUrl}
                        alt={file.name}
                        className="object-contain max-h-60 w-full"
                      />
                    </div>
                  )}

                  {/* Audio preview */}
                  {file.mimeType.startsWith('audio/') && file.dataUrl && (
                    <audio controls src={file.dataUrl} className="w-full mt-2" />
                  )}

                  {/* Text snippet preview */}
                  {file.extractedText && (
                    <div className="mt-2 p-2 rounded app-card app-border text-[11px] font-mono app-text-muted max-h-36 overflow-y-auto whitespace-pre">
                      {file.extractedText}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-4 border-t app-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onSoftDelete(vent);
                onClose();
              }}
              className="p-2 app-text-muted hover:text-rose-500 rounded transition"
              title="Move to Trash"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                onArchive(vent);
                onClose();
              }}
              className="p-2 app-text-muted hover:opacity-100 rounded transition"
              title="Archive"
            >
              <Archive className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs app-text-muted hover:opacity-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition shadow-sm bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 hover:opacity-90"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
