import {
  Vent,
  VentClassification,
  PriorityLevel,
  ExtractedEntity,
  SplitDumpCandidate,
  Project,
} from '../../types/vent';

// Patterns for Multi-item splitting
export function detectSplitDumpCandidates(text: string): SplitDumpCandidate[] {
  if (!text || text.trim().length === 0) return [];

  // Split by sentence delimiters or conjunctions or linebreaks
  const rawSegments = text
    .split(/(?:\r?\n)+|(?<=[.!?])\s+(?=[A-Z0-9])|(?<=[;])\s+|(?<=\b(?:also|plus|and then|next)\b)\s+/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  if (rawSegments.length <= 1) {
    return [];
  }

  return rawSegments.map((segment, idx) => {
    const analysis = analyzeContentLocally(segment, []);
    return {
      id: `split_${Date.now()}_${idx}`,
      rawText: segment,
      type: analysis.type,
      priority: analysis.priority,
      tags: analysis.tags,
      reason: analysis.classificationReason,
      selected: true,
    };
  });
}

// Temporal parsing
export function parseTemporalInformation(text: string): {
  dueDate?: string;
  ambiguousNotice?: string;
  priorityBoost?: PriorityLevel;
} {
  const lower = text.toLowerCase();
  const now = new Date();

  // Urgent triggers
  if (/\b(asap|immediately|urgently|emergency|right now|tonight)\b/i.test(lower)) {
    return {
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59).toISOString(),
      priorityBoost: 'critical',
    };
  }

  // Today
  if (/\btoday\b/i.test(lower)) {
    return {
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0).toISOString(),
      priorityBoost: 'high',
    };
  }

  // Tomorrow
  if (/\btomorrow\b/i.test(lower)) {
    const tmrw = new Date(now.getTime() + 86400000);
    return {
      dueDate: new Date(tmrw.getFullYear(), tmrw.getMonth(), tmrw.getDate(), 18, 0).toISOString(),
      priorityBoost: 'high',
    };
  }

  // Next week
  if (/\bnext week\b/i.test(lower)) {
    const nw = new Date(now.getTime() + 86400000 * 7);
    return {
      dueDate: new Date(nw.getFullYear(), nw.getMonth(), nw.getDate(), 18, 0).toISOString(),
      priorityBoost: 'medium',
    };
  }

  // Specific days (e.g. before Thursday, on Friday, by Monday)
  const dayMatch = lower.match(/\b(?:by|before|on|due)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  if (dayMatch) {
    const daysMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    const targetDay = daysMap[dayMatch[1].toLowerCase()];
    if (targetDay !== undefined) {
      const currentDay = now.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7;
      const targetDate = new Date(now.getTime() + diff * 86400000);
      return {
        dueDate: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 18, 0).toISOString(),
        priorityBoost: 'high',
      };
    }
  }

  // Explicit months and dates (e.g., Oct 18, October 18, Nov 5th)
  const monthMatch = lower.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
  if (monthMatch) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIdx = months.findIndex((m) => monthMatch[1].toLowerCase().startsWith(m));
    const day = parseInt(monthMatch[2], 10);
    if (monthIdx !== -1 && day >= 1 && day <= 31) {
      const year = now.getFullYear();
      const targetDate = new Date(year, monthIdx, day, 18, 0);
      if (targetDate.getTime() < now.getTime()) {
        targetDate.setFullYear(year + 1);
      }
      return {
        dueDate: targetDate.toISOString(),
        priorityBoost: 'medium',
      };
    }
  }

  // Ambiguous natural language without resolved dates
  if (
    /\b(before submission|before college|after meeting|when free|after launch|someday soon|whenever possible|sometime)\b/i.test(
      lower
    )
  ) {
    return {
      ambiguousNotice: 'Time reference detected — date unresolved',
      priorityBoost: 'medium',
    };
  }

  return {};
}

