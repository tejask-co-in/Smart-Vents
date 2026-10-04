import { Project, VentClassification, PriorityLevel, ExtractedEntity } from '../../types/vent';

export interface CloudAnalysisResult {
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
  confidence: number;
}

export async function analyzeContentWithCloud(
  text: string,
  existingProjects: Project[] = []
): Promise<CloudAnalysisResult | null> {
  try {
    const res = await fetch('/api/cloud-ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        projects: existingProjects.map((p) => ({ id: p.id, name: p.name })),
      }),
    });

    if (!res.ok) {
      throw new Error(`Cloud AI returned status ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Cloud AI analysis failed or offline, falling back to local engine:', err);
    return null;
  }
}

export async function askStoredVents(
  query: string,
  ventsContext: { id: string; title: string; type: string; content: string; tags: string[] }[]
): Promise<string | null> {
  try {
    const res = await fetch('/api/cloud-ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        vents: ventsContext,
      }),
    });

    if (!res.ok) {
      throw new Error(`Cloud query returned ${res.status}`);
    }

    const data = await res.json();
    return data.answer;
  } catch (err) {
    console.warn('Cloud vent chat failed:', err);
    return null;
  }
}
