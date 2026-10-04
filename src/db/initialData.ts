import { Vent, Project } from '../types/vent';

export const initialSampleProjects: Project[] = [];
export const initialSampleVents: Vent[] = [];

// Optional demo samples available on-demand if the user wants to test
export const demoShowcaseProjects: Project[] = [
  {
    id: 'proj_demo_portfolio',
    name: 'Portfolio V2',
    description: 'Personal redesign with smooth 3D canvas and case study showcases',
    status: 'active',
    isAutoDetected: true,
    detectedKeywordTriggers: ['portfolio', 'animation', 'showcase', 'redesign'],
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 2,
    itemCount: 2,
  },
];

export const demoShowcaseVents: Vent[] = [
  {
    id: 'sample_vent_1',
    originalContent: 'Buy SSD. Need to fix portfolio animation. Maybe build a finance tracker someday. Send the internship email tomorrow. Here is the API documentation link https://developer.mozilla.org',
    title: 'Multi-item dump: Hardware, Portfolio animation & Internship email',
    type: 'Task',
    types: ['Task', 'Work', 'Future idea', 'Reference'],
    status: 'organized',
    priority: 'high',
    priorityReason: 'Detected explicit tomorrow deadline for internship email & actionable items',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    source: 'text',
    confidence: 0.94,
    archived: false,
    deleted: false,
    projectId: 'proj_demo_portfolio',
    projectName: 'Portfolio V2',
    tags: ['portfolio', 'hardware', 'internship', 'reference', 'finance'],
    entities: [
      { name: 'SSD', category: 'tool', confidence: 0.95 },
      { name: 'internship email', category: 'concept', confidence: 0.9 },
      { name: 'developer.mozilla.org', category: 'url', confidence: 0.99 },
    ],
    actionItems: [
      'Buy SSD',
      'Fix portfolio animation',
      'Send internship email tomorrow',
      'Review API documentation',
    ],
    classificationReason: 'Item contains multiple actionable work requests alongside a temporal constraint ("tomorrow") and an external reference URL.',
    resurfaceDate: Date.now() + 86400000 * 3,
    resurfaceReason: 'Contains future idea "finance tracker" scheduled for low-pressure revisit',
    attachments: [],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    syncState: 'local',
    version: 1,
    aiOrigin: 'local',
    userEdited: false,
  },
  {
    id: 'sample_vent_2',
    originalContent: 'Need to finish the weatherGPT presentation before Thursday, maybe add official IMD sources, also remember to check the route safety feature and I found this PDF which might help.',
    title: 'WeatherGPT presentation prep & IMD sources',
    type: 'Task',
    types: ['Task', 'Academic', 'Document', 'Reference'],
    status: 'inbox',
    priority: 'critical',
    priorityReason: 'Impending Thursday deadline explicitly mentioned for presentation completion',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    source: 'text',
    confidence: 0.96,
    archived: false,
    deleted: false,
    tags: ['weather', 'presentation', 'research', 'urgent'],
    entities: [
      { name: 'weatherGPT', category: 'concept', confidence: 0.92 },
      { name: 'IMD', category: 'concept', confidence: 0.88 },
    ],
    actionItems: [
      'Finish weatherGPT presentation before Thursday',
      'Incorporate official IMD sources',
    ],
    classificationReason: 'Detected explicit future action ("need to finish"), milestone deliverable ("presentation"), and weekday deadline ("before Thursday").',
    attachments: [],
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
    syncState: 'local',
    version: 1,
    aiOrigin: 'local',
    userEdited: false,
  },
];