// Extract named entities, links, tools
export function extractEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const lower = text.toLowerCase();

  // URLs
  const urlMatches = text.match(/https?:\/\/[^\s]+/g);
  if (urlMatches) {
    urlMatches.forEach((url) => {
      entities.push({ name: url, category: 'url', confidence: 0.99 });
    });
  }

  // Frameworks & Tech
  const techTerms = [
    'react',
    'typescript',
    'javascript',
    'python',
    'firebase',
    'webgpu',
    'tailwind',
    'node',
    'express',
    'postgres',
    'graphql',
    'vite',
    'pwa',
    'indexeddb',
    'next.js',
    'docker',
    'gemini',
    'llm',
    'gpt',
  ];
  techTerms.forEach((term) => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(lower)) {
      entities.push({ name: term, category: 'framework', confidence: 0.95 });
    }
  });

  // Tools & Hardware
  const tools = ['ssd', 'laptop', 'camera', 'microphone', 'gpu', 'monitor', 'keyboard', 'figma', 'notion', 'github'];
  tools.forEach((tool) => {
    const regex = new RegExp(`\\b${tool}\\b`, 'i');
    if (regex.test(lower)) {
      entities.push({ name: tool.toUpperCase(), category: 'tool', confidence: 0.92 });
    }
  });

  // Common concepts
  const concepts = [
    'portfolio',
    'internship',
    'presentation',
    'budget',
    'research',
    'contract',
    'meeting',
    'invoice',
    'roadmap',
  ];
  concepts.forEach((concept) => {
    const regex = new RegExp(`\\b${concept}\\b`, 'i');
    if (regex.test(lower)) {
      entities.push({ name: concept, category: 'concept', confidence: 0.88 });
    }
  });

  return entities;
}

