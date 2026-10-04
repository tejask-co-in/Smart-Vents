import React from 'react';
import { Inbox, CheckCircle, ArrowRight } from 'lucide-react';
import { Vent } from '../../types/vent';
import { VentCard } from '../vent/VentCard';

interface InboxViewProps {
  vents: Vent[];
  onOpenDetail: (vent: Vent) => void;
  onToggleComplete: (vent: Vent) => void;
  onArchive: (vent: Vent) => void;
  onSoftDelete: (vent: Vent) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  vents,
  onOpenDetail,
  onToggleComplete,
  onArchive,
  onSoftDelete,
}) => {
  const inboxVents = vents.filter(
    (v) => !v.archived && !v.deleted && (v.status === 'inbox' || v.status === 'raw')
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-indigo-400" />
            <span>Inbox</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Raw, newly captured dumps waiting for your casual review. No pressure to clean up.
          </p>
        </div>
        <span className="text-xs font-mono text-neutral-400">
          {inboxVents.length} item{inboxVents.length === 1 ? '' : 's'}
        </span>
      </div>

      {inboxVents.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-neutral-900/30 border border-neutral-800/60 p-8 space-y-3">
          <CheckCircle className="w-8 h-8 text-emerald-400/80 mx-auto" />
          <h4 className="text-sm font-semibold text-neutral-200">Inbox is peaceful.</h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Everything you dumped has either been organized, archived, or filed into active projects.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inboxVents.map((vent) => (
            <VentCard
              key={vent.id}
              vent={vent}
              onOpenDetail={onOpenDetail}
              onToggleComplete={onToggleComplete}
              onArchive={onArchive}
              onSoftDelete={onSoftDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
