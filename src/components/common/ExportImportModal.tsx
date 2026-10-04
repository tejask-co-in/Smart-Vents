import React, { useState } from 'react';
import {
  Download,
  Upload,
  FileText,
  Check,
  AlertCircle,
  X,
  Printer,
  Copy,
  FileCode,
  Table,
  CheckSquare,
} from 'lucide-react';
import { getAllVents, getAllProjects, exportAllData, importAllData } from '../../db/indexedDB';
import { Vent } from '../../types/vent';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataImported: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  onDataImported,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = async () => {
    const data = await exportAllData();
    downloadFile(
      JSON.stringify(data, null, 2),
      `smart-vent-backup-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
    setStatusMessage('Exported complete JSON archive with metadata.');
  };

  const handleExportMarkdown = async () => {
    const vents = await getAllVents();
    let md = `# Smart Vent Notes & Task Archive\n*Exported on ${new Date().toLocaleString()}*\n\n`;
    
    // Group by type
    vents.forEach((v) => {
      md += `## ${v.title || 'Untitled Dump'}\n`;
      md += `- **Classification**: ${v.type} (${v.types?.join(', ') || ''})\n`;
      md += `- **Priority**: ${v.priority.toUpperCase()} | **Status**: ${v.status}\n`;
      if (v.projectName) md += `- **Project**: ${v.projectName}\n`;
      if (v.dueDate) md += `- **Due Date**: ${new Date(v.dueDate).toLocaleDateString()}\n`;
      if (v.tags?.length) md += `- **Tags**: ${v.tags.map((t) => `#${t}`).join(' ')}\n`;
      md += `\n### Raw Input Content\n> ${v.originalContent.replace(/\n/g, '\n> ')}\n\n`;
      if (v.actionItems && v.actionItems.length > 0) {
        md += `### Action Items\n`;
        v.actionItems.forEach((item) => (md += `- [ ] ${item}\n`));
        md += `\n`;
      }
      md += `---\n\n`;
    });

    downloadFile(
      md,
      `smart-vent-notes-${new Date().toISOString().slice(0, 10)}.md`,
      'text/markdown'
    );
    setStatusMessage('Exported human-readable Markdown notes archive.');
  };

  const handleExportCSV = async () => {
    const vents = await getAllVents();
    const headers = ['ID', 'Title', 'Type', 'Priority', 'Status', 'Project', 'Tags', 'Action Items', 'Original Dump', 'Created Date'];
    const rows = vents.map((v) => [
      `"${v.id}"`,
      `"${(v.title || '').replace(/"/g, '""')}"`,
      `"${v.type}"`,
      `"${v.priority}"`,
      `"${v.status}"`,
      `"${(v.projectName || '').replace(/"/g, '""')}"`,
      `"${(v.tags || []).join(', ')}"`,
      `"${(v.actionItems || []).join('; ').replace(/"/g, '""')}"`,
      `"${(v.originalContent || '').replace(/"/g, '""')}"`,
      `"${new Date(v.createdAt).toISOString()}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(
      csv,
      `smart-vent-spreadsheet-${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv'
    );
    setStatusMessage('Exported tabular CSV spreadsheet for Excel or Google Sheets.');
  };

  const handleExportPlainText = async () => {
    const vents = await getAllVents();
    let txt = `SMART VENT DUMP EXPORT - ${new Date().toLocaleDateString()}\n=======================================================\n\n`;
    vents.forEach((v, idx) => {
      txt += `[${idx + 1}] ${v.title} (${v.type.toUpperCase()})\n`;
      txt += `Priority: ${v.priority} | Project: ${v.projectName || 'None'}\n`;
      txt += `Content: ${v.originalContent}\n`;
      if (v.actionItems?.length) {
        txt += `Action Items:\n  * ${v.actionItems.join('\n  * ')}\n`;
      }
      txt += `\n-------------------------------------------------------\n\n`;
    });

    downloadFile(
      txt,
      `smart-vent-outline-${new Date().toISOString().slice(0, 10)}.txt`,
      'text/plain'
    );
    setStatusMessage('Exported Plain Text outline.');
  };

  const handleCopyClipboard = async () => {
    const vents = await getAllVents();
    let summary = `Smart Vent Overview (${vents.length} items):\n\n`;
    vents.slice(0, 50).forEach((v) => {
      summary += `• ${v.title} [${v.type}] - ${v.priority}\n  ${v.originalContent.slice(0, 120)}\n\n`;
    });

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setStatusMessage('Copied summary of all notes to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      setStatusMessage('Failed to copy to clipboard automatically.');
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setStatusMessage(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (!json.data && !Array.isArray(json.vents)) {
        throw new Error('Unrecognized Smart Vent backup structure.');
      }

      const payload = json.data ? json : { data: json };
      const { ventCount, projectCount } = await importAllData(payload);

      setStatusMessage(`Successfully restored ${ventCount} dumps and ${projectCount} projects.`);
      onDataImported();
    } catch (err: any) {
      console.error('Import error:', err);
      setStatusMessage(`Import failed: ${err.message || 'Invalid JSON format'}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded-2xl app-card app-border p-6 shadow-2xl flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b app-border">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-500" />
            <h3 className="font-semibold text-sm app-text-main">
              Data Portability, Export & Backup
            </h3>
          </div>
          <button
            onClick={onClose}
            className="app-text-muted hover:opacity-100 transition p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg app-subtle app-border p-1 text-xs">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-1.5 font-medium rounded-md transition cursor-pointer ${
              activeTab === 'export'
                ? 'app-card app-text-main shadow-xs font-semibold'
                : 'app-text-muted hover:opacity-100'
            }`}
          >
            Export All Data
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-1.5 font-medium rounded-md transition cursor-pointer ${
              activeTab === 'import'
                ? 'app-card app-text-main shadow-xs font-semibold'
                : 'app-text-muted hover:opacity-100'
            }`}
          >
            Import Backup
          </button>
        </div>

        {statusMessage && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {activeTab === 'export' ? (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <p className="text-xs app-text-muted">
              Choose your preferred format. Your thoughts and files belong to you without platform lock-in.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Markdown */}
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="flex items-start gap-3 p-3 rounded-xl app-subtle app-card-hover border app-border text-left transition cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold app-text-main flex items-center gap-1.5">
                    <span>Markdown (.md)</span>
                  </div>
                  <div className="text-[11px] app-text-muted mt-0.5">
                    Formatted text documents with headers and checklists.
                  </div>
                </div>
              </button>

              {/* JSON */}
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-start gap-3 p-3 rounded-xl app-subtle app-card-hover border app-border text-left transition cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500 shrink-0 mt-0.5">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold app-text-main">
                    Full JSON Backup (.json)
                  </div>
                  <div className="text-[11px] app-text-muted mt-0.5">
                    Complete state including tags, entities, and settings.
                  </div>
                </div>
              </button>

              {/* CSV Spreadsheet */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-start gap-3 p-3 rounded-xl app-subtle app-card-hover border app-border text-left transition cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                  <Table className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold app-text-main">
                    Spreadsheet CSV (.csv)
                  </div>
                  <div className="text-[11px] app-text-muted mt-0.5">
                    Rows and columns for Excel, Numbers, or Google Sheets.
                  </div>
                </div>
              </button>

              {/* Plain Text Outline */}
              <button
                type="button"
                onClick={handleExportPlainText}
                className="flex items-start gap-3 p-3 rounded-xl app-subtle app-card-hover border app-border text-left transition cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold app-text-main">
                    Plain Text (.txt)
                  </div>
                  <div className="text-[11px] app-text-muted mt-0.5">
                    Lightweight numbered outline for any text editor.
                  </div>
                </div>
              </button>

              {/* Copy to Clipboard */}
              <button
                type="button"
                onClick={handleCopyClipboard}
                className="flex items-start gap-3 p-3 rounded-xl app-subtle app-card-hover border app-border text-left transition cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 shrink-0 mt-0.5">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold app-text-main">
                    {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
                  </div>
                  <div className="text-[11px] app-text-muted mt-0.5">
                    Paste directly into Notion, Obsidian, Slack, or Docs.
                  </div>
                </div>
              </button>

              {/* Print / PDF */}
              <button
                type="button"
                onClick={handlePrintPDF}
                className="flex items-start gap-3 p-3 rounded-xl app-subtle app-card-hover border app-border text-left transition cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 shrink-0 mt-0.5">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold app-text-main">
                    Print / Save as PDF
                  </div>
                  <div className="text-[11px] app-text-muted mt-0.5">
                    Open print dialog to save clean formatted PDF pages.
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs app-text-muted">
              Restore a previous Smart Vent JSON backup into your local device database.
            </p>

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed app-border app-card-hover rounded-xl cursor-pointer app-subtle transition">
              <Upload className="w-6 h-6 app-text-muted mb-2" />
              <span className="text-xs font-medium app-text-main">
                {importing ? 'Restoring data...' : 'Select JSON backup file to import'}
              </span>
              <span className="text-[11px] app-text-muted mt-1">.json format only</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                disabled={importing}
                className="hidden"
              />
            </label>
          </div>
        )}

        <div className="pt-2 border-t app-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium app-text-main app-subtle app-border rounded-lg transition hover:opacity-90 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