// Generate tags
export function extractSmartTags(text: string, entities: ExtractedEntity[]): string[] {
  const tagSet = new Set<string>();
  const lower = text.toLowerCase();

  // Hash tags if explicitly present
  const explicitHashes = text.match(/#([a-zA-Z0-9_-]+)/g);
  if (explicitHashes) {
    explicitHashes.forEach((h) => tagSet.add(h.slice(1).toLowerCase()));
  }

  // Add key entities as tags
  entities.forEach((e) => {
    if (e.category !== 'url') {
      tagSet.add(e.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
  });

  // Domain tags
  if (/\b(urgent|asap|tonight|emergency)\b/i.test(lower)) tagSet.add('urgent');
  if (/\b(idea|what if|maybe|someday)\b/i.test(lower)) tagSet.add('idea');
  if (/\b(buy|purchase|shopping|price|cost|order)\b/i.test(lower)) tagSet.add('shopping');
  if (/\b(flight|hotel|ticket|travel|trip|visit)\b/i.test(lower)) tagSet.add('travel');
  if (/\b(tax|invoice|finance|money|salary|crypto|stock)\b/i.test(lower)) tagSet.add('finance');
  if (/\b(bug|fix|error|crash|deploy|code|api|refactor)\b/i.test(lower)) tagSet.add('dev');
  if (/\b(meeting|call|sync|discuss|interview)\b/i.test(lower)) tagSet.add('meeting');
  if (/\b(study|assignment|college|exam|lecture|paper)\b/i.test(lower)) tagSet.add('academic');

  return Array.from(tagSet).slice(0, 8);
}

// Action items extraction
export function extractActionItems(text: string): string[] {
  const actionItems: string[] = [];
  const sentences = text.split(/(?:\r?\n)+|(?<=[.!?])\s+/);

  const actionVerbRegex = /\b(buy|purchase|send|email|finish|complete|write|fix|call|schedule|review|draft|clean|submit|verify|build|check|create|update|deploy|install)\b/i;

  sentences.forEach((s) => {
    const trimmed = s.trim();
    if (trimmed.length > 4 && actionVerbRegex.test(trimmed)) {
      actionItems.push(trimmed.replace(/^[•\-*\d.]+\s*/, ''));
    }
  });

  return actionItems.slice(0, 6);
}

// Intelligent Classification
export function classifyContent(text: string): {
  type: VentClassification;
  types: VentClassification[];
  confidence: number;
  reason: string;
} {
  const lower = text.toLowerCase();
  const types: VentClassification[] = [];

  let primary: VentClassification = 'Note';
  let confidence = 0.85;
  let reason = 'Item recorded as general reference note.';

  const isQuestion = /\?$/.test(text.trim()) || /^(why|how|what|where|when|can we|should we)\b/i.test(lower);
  const isHypothetical = /\b(what if|maybe|could be|dream|someday|idea for|concept)\b/i.test(lower);
  const hasAction = /\b(need to|must|have to|remember to|todo|finish|fix|buy|send|call|submit|deploy)\b/i.test(lower);
  const hasReference = /\b(https?:\/\/|api documentation|docs|bookmark|link|reference|cheatsheet)\b/i.test(lower);
  const isMeeting = /\b(meeting|discussion with|sync with|standup|call notes|minuted)\b/i.test(lower);
  const isCode = /[{};=>]|function|const |import |def |class |SELECT /i.test(text);

  if (hasAction) {
    primary = 'Task';
    types.push('Task');
    confidence = 0.94;
    reason = 'The item contains explicit imperative verbs or task indicators ("need to", "buy", "send", "finish").';
  } else if (isHypothetical) {
    primary = 'Future idea';
    types.push('Future idea', 'Thought');
    confidence = 0.9;
    reason = 'Contains exploratory or speculative phrasing ("what if", "maybe", "someday").';
  } else if (isQuestion) {
    primary = 'Question';
    types.push('Question', 'Thought');
    confidence = 0.92;
    reason = 'Structured as an unresolved query or strategic inquiry.';
  } else if (hasReference) {
    primary = 'Reference';
    types.push('Reference', 'Bookmark');
    confidence = 0.95;
    reason = 'Contains an external link, documentation keyword, or saved asset reference.';
  } else if (isMeeting) {
    primary = 'Meeting note';
    types.push('Meeting note', 'Communication');
    confidence = 0.91;
    reason = 'Structured around conversations, synchronizations, or group agenda notes.';
  } else if (isCode) {
    primary = 'Technical';
    types.push('Technical', 'Draft');
    confidence = 0.92;
    reason = 'Contains programming syntax, code statements, or technical specifications.';
  } else {
    primary = 'Thought';
    types.push('Thought', 'Personal');
    confidence = 0.8;
    reason = 'General spontaneous capture of unstructured thought.';
  }

  // Secondary classifications
  if (/\b(work|client|internship|office|company|boss|project)\b/i.test(lower)) types.push('Work');
  if (/\b(academic|college|university|assignment|exam|class)\b/i.test(lower)) types.push('Academic');
  if (/\b(shopping|buy|cart|order)\b/i.test(lower)) types.push('Shopping');
  if (/\b(money|budget|invoice|salary|tax)\b/i.test(lower)) types.push('Financial');
  if (/\b(react|typescript|python|api|server|frontend|backend)\b/i.test(lower)) types.push('Technical');
  if (/\b(art|music|design|animation|3d|illustration)\b/i.test(lower)) types.push('Creative');

  return {
    type: primary,
    types: Array.from(new Set(types)),
    confidence,
    reason,
  };
}

// Priority Determination
export function determinePriority(
  text: string,
  temporalBoost?: PriorityLevel
): { priority: PriorityLevel; reason?: string } {
  if (temporalBoost === 'critical') {
    return { priority: 'critical', reason: 'Smart Vent thinks this may be urgent due to immediate temporal cues.' };
  }
  if (temporalBoost === 'high') {
    return { priority: 'high', reason: 'Time-sensitive deadline detected in input.' };
  }

  const lower = text.toLowerCase();
  if (/\b(urgent|critical|blocker|emergency|breaking|immediately)\b/i.test(lower)) {
    return { priority: 'critical', reason: 'Explicit urgency language detected.' };
  }
  if (/\b(important|priority|soon|deadline|need to finish)\b/i.test(lower)) {
    return { priority: 'high', reason: 'High-significance action phrase detected.' };
  }
  if (/\b(someday|eventually|maybe|nice to have|when possible|future)\b/i.test(lower)) {
    return { priority: 'someday', reason: 'Hypothetical or indefinite timeline detected.' };
  }

  return { priority: 'medium', reason: 'Standard importance level.' };
}

// Title Generation
export function generateInferredTitle(text: string, type: VentClassification): string {
  const clean = text.replace(/[\r\n]+/g, ' ').trim();
  if (clean.length <= 60) return clean;

  // First sentence or first 60 chars
  const firstSentence = clean.split(/[.!?]/)[0].trim();
  if (firstSentence.length > 10 && firstSentence.length <= 70) {
    return firstSentence;
  }

  const words = clean.split(/\s+/);
  return words.slice(0, 9).join(' ') + '...';
}

// Project Discovery & Association
export function detectProjectLink(
  text: string,
  existingProjects: Project[]
): { projectId?: string; projectName?: string; suggestedNewProject?: string } {
  const lower = text.toLowerCase();

  // 1. Check existing projects
  for (const proj of existingProjects) {
    const projLower = proj.name.toLowerCase();
    if (lower.includes(projLower)) {
      return { projectId: proj.id, projectName: proj.name };
    }
    for (const trigger of proj.detectedKeywordTriggers) {
      if (lower.includes(trigger.toLowerCase())) {
        return { projectId: proj.id, projectName: proj.name };
      }
    }
  }

  // 2. Discover potential new project ONLY when user explicitly mentions a project keyword or tag
  const projectPatterns = [
    /(?:^|\s)project[:\s]+([a-zA-Z0-9\s-_]{3,24})/i,
    /(?:^|\s)#project\/([a-zA-Z0-9\-_]{3,24})/i,
    /(?:for|in)\s+the\s+([a-zA-Z0-9\s-_]{3,20})\s+project\b/i,
  ];

  for (const pattern of projectPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidateName = match[1].trim();
      if (candidateName.length >= 3 && candidateName.length <= 30) {
        return { suggestedNewProject: candidateName.charAt(0).toUpperCase() + candidateName.slice(1) };
      }
    }
  }

  return {};
}

// Similarity computation (Jaccard similarity on word n-grams)
export function computeSimilarityScore(textA: string, textB: string): number {
  const tokenize = (t: string) =>
    new Set(
      t
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );

  const setA = tokenize(textA);
  const setB = tokenize(textB);

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  setA.forEach((w) => {
    if (setB.has(w)) intersection++;
  });

  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

// Full Local Analysis Function
export function analyzeContentLocally(
  text: string,
  existingProjects: Project[] = []
): {
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
} {
  const classification = classifyContent(text);
  const temporal = parseTemporalInformation(text);
  const priorityInfo = determinePriority(text, temporal.priorityBoost);
  const entities = extractEntities(text);
  const tags = extractSmartTags(text, entities);
  const actionItems = extractActionItems(text);
  const title = generateInferredTitle(text, classification.type);
  const projectLink = detectProjectLink(text, existingProjects);

  return {
    title,
    type: classification.type,
    types: classification.types,
    priority: priorityInfo.priority,
    priorityReason: priorityInfo.reason,
    dueDate: temporal.dueDate,
    dateAmbiguity: temporal.ambiguousNotice,
    tags,
    entities,
    actionItems,
    classificationReason: classification.reason,
    projectId: projectLink.projectId,
    projectName: projectLink.projectName,
    suggestedNewProject: projectLink.suggestedNewProject,
    confidence: classification.confidence,
  };
}
