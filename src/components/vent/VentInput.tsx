import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Mic, ArrowUp, X, Sparkles, FileText, Image as ImageIcon } from 'lucide-react';
import { AttachmentMeta } from '../../types/vent';
import { processUploadedFile, formatFileSize } from '../../services/storage/fileManager';
import { VoiceRecorderModal } from '../common/VoiceRecorderModal';

interface VentInputProps {
  onDump: (text: string, attachments: AttachmentMeta[]) => Promise<void>;
  isProcessing?: boolean;
}

export const VentInput: React.FC<VentInputProps> = ({ onDump, isProcessing = false }) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 260)}px`;
    }
  }, [content]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed && attachments.length === 0) return;
    if (isProcessing) return;

    await onDump(trimmed, attachments);
    setContent('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: AttachmentMeta[] = [];
    for (let i = 0; i < files.length; i++) {
      const meta = await processUploadedFile(files[i]);
      newAttachments.push(meta);
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const newAttachments: AttachmentMeta[] = [];
    for (let i = 0; i < files.length; i++) {
      const meta = await processUploadedFile(files[i]);
      newAttachments.push(meta);
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleVoiceDump = async (transcript: string, voiceAttachment: AttachmentMeta) => {
    setContent((prev) => (prev ? `${prev}\n${transcript}` : transcript));
    setAttachments((prev) => [...prev, voiceAttachment]);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full rounded-2xl app-card app-border transition-all duration-200 shadow-md ${
        isDragging
          ? 'ring-2 ring-indigo-500 border-indigo-500'
          : 'hover:border-indigo-500/50'
      }`}
    >
      <form onSubmit={handleSubmit} className="p-4 sm:p-5">
        {/* Large Primary Input Area */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Just dump it here. Random thoughts, urgent things, links, code, ideas, multiple tasks at once..."
          rows={3}
          disabled={isProcessing}
          className="w-full bg-transparent app-text-main placeholder:opacity-50 text-sm sm:text-base leading-relaxed focus:outline-none resize-none font-sans"
        />

        {/* Attached files preview chips */}
        {attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t app-border">
            {attachments.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md app-subtle app-border text-xs app-text-main"
              >
                {file.mimeType.startsWith('image/') ? (
                  <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                )}
                <span className="max-w-[140px] truncate" title={file.name}>
                  {file.name}
                </span>
                <span className="text-[10px] app-text-muted font-mono">
                  ({formatFileSize(file.size)})
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(file.id)}
                  className="app-text-muted hover:opacity-100 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action Tray */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t app-border">
          <div className="flex items-center gap-1.5">
            {/* File attachment */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach any document, image, audio, archive or code file"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs app-text-muted hover:opacity-100 app-card-hover rounded-md transition-colors cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Attach</span>
            </button>

            {/* Voice Vent */}
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              title="Voice Vent: capture speech and audio"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs app-text-muted hover:opacity-100 app-card-hover rounded-md transition-colors cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voice</span>
            </button>

            <span className="hidden md:inline-block text-[11px] app-text-muted font-mono ml-2">
              Dump first. Organize later.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[11px] font-mono app-text-muted">
              ⌘ + Enter
            </span>
            <button
              type="submit"
              disabled={(!content.trim() && attachments.length === 0) || isProcessing}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30 transition-all cursor-pointer shadow-sm bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 hover:opacity-90"
            >
              {isProcessing ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Understanding...</span>
                </>
              ) : (
                <>
                  <span>Dump</span>
                  <ArrowUp className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Voice Recorder Modal */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSaveVoiceDump={handleVoiceDump}
      />
    </div>
  );
};
