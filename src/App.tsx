import React, { useState, useEffect, useCallback } from 'react';
import {
  getAllVents,
  saveVent,
  saveVents,
  softDeleteVent,
  restoreVent,
  permanentDeleteVent,
  getAllProjects,
  saveProject,
  deleteProject,
  getSettings,
  saveSettings,
} from './db/indexedDB';
import { demoShowcaseVents, demoShowcaseProjects } from './db/initialData';
import {
  Vent,
  Project,
  UserSettings,
  AttachmentMeta,
  SplitDumpCandidate,
} from './types/vent';
import { Navbar, NavView } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { OfflineBanner } from './components/layout/OfflineBanner';
import { AuthModal } from './components/common/AuthModal';
import { ExportImportModal } from './components/common/ExportImportModal';
import { CaptureHomeView } from './components/views/CaptureHomeView';
import { InboxView } from './components/views/InboxView';
import { ProjectsView } from './components/views/ProjectsView';
import { FilesView } from './components/views/FilesView';
import { InsightsView } from './components/views/InsightsView';
import { SearchView } from './components/views/SearchView';
import { ArchiveView } from './components/views/ArchiveView';
import { SettingsView } from './components/views/SettingsView';
import { VisualStudioView } from './components/views/VisualStudioView';
import { VentDetailModal } from './components/vent/VentDetailModal';
import { MultiItemSplitModal } from './components/vent/MultiItemSplitModal';
import { SimilarityAlert } from './components/vent/SimilarityAlert';
import {
  detectSplitDumpCandidates,
  computeSimilarityScore,
} from './services/ai/localEngine';
import { getAIProvider } from './services/ai/aiProvider';
import { syncEngine } from './services/sync/syncEngine';
import { defaultSettings } from './db/indexedDB';
import { VentInput } from './components/vent/VentInput';
import { X } from 'lucide-react';

