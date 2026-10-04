export type VentClassification =
  | 'Task'
  | 'Subtask'
  | 'Project'
  | 'Project idea'
  | 'Future idea'
  | 'Goal'
  | 'Reminder'
  | 'Event'
  | 'Note'
  | 'Thought'
  | 'Draft'
  | 'Prompt'
  | 'Template'
  | 'Reference'
  | 'Bookmark'
  | 'Research'
  | 'Learning material'
  | 'Decision'
  | 'Question'
  | 'Problem'
  | 'Solution'
  | 'Meeting note'
  | 'Personal'
  | 'Work'
  | 'Academic'
  | 'Technical'
  | 'Creative'
  | 'Financial'
  | 'Travel'
  | 'Shopping'
  | 'Communication'
  | 'Document'
  | 'Media'
  | 'Archive'
  | 'Unknown';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low' | 'someday' | 'unknown';

export type VentStatus = 'raw' | 'inbox' | 'organized' | 'in_progress' | 'completed' | 'someday' | 'archived';

export interface ExtractedEntity {
  name: string;
  category: 'person' | 'tool' | 'framework' | 'date' | 'url' | 'metric' | 'concept' | 'location';
  confidence: number;
}

export interface AttachmentMeta {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl?: string; // base64 / blob URL for preview and retrieval
  extractedText?: string;
  summary?: string;
  previewAvailable: boolean;
  createdAt: number;
}

export interface Vent {
  id: string;
  originalContent: string;
  title: string;
  type: VentClassification;
  types: VentClassification[];
  status: VentStatus;
  priority: PriorityLevel;
  priorityReason?: string;
  dueDate?: string;
  dateAmbiguity?: string;
  source: 'text' | 'voice' | 'file' | 'split_dump';
  confidence: number; // 0 to 1
  archived: boolean;
  deleted: boolean;
  deletedAt?: number;
  projectId?: string;
  projectName?: string;
  tags: string[];
  entities: ExtractedEntity[];
  actionItems: string[];
  classificationReason: string;
  resurfaceDate?: number;
  resurfaceReason?: string;
  similarityGroup?: string;
  similarItemIds?: string[];
  attachments: AttachmentMeta[];
  parentDumpId?: string;
  createdAt: number;
  updatedAt: number;
  syncState: 'local' | 'synced' | 'pending' | 'conflict';
  version: number;
  aiOrigin: 'local' | 'cloud';
  userEdited: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'incubating' | 'completed' | 'archived';
  isAutoDetected: boolean;
  detectedKeywordTriggers: string[];
  createdAt: number;
  updatedAt: number;
  itemCount?: number;
}

export interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: 'similar' | 'subtask_of' | 'project_link' | 'reference_for' | 'topic_affinity';
  confidence: number;
  explanation: string;
}

export interface LearnedPreferences {
  tagCorrections: Record<string, string>;
  typeCorrections: Record<string, string>;
  projectAffinity: Record<string, string[]>;
  dismissedResurfacingIds: string[];
  dismissedSimilarityPairs: string[];
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  mode: 'local' | 'cloud';
  cloudAccount?: {
    email: string;
    displayName: string;
    token?: string;
    syncEnabled: boolean;
  };
  aiProcessingPreference: 'local_only' | 'local_preferred' | 'cloud_enabled';
  smartResurfacingEnabled: boolean;
  duplicateDetectionEnabled: boolean;
  autoProjectDiscoveryEnabled: boolean;
  learnedPreferences: LearnedPreferences;
  lastSyncTimestamp?: number;
}

export interface LegalConfig {
  appName: string;
  legalEntityName: string;
  contactEmail: string;
  privacyEmail: string;
  supportEmail: string;
  grievanceContact: string;
  businessAddress: string;
  governingLaw: string;
  lastUpdatedDate: string;
  effectiveDate: string;
}

export interface SplitDumpCandidate {
  id: string;
  rawText: string;
  type: VentClassification;
  priority: PriorityLevel;
  tags: string[];
  reason: string;
  selected: boolean;
}
