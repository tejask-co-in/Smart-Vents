import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Filter, X, ArrowRight } from 'lucide-react';
import { Vent, Project, UserSettings } from '../../types/vent';
import { VentCard } from '../vent/VentCard';
import { askStoredVents } from '../../services/ai/cloudEngine';

interface SearchViewProps {
  vents: Vent[];
  projects: Project[];
  settings: UserSettings;
  onOpenDetail: (vent: Vent) => void;
  onToggleComplete: (vent: Vent) => void;
  onArchive: (vent: Vent) => void;
  onSoftDelete: (vent: Vent) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  vents,
  projects,
  settings,
  onOpenDetail,
  onToggleComplete,
  onArchive,
  onSoftDelete,
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Suggested commands for user to test natural language retrieval
  const sampleCommands = [
    'Show everything related to portfolio',
    'What did I save about Firebase or technical tools?',
    'Show things I said I would do but haven\'t finished',
    'Find thoughts and future ideas',
  ];

  // Natural language query evaluation
  const handleRunAiQuery = async (userPrompt: string) => {
    setQuery(userPrompt);
    if (settings.aiProcessingPreference === 'cloud_enabled') {
      setIsAiThinking(true);
      setAiAnswer(null);
      const answer = await askStoredVents(
        userPrompt,
        vents.map((v) => ({
          id: v.id,
          title: v.title,
          type: v.type,
          content: v.originalContent,
          tags: v.tags,
        }))
      );
      setAiAnswer(answer);
      setIsAiThinking(false);
    }
  };

  const filteredVents = vents.filter((v) => {
    if (v.deleted && filterType !== 'trash') return false;
    if (!v.deleted && filterType === 'trash') return false;

    // Filter by type
    if (filterType === 'tasks' && v.type !== 'Task' && (!v.actionItems || v.actionItems.length === 0))
      return false;
    if (filterType === 'ideas' && v.type !== 'Future idea' && v.type !== 'Project idea')
      return false;
    if (filterType === 'notes' && v.type !== 'Note' && v.type !== 'Thought') return false;
    if (filterType === 'references' && v.type !== 'Reference' && v.type !== 'Bookmark') return false;

    // Search query matching
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();

    // Natural command heuristics
    if (q.includes('not finished') || q.includes('haven\'t finished') || q.includes('incomplete')) {
      return (v.type === 'Task' || v.actionItems?.length > 0) && v.status !== 'completed';
    }

    const inTitle = v.title.toLowerCase().includes(q);
    const inContent = v.originalContent.toLowerCase().includes(q);
    const inTags = (v.tags || []).some((t) => t.toLowerCase().includes(q));
    const inProject = (v.projectName || '').toLowerCase().includes(q);
    const inType = v.type.toLowerCase().includes(q);
    const inAttachments = (v.attachments || []).some(
      (a) => a.name.toLowerCase().includes(q) || (a.summary || '').toLowerCase().includes(q)
    );

    return inTitle || inContent || inTags || inProject || inType || inAttachments;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Search Header */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-100">Universal Search & Commands</h2>
        <div className="relative">
          <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords, #tags, dates, file names, or ask a natural question..."
            className="w-full pl-12 pr-10 py-3 text-sm rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600 font-sans shadow-lg"
            autoFocus
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setAiAnswer(null);
              }}
              className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Command Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-neutral-400 font-mono text-[11px]">Suggestions:</span>
          {sampleCommands.map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleRunAiQuery(cmd)}
              className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition text-[11px]"
            >
              "{cmd}"
            </button>
          ))}
        </div>
      </div>

      {/* Cloud AI Direct Answer if available */}
      {isAiThinking && (
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center gap-2 text-xs text-indigo-400">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>Searching your stored vents with Cloud AI...</span>
        </div>
      )}

      {aiAnswer && (
        <div className="p-4 rounded-xl bg-neutral-900 border border-indigo-900/50 shadow-md space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Vent Summary</span>
          </div>
          <p className="text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">{aiAnswer}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-neutral-900/80 rounded-lg border border-neutral-800/80 overflow-x-auto">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition ${
            filterType === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Everything
        </button>
        <button
          onClick={() => setFilterType('tasks')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition ${
            filterType === 'tasks' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => setFilterType('ideas')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition ${
            filterType === 'ideas' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Ideas
        </button>
        <button
          onClick={() => setFilterType('notes')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition ${
            filterType === 'notes' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Notes
        </button>
        <button
          onClick={() => setFilterType('references')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition ${
            filterType === 'references' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          References
        </button>
      </div>

      {/* Results Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>Found {filteredVents.length} result{filteredVents.length === 1 ? '' : 's'}</span>
        </div>

        {filteredVents.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-neutral-900/30 border border-neutral-800/60 p-8 text-xs text-neutral-400">
            No matching vents found for "{query}".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVents.map((vent) => (
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
    </div>
  );
};