export default function App() {
  const [vents, setVents] = useState<Vent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [currentView, setCurrentView] = useState<NavView>('vent');
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals & Overlays
  const [selectedVent, setSelectedVent] = useState<Vent | null>(null);
  const [splitCandidates, setSplitCandidates] = useState<SplitDumpCandidate[]>([]);
  const [pendingDumpText, setPendingDumpText] = useState<string>('');
  const [pendingDumpAttachments, setPendingDumpAttachments] = useState<AttachmentMeta[]>([]);
  const [similarityPair, setSimilarityPair] = useState<{
    current: Vent;
    similar: Vent;
    score: number;
  } | null>(null);
  const [isQuickVentModalOpen, setIsQuickVentModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Reliable DOM Theme Applicator
  const applyThemeToDOM = useCallback((theme: 'dark' | 'light' | 'system') => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');

    if (theme === 'light') {
      root.classList.add('light');
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      const isSystemDark =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(isSystemDark ? 'dark' : 'light');
    }
  }, []);

  // Initialize DB data
  const loadDatabase = useCallback(async () => {
    try {
      const [storedVents, storedProjects, storedSettings] = await Promise.all([
        getAllVents(),
        getAllProjects(),
        getSettings(),
      ]);

      setSettings(storedSettings);

      // If vents are empty, clean up any orphan sample projects so no fake ghost project remains
      if (storedVents.length === 0) {
        for (const p of storedProjects) {
          if (p.id === 'proj_portfolio_v2' || p.id === 'proj_demo_portfolio') {
            await deleteProject(p.id);
          }
        }
        const cleanProjects = storedProjects.filter(
          (p) => p.id !== 'proj_portfolio_v2' && p.id !== 'proj_demo_portfolio'
        );
        setVents([]);
        setProjects(cleanProjects);
      } else {
        setVents(storedVents);
        setProjects(storedProjects);
      }

      // Apply initial theme cleanly
      applyThemeToDOM(storedSettings.theme || 'dark');
    } catch (err) {
      console.error('Failed to load IndexedDB data:', err);
    }
  }, [applyThemeToDOM]);

  useEffect(() => {
    loadDatabase();
  }, [loadDatabase]);

  // Global Keyboard Shortcuts (Cmd/Ctrl + K, Cmd/Ctrl + Shift + N, Esc)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCurrentView('search');
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsQuickVentModalOpen(true);
      }
      if (e.key === 'Escape') {
        setSelectedVent(null);
        setSplitCandidates([]);
        setIsQuickVentModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  // Primary Dump Processing Handler
  const handleDump = async (text: string, attachments: AttachmentMeta[] = []) => {
    if (!text.trim() && attachments.length === 0) return;
    if (!settings) return;

    // Check for multi-item dump candidate if text is sufficiently substantial
    if (text.length > 30) {
      const candidates = detectSplitDumpCandidates(text);
      if (candidates.length >= 2) {
        setSplitCandidates(candidates);
        setPendingDumpText(text);
        setPendingDumpAttachments(attachments);
        return;
      }
    }

    await executeSingleDumpSave(text, attachments);
  };

  const executeSingleDumpSave = async (
    text: string,
    attachments: AttachmentMeta[] = [],
    forcedType?: string
  ) => {
    if (!settings) return;
    setIsProcessing(true);

    try {
      const aiProvider = getAIProvider(settings.aiProcessingPreference);
      const analysis = await aiProvider.analyze(text || 'Untitled Attachment Dump', projects);

      let targetProjectId = analysis.projectId;
      let targetProjectName = analysis.projectName;

      // Handle emergent project discovery if enabled
      if (
        settings.autoProjectDiscoveryEnabled &&
        analysis.suggestedNewProject &&
        !targetProjectId
      ) {
        const newProj: Project = {
          id: `proj_${Date.now()}`,
          name: analysis.suggestedNewProject,
          description: `Discovered from dump keyword patterns: "${analysis.suggestedNewProject}"`,
          status: 'incubating',
          isAutoDetected: true,
          detectedKeywordTriggers: [analysis.suggestedNewProject.toLowerCase()],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await saveProject(newProj);
        setProjects((prev) => [...prev, newProj]);
        targetProjectId = newProj.id;
        targetProjectName = newProj.name;
      }

      const newVent: Vent = {
        id: `vent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        originalContent: text || attachments.map((a) => a.name).join(', '),
        title: analysis.title,
        type: (forcedType as any) || analysis.type,
        types: analysis.types,
        status: 'inbox',
        priority: analysis.priority,
        priorityReason: analysis.priorityReason,
        dueDate: analysis.dueDate,
        dateAmbiguity: analysis.dateAmbiguity,
        source: attachments.length > 0 && !text ? 'file' : 'text',
        confidence: analysis.confidence,
        archived: false,
        deleted: false,
        projectId: targetProjectId,
        projectName: targetProjectName,
        tags: analysis.tags,
        entities: analysis.entities,
        actionItems: analysis.actionItems,
        classificationReason: analysis.classificationReason,
        resurfaceDate:
          analysis.type === 'Future idea' || analysis.type === 'Project idea'
            ? Date.now() + 86400000 * 7
            : undefined,
        resurfaceReason:
          analysis.type === 'Future idea' ? 'Idea resurfacing candidate for revisit' : undefined,
        attachments,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncState: 'pending',
        version: 1,
        aiOrigin: analysis.providerUsed,
        userEdited: false,
      };

      await saveVent(newVent);
      setVents((prev) => [newVent, ...prev]);

      // Check similarity against existing vents
      if (settings.duplicateDetectionEnabled) {
        for (const existing of vents) {
          if (existing.id !== newVent.id && !existing.deleted) {
            const score = computeSimilarityScore(newVent.originalContent, existing.originalContent);
            if (score >= 0.55) {
              setSimilarityPair({ current: newVent, similar: existing, score });
              break;
            }
          }
        }
      }

      // Trigger background sync if in cloud mode
      if (settings.mode === 'cloud') {
        syncEngine.triggerSync(settings).catch(() => {});
      }
    } catch (err) {
      console.error('Error analyzing and dumping vent:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Multi-item dump resolution
  const handleAcceptAllSplit = async (candidates: SplitDumpCandidate[]) => {
    setSplitCandidates([]);
    setIsProcessing(true);

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      await executeSingleDumpSave(
        c.rawText,
        i === 0 ? pendingDumpAttachments : [],
        c.type
      );
    }

    setPendingDumpText('');
    setPendingDumpAttachments([]);
    setIsProcessing(false);
  };

  const handleKeepAsSingleDump = async () => {
    setSplitCandidates([]);
    await executeSingleDumpSave(pendingDumpText, pendingDumpAttachments);
    setPendingDumpText('');
    setPendingDumpAttachments([]);
  };

  // State Updates
  const handleUpdateVent = async (updated: Vent) => {
    await saveVent(updated);
    setVents((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  };

  const handleToggleComplete = async (vent: Vent) => {
    const updated: Vent = {
      ...vent,
      status: vent.status === 'completed' ? 'organized' : 'completed',
      updatedAt: Date.now(),
      syncState: 'pending',
    };
    await handleUpdateVent(updated);
  };

  const handleArchive = async (vent: Vent) => {
    const updated: Vent = {
      ...vent,
      archived: !vent.archived,
      updatedAt: Date.now(),
      syncState: 'pending',
    };
    await handleUpdateVent(updated);
  };

  const handleSoftDelete = async (vent: Vent) => {
    await softDeleteVent(vent.id);
    setVents((prev) =>
      prev.map((v) => (v.id === vent.id ? { ...v, deleted: true, deletedAt: Date.now() } : v))
    );
  };

  const handleRestore = async (ventId: string) => {
    await restoreVent(ventId);
    setVents((prev) =>
      prev.map((v) => (v.id === ventId ? { ...v, deleted: false, deletedAt: undefined } : v))
    );
  };

  const handlePermanentDelete = async (ventId: string) => {
    await permanentDeleteVent(ventId);
    setVents((prev) => prev.filter((v) => v.id !== ventId));
  };

  const handleEmptyTrash = async () => {
    const trashed = vents.filter((v) => v.deleted);
    for (const v of trashed) {
      await permanentDeleteVent(v.id);
    }
    setVents((prev) => prev.filter((v) => !v.deleted));
  };

  const handleCreateProject = async (
    name: string,
    description: string,
    triggers: string[]
  ) => {
    const proj: Project = {
      id: `proj_${Date.now()}`,
      name,
      description,
      status: 'active',
      isAutoDetected: false,
      detectedKeywordTriggers: triggers,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveProject(proj);
    setProjects((prev) => [...prev, proj]);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    // Unlink any vents that had this project
    const unlinked = vents.map((v) =>
      v.projectId === id ? { ...v, projectId: undefined, projectName: undefined } : v
    );
    setVents(unlinked);
    await saveVents(unlinked);
  };

  const handleLoadDemoData = async () => {
    await saveVents(demoShowcaseVents);
    for (const p of demoShowcaseProjects) {
      await saveProject(p);
    }
    setVents(demoShowcaseVents);
    setProjects(demoShowcaseProjects);
  };

  const handleMergeSimilar = async (current: Vent, similar: Vent) => {
    const merged: Vent = {
      ...similar,
      title: `${similar.title} & ${current.title}`,
      originalContent: `${similar.originalContent}\n\n[Merged update]: ${current.originalContent}`,
      tags: Array.from(new Set([...(similar.tags || []), ...(current.tags || [])])),
      actionItems: Array.from(
        new Set([...(similar.actionItems || []), ...(current.actionItems || [])])
      ),
      attachments: [...(similar.attachments || []), ...(current.attachments || [])],
      updatedAt: Date.now(),
      syncState: 'pending',
    };

    await saveVent(merged);
    await permanentDeleteVent(current.id);
    setVents((prev) => prev.filter((v) => v.id !== current.id).map((v) => (v.id === merged.id ? merged : v)));
    setSimilarityPair(null);
  };

  const handleThemeChange = (theme: 'dark' | 'light' | 'system') => {
    const updated: UserSettings = { ...settings, theme };
    setSettings(updated);
    saveSettings(updated);
    applyThemeToDOM(theme);
  };

  return (
    <div className="min-h-screen app-canvas app-text-main flex flex-col font-sans transition-colors duration-200">
      {/* Top Bar Contract (Brand | Navigation | Mode & Actions) */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenQuickVent={() => setIsQuickVentModalOpen(true)}
        settings={settings}
        onThemeChange={handleThemeChange}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 pb-16">
        {/* Similarity Alert Banner */}
        {similarityPair && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <SimilarityAlert
              currentVent={similarityPair.current}
              similarVent={similarityPair.similar}
              similarityScore={similarityPair.score}
              onKeepBoth={() => setSimilarityPair(null)}
              onDismiss={() => setSimilarityPair(null)}
              onMerge={handleMergeSimilar}
            />
          </div>
        )}

        {currentView === 'vent' && (
          <CaptureHomeView
            vents={vents}
            projects={projects}
            onDump={handleDump}
            onOpenDetail={(v) => setSelectedVent(v)}
            onToggleComplete={handleToggleComplete}
            onArchive={handleArchive}
            onSoftDelete={handleSoftDelete}
            isProcessing={isProcessing}
            onNavigateToProjects={() => setCurrentView('projects')}
            onNavigateToInbox={() => setCurrentView('inbox')}
            onLoadDemoData={handleLoadDemoData}
            onOpenExport={() => setIsExportModalOpen(true)}
          />
        )}

        {currentView === 'visuals' && (
          <VisualStudioView
            vents={vents}
            projects={projects}
            onSelectVent={(v) => setSelectedVent(v)}
          />
        )}

        {currentView === 'inbox' && (
          <InboxView
            vents={vents}
            onOpenDetail={(v) => setSelectedVent(v)}
            onToggleComplete={handleToggleComplete}
            onArchive={handleArchive}
            onSoftDelete={handleSoftDelete}
          />
        )}

        {currentView === 'projects' && (
          <ProjectsView
            projects={projects}
            vents={vents}
            onCreateProject={handleCreateProject}
            onOpenDetail={(v) => setSelectedVent(v)}
            onToggleComplete={handleToggleComplete}
            onArchive={handleArchive}
            onSoftDelete={handleSoftDelete}
          />
        )}

        {currentView === 'files' && (
          <FilesView
            vents={vents}
            onOpenParentVent={(v) => setSelectedVent(v)}
          />
        )}

        {currentView === 'insights' && (
          <InsightsView
            vents={vents}
            projects={projects}
            onOpenVent={(v) => setSelectedVent(v)}
          />
        )}

        {currentView === 'search' && (
          <SearchView
            vents={vents}
            projects={projects}
            settings={settings}
            onOpenDetail={(v) => setSelectedVent(v)}
            onToggleComplete={handleToggleComplete}
            onArchive={handleArchive}
            onSoftDelete={handleSoftDelete}
          />
        )}

        {currentView === 'archive' && (
          <ArchiveView
            vents={vents}
            onRestore={handleRestore}
            onUnarchive={handleArchive}
            onPermanentDelete={handlePermanentDelete}
            onEmptyTrash={handleEmptyTrash}
            onOpenDetail={(v) => setSelectedVent(v)}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={async (newSet) => {
              setSettings(newSet);
              await saveSettings(newSet);
            }}
            onDataReset={loadDatabase}
            ventCount={vents.filter((v) => !v.deleted).length}
            projectCount={projects.length}
          />
        )}
      </main>

      {/* Offline Status Toast */}
      <OfflineBanner />

      {/* Multi-Item Dump Split Modal */}
      <MultiItemSplitModal
        isOpen={splitCandidates.length > 0}
        candidates={splitCandidates}
        originalDump={pendingDumpText}
        onAcceptAll={handleAcceptAllSplit}
        onAcceptSelected={handleAcceptAllSplit}
        onKeepAsSingle={handleKeepAsSingleDump}
        onCancel={() => {
          setSplitCandidates([]);
          setPendingDumpText('');
          setPendingDumpAttachments([]);
        }}
      />

      {/* Vent Detail Modal */}
      <VentDetailModal
        vent={selectedVent}
        projects={projects}
        isOpen={!!selectedVent}
        onClose={() => setSelectedVent(null)}
        onUpdate={handleUpdateVent}
        onArchive={handleArchive}
        onSoftDelete={handleSoftDelete}
      />

      {/* Quick Vent Modal (floating +Vent capture for rapid capture from any view) */}
      {isQuickVentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl app-card app-border p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b app-border">
              <h3 className="text-sm font-semibold app-text-main">Quick Vent</h3>
              <button
                onClick={() => setIsQuickVentModalOpen(false)}
                className="app-text-muted hover:opacity-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <VentInput
              onDump={async (text, atts) => {
                setIsQuickVentModalOpen(false);
                await handleDump(text, atts);
              }}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Footer Navigation for Thumb Reachability) */}
      <BottomNav
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenQuickVent={() => setIsQuickVentModalOpen(true)}
        settings={settings}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Sign In / Sign Up Cloud Account Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        settings={settings}
        onUpdateSettings={async (newSet) => {
          setSettings(newSet);
          await saveSettings(newSet);
        }}
      />

      {/* Export & Data Backup Modal */}
      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onDataImported={loadDatabase}
      />
    </div>
  );
}
