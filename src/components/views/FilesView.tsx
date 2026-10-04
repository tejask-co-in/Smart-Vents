import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Archive,
  Code,
  Download,
  ExternalLink,
  Search,
} from 'lucide-react';
import { Vent, AttachmentMeta } from '../../types/vent';
import { formatFileSize } from '../../services/storage/fileManager';

interface FilesViewProps {
  vents: Vent[];
  onOpenParentVent: (vent: Vent) => void;
}

export const FilesView: React.FC<FilesViewProps> = ({ vents, onOpenParentVent }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all attachments with their parent vent
  const allFiles: { attachment: AttachmentMeta; parentVent: Vent }[] = [];
  vents.forEach((v) => {
    if (!v.deleted && v.attachments) {
      v.attachments.forEach((att) => {
        allFiles.push({ attachment: att, parentVent: v });
      } );
    }
  });

  const filtered = allFiles.filter(({ attachment }) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!attachment.name.toLowerCase().includes(q) && !(attachment.summary || '').toLowerCase().includes(q)) {
        return false;
      }
    }

    if (filterType === 'all') return true;
    if (filterType === 'images') return attachment.mimeType.startsWith('image/');
    if (filterType === 'docs')
      return (
        attachment.mimeType === 'application/pdf' ||
        /\.(docx?|pdf|txt|md|rtf)$/i.test(attachment.name)
      );
    if (filterType === 'audio') return attachment.mimeType.startsWith('audio/');
    if (filterType === 'code')
      return /\.(js|ts|tsx|jsx|json|py|html|css|cpp|java|sql)$/i.test(attachment.name);
    return true;
  });

  const getFileIcon = (mimeType: string, name: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-sky-400" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5 text-rose-400" />;
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5 text-amber-400" />;
    if (/\.(js|ts|tsx|jsx|json|py|html|css)$/i.test(name)) return <Code className="w-5 h-5 text-emerald-400" />;
    if (/\.(zip|tar|gz|7z)$/i.test(name)) return <Archive className="w-5 h-5 text-purple-400" />;
    return <FileText className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Files & Attached Assets</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Universal archive of all documents, images, audio clips, and code dumps attached to your vents.
          </p>
        </div>
        <span className="text-xs font-mono text-neutral-400">
          {allFiles.length} file{allFiles.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-neutral-900/80 rounded-lg border border-neutral-800/80 overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              filterType === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('docs')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              filterType === 'docs' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Documents & PDFs
          </button>
          <button
            onClick={() => setFilterType('images')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              filterType === 'images' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Images
          </button>
          <button
            onClick={() => setFilterType('audio')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              filterType === 'audio' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Audio / Voice
          </button>
          <button
            onClick={() => setFilterType('code')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              filterType === 'code' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Code & Data
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter files by name..."
            className="w-full sm:w-60 pl-8 pr-3 py-1.5 text-xs rounded-lg bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-neutral-700 font-sans"
          />
        </div>
      </div>

      {/* Files Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-neutral-900/30 border border-neutral-800/60 p-8 text-xs text-neutral-400">
          No files matching this filter. You can attach PDFs, code, screenshots, and audio directly to any vent.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ attachment, parentVent }) => (
            <div
              key={attachment.id}
              className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                    {getFileIcon(attachment.mimeType, attachment.name)}
                  </div>
                  {attachment.dataUrl && (
                    <a
                      href={attachment.dataUrl}
                      download={attachment.name}
                      className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <h4 className="mt-3 text-xs font-semibold text-white truncate" title={attachment.name}>
                  {attachment.name}
                </h4>

                <div className="mt-1 flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                  <span>{formatFileSize(attachment.size)}</span>
                  <span>·</span>
                  <span className="truncate">{attachment.mimeType}</span>
                </div>

                <p className="mt-2 text-[11px] text-neutral-400 line-clamp-2">
                  {attachment.summary || 'Stored locally in Smart Vent.'}
                </p>

                {/* Inline image thumbnail if available */}
                {attachment.mimeType.startsWith('image/') && attachment.dataUrl && (
                  <div className="mt-3 h-28 w-full rounded overflow-hidden border border-neutral-800 bg-neutral-950">
                    <img
                      src={attachment.dataUrl}
                      alt={attachment.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Link to parent vent */}
              <div className="mt-3 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-[11px]">
                <span className="text-neutral-400 truncate max-w-[150px]">
                  Vent: {parentVent.title}
                </span>
                <button
                  onClick={() => onOpenParentVent(parentVent)}
                  className="text-neutral-300 hover:text-white flex items-center gap-1 font-medium transition cursor-pointer"
                >
                  <span>View Vent</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
