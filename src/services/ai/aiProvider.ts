import { Project, VentClassification, PriorityLevel, ExtractedEntity } from '../../types/vent';
import { analyzeContentLocally } from './localEngine';
import { analyzeContentWithCloud } from './cloudEngine';

export interface AIAnalysisOutput {
  title: string;
  type: VentClassification;
  types: VentClassification[];
  priority: PriorityLevel;
  priorityReason?: string;
  dueDate?: string;
  dateAmbiguity?: string;
  tags: string[];
  entities: ExtractedEntity[];
  actionItems: string[];
  classificationReason: string;
  projectId?: string;
  projectName?: string;
  suggestedNewProject?: string;
  confidence: number;
  providerUsed: 'local' | 'cloud';
}

export interface AIProvider {
  name: string;
  analyze(text: string, existingProjects: Project[]): Promise<AIAnalysisOutput>;
}

export class LocalAIProvider implements AIProvider {
  name = 'Local AI (Deterministic & Privacy-Preserving)';

  async analyze(text: string, existingProjects: Project[] = []): Promise<AIAnalysisOutput> {
    const res = analyzeContentLocally(text, existingProjects);
    return {
      ...res,
      providerUsed: 'local',
    };
  }
}

export class GeminiCloudProvider implements AIProvider {
  name = 'Gemini Cloud AI';

  async analyze(text: string, existingProjects: Project[] = []): Promise<AIAnalysisOutput> {
    // Attempt cloud analysis
    const cloudRes = await analyzeContentWithCloud(text, existingProjects);
    if (cloudRes) {
      return {
        ...cloudRes,
        providerUsed: 'cloud',
      };
    }

    // Graceful fallback to Local AI if cloud request fails or device is offline
    const localFallback = analyzeContentLocally(text, existingProjects);
    return {
      ...localFallback,
      classificationReason: `${localFallback.classificationReason} (Cloud offline, processed via local fallback)`,
      providerUsed: 'local',
    };
  }
}

export function getAIProvider(preference: 'local_only' | 'local_preferred' | 'cloud_enabled'): AIProvider {
  if (preference === 'cloud_enabled') {
    return new GeminiCloudProvider();
  }
  return new LocalAIProvider();
}
