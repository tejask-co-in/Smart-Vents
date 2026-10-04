import React from 'react';
import { Copy, ArrowRight, X } from 'lucide-react';
import { Vent } from '../../types/vent';

interface SimilarityAlertProps {
  currentVent: Vent;
  similarVent: Vent;
  similarityScore: number;
  onKeepBoth: () => void;
  onMerge: (source: Vent, target: Vent) => void;
  onDismiss: () => void;
}

export const SimilarityAlert: React.FC<SimilarityAlertProps> = ({
  currentVent,
  similarVent,
  similarityScore,
  onKeepBoth,
  onMerge,
  onDismiss,
}) => {
  return (
    <div className="my-4 p-4 rounded-xl bg-neutral-900 border border-indigo-900/60 shadow-lg text-neutral-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Copy className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-xs font-semibold text-white">
            Smart Vent noticed similarity ({Math.round(similarityScore * 100)}% overlap)
          </span>
        </div>
        <button onClick={onDismiss} className="text-neutral-400 hover:text-white">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="mt-1 text-xs text-neutral-400">
        This new entry appears closely related to something you previously dumped:
      </p>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
          <span className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">
            New Vent:
          </span>
          <div className="font-medium text-white truncate">{currentVent.title}</div>
          <p className="mt-1 text-neutral-400 line-clamp-2 text-[11px]">
            {currentVent.originalContent}
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
          <span className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">
            Previous Vent ({new Date(similarVent.createdAt).toLocaleDateString()}):
          </span>
          <div className="font-medium text-white truncate">{similarVent.title}</div>
          <p className="mt-1 text-neutral-400 line-clamp-2 text-[11px]">
            {similarVent.originalContent}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 text-xs">
        <button
          onClick={onDismiss}
          className="px-2.5 py-1 text-neutral-400 hover:text-white"
        >
          Ignore Suggestion
        </button>
        <button
          onClick={onKeepBoth}
          className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
        >
          Keep Both
        </button>
        <button
          onClick={() => onMerge(currentVent, similarVent)}
          className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1"
        >
          <span>Merge Into One</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
