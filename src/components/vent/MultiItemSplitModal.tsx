import React, { useState } from 'react';
import { Layers, Check, X, Edit3, Trash2 } from 'lucide-react';
import { SplitDumpCandidate, VentClassification, PriorityLevel } from '../../types/vent';

interface MultiItemSplitModalProps {
  isOpen: boolean;
  candidates: SplitDumpCandidate[];
  originalDump: string;
  onAcceptAll: (candidates: SplitDumpCandidate[]) => void;
  onAcceptSelected: (candidates: SplitDumpCandidate[]) => void;
  onKeepAsSingle: () => void;
  onCancel: () => void;
}

export const MultiItemSplitModal: React.FC<MultiItemSplitModalProps> = ({
  isOpen,
  candidates,
  originalDump,
  onAcceptAll,
  onAcceptSelected,
  onKeepAsSingle,
  onCancel,
}) => {
  const [items, setItems] = useState<SplitDumpCandidate[]>(candidates);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!isOpen || items.length === 0) return null;

  const toggleSelect = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const updateItemText = (id: string, newText: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, rawText: newText } : item))
    );
  };

  const updateItemType = (id: string, newType: VentClassification) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, type: newType } : item))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const selectedCount = items.filter((i) => i.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-neutral-100 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-semibold text-sm">Smart Vent found {items.length} possible items</h3>
              <p className="text-xs text-neutral-400">
                You dumped multiple thoughts at once. Review individual items or keep as a single unified vent.
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Original Dump Snapshot */}
        <div className="mt-3 p-2.5 rounded-lg bg-neutral-950/70 border border-neutral-800 text-xs text-neutral-400 italic shrink-0 max-h-20 overflow-y-auto">
          <span className="font-mono text-[10px] text-neutral-400 block not-italic mb-1 uppercase">
            Original Dump:
          </span>
          "{originalDump}"
        </div>

        {/* Separated entities list */}
        <div className="mt-4 space-y-3 overflow-y-auto pr-1 flex-1">
          {items.map((candidate, idx) => (
            <div
              key={candidate.id}
              className={`p-3 rounded-lg border transition-colors ${
                candidate.selected
                  ? 'bg-neutral-950 border-neutral-700'
                  : 'bg-neutral-950/40 border-neutral-800/60 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <input
                  type="checkbox"
                  checked={candidate.selected}
                  onChange={() => toggleSelect(candidate.id)}
                  className="mt-1 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-0 cursor-pointer"
                />

                <div className="flex-1">
                  {editingId === candidate.id ? (
                    <textarea
                      value={candidate.rawText}
                      onChange={(e) => updateItemText(candidate.id, e.target.value)}
                      className="w-full p-2 text-xs rounded bg-neutral-900 border border-neutral-700 text-white resize-none"
                      rows={2}
                    />
                  ) : (
                    <div className="text-xs font-medium text-neutral-200 leading-relaxed">
                      {candidate.rawText}
                    </div>
                  )}

                  {/* Clean unboxed metadata discipline */}
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                    <span className="text-indigo-400">{candidate.type}</span>
                    <span>·</span>
                    <span>Priority: {candidate.priority}</span>
                    {candidate.tags?.length > 0 && (
                      <>
                        <span>·</span>
                        <span>{candidate.tags.slice(0, 3).map((t) => `#${t}`).join(' ')}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setEditingId(editingId === candidate.id ? null : candidate.id)}
                    className="p-1 text-neutral-400 hover:text-white rounded"
                    title="Edit item"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeItem(candidate.id)}
                    className="p-1 text-neutral-400 hover:text-red-400 rounded"
                    title="Remove candidate"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal actions */}
        <div className="mt-5 pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            onClick={onKeepAsSingle}
            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition"
          >
            Keep as One Single Vent
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAcceptSelected(items.filter((i) => i.selected))}
              disabled={selectedCount === 0}
              className="px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition disabled:opacity-40"
            >
              Accept Selected ({selectedCount})
            </button>

            <button
              onClick={() => onAcceptAll(items)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-neutral-100 hover:bg-white rounded-lg transition shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept All ({items.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
