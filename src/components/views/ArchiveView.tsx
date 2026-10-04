import React, { useState } from 'react';
import { Archive, Trash2, RotateCcw, AlertTriangle, Check } from 'lucide-react';
import { Vent } from '../../types/vent';

interface ArchiveViewProps {
  vents: Vent[];
  onRestore: (ventId: string) => void;
  onUnarchive: (vent: Vent) => void;
  onPermanentDelete: (ventId: string) => void;
  onEmptyTrash: () => void;
  onOpenDetail: (vent: Vent) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  vents,
  onRestore,
  onUnarchive,
  onPermanentDelete,
  onEmptyTrash,
  onOpenDetail,
}) => {
  const [activeTab, setActiveTab] = useState<'archive' | 'trash'>('archive');
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  const archivedVents = vents.filter((v) => v.archived && !v.deleted);
  const trashedVents = vents.filter((v) => v.deleted);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
            <Archive className="w-5 h-5 text-neutral-400" />
            <span>Archive & Trash</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Archived notes remain searchable. Soft-deleted items are held in Trash before permanent deletion.
          </p>
        </div>

        {activeTab === 'trash' && trashedVents.length > 0 && (
          <div>
            {!confirmEmpty ? (
              <button
                onClick={() => setConfirmEmpty(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-white hover:bg-rose-950/40 border border-rose-900/60 rounded-md transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Trash</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-300">Permanently erase all?</span>
                <button
                  onClick={() => {
                    onEmptyTrash();
                    setConfirmEmpty(false);
                  }}
                  className="px-2.5 py-1 text-xs bg-rose-600 hover:bg-rose-500 text-white rounded font-medium"
                >
                  Yes, Erase
                </button>
                <button
                  onClick={() => setConfirmEmpty(false)}
                  className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-neutral-900 rounded-lg border border-neutral-800 w-fit">
        <button
          onClick={() => setActiveTab('archive')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition ${
            activeTab === 'archive' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Archived ({archivedVents.length})
        </button>
        <button
          onClick={() => setActiveTab('trash')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition ${
            activeTab === 'trash' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Trash ({trashedVents.length})
        </button>
      </div>

      {activeTab === 'archive' ? (
        <div className="space-y-4">
          {archivedVents.length === 0 ? (
            <div className="py-20 text-center rounded-2xl bg-neutral-900/30 border border-neutral-800/60 p-8 text-xs text-neutral-400">
              No archived vents. You can archive any completed task or stale thought without deleting it.
            </div>
          ) : (
            <div className="space-y-3">
              {archivedVents.map((vent) => (
                <div
                  key={vent.id}
                  className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpenDetail(vent)}>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                      <span>{vent.type}</span>
                      <span>·</span>
                      <span>{new Date(vent.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-neutral-200 mt-1 truncate">
                      {vent.title}
                    </h4>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {vent.originalContent}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onUnarchive(vent)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-white transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Unarchive</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {trashedVents.length === 0 ? (
            <div className="py-20 text-center rounded-2xl bg-neutral-900/30 border border-neutral-800/60 p-8 text-xs text-neutral-400">
              Trash is empty.
            </div>
          ) : (
            <div className="space-y-3">
              {trashedVents.map((vent) => (
                <div
                  key={vent.id}
                  className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/80 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-mono text-rose-400">
                      Deleted {vent.deletedAt ? new Date(vent.deletedAt).toLocaleDateString() : ''}
                    </div>
                    <h4 className="text-sm font-medium text-neutral-300 mt-1 truncate">
                      {vent.title}
                    </h4>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {vent.originalContent}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onRestore(vent.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-white transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={() => onPermanentDelete(vent.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-400 transition"
                      title="Permanently Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
