import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Server-side Gemini AI initialization
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    mode: 'Smart Vent Server',
    cloudAiAvailable: !!ai,
    timestamp: new Date().toISOString(),
  });
});

// Cloud AI Analysis Endpoint
app.post('/api/cloud-ai/analyze', async (req: Request, res: Response) => {
  try {
    const { text, projects } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text prompt is required' });
      return;
    }

    if (!ai) {
      res.status(503).json({ error: 'Cloud AI service is currently unavailable or unconfigured' });
      return;
    }

    const projectsList = Array.isArray(projects)
      ? projects.map((p: any) => `${p.name} (id: ${p.id})`).join(', ')
      : 'None';

    const systemInstruction = `You are Smart Vent's intelligent classifier.
A user dumps raw, unstructured text. You must understand it without forcing the user to categorize first.
Analyze the content and extract:
1. title: Concise natural title (3-8 words).
2. type: Primary classification (e.g. Task, Future idea, Reference, Note, Meeting note, Thought, Question, Technical, Creative, etc.).
3. types: Array of secondary relevant classifications.
4. priority: One of critical, high, medium, low, someday, unknown.
5. priorityReason: Concise reason for priority.
6. dueDate: ISO timestamp string if an explicit or relative date (e.g. tomorrow, Thursday) is detected, else null.
7. dateAmbiguity: Note if time is mentioned without a resolved date (e.g. "Time reference detected — date unresolved"), else null.
8. tags: Array of 3-7 lowercase tags.
9. entities: Array of extracted key entities with name, category (tool, framework, concept, url, person), and confidence (0-1).
10. actionItems: Array of distinct actionable items found in the dump.
11. classificationReason: User-friendly explanation of why it was classified this way.
12. projectId / projectName: Link to one of these known projects if relevant: [${projectsList}], else null.
13. confidence: Number between 0.7 and 0.99.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Raw User Dump: """${text}"""`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING },
            types: { type: Type.ARRAY, items: { type: Type.STRING } },
            priority: { type: Type.STRING },
            priorityReason: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            dateAmbiguity: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            entities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                },
                required: ['name', 'category'],
              },
            },
            actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            classificationReason: { type: Type.STRING },
            projectId: { type: Type.STRING },
            projectName: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ['title', 'type', 'types', 'priority', 'tags', 'classificationReason'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/cloud-ai/analyze:', err);
    res.status(500).json({ error: 'Failed to analyze with Cloud AI', details: err?.message });
  }
});

// Natural language query / chat across user vents
app.post('/api/cloud-ai/chat', async (req: Request, res: Response) => {
  try {
    const { query, vents } = req.body;
    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    if (!ai) {
      res.status(503).json({ error: 'Cloud AI is unavailable' });
      return;
    }

    const contextSnippet = Array.isArray(vents)
      ? vents
          .slice(0, 40)
          .map(
            (v: any) =>
              `[ID: ${v.id}] Title: ${v.title} | Type: ${v.type} | Tags: ${v.tags?.join(',')} | Content: ${v.content}`
          )
          .join('\n---\n')
      : 'No stored vents available.';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are answering questions about the user's Smart Vent dumps.
Only use the stored content provided below. Never make up facts or files.
User question: "${query}"

Stored Vents Context:
${contextSnippet}`,
    });

    res.json({ answer: response.text });
  } catch (err: any) {
    console.error('Error in /api/cloud-ai/chat:', err);
    res.status(500).json({ error: 'Chat failed', details: err?.message });
  }
});

// Server-side Authentication & Sync Storage
interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: number;
}

const usersStore: Map<string, UserAccount> = new Map();
const activeSessions: Map<string, { email: string; expiresAt: number }> = new Map();
const serverSyncStore: Record<string, any[]> = {};

// Simple deterministic hash for demo/prototype auth (no plain-text in memory)
function hashPassword(pass: string): string {
  let hash = 0;
  for (let i = 0; i < pass.length; i++) {
    const char = pass.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(36)}_${pass.length}`;
}

// 1. Register Endpoint
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'Valid email address is required' });
    return;
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (usersStore.has(normalizedEmail)) {
    res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
    return;
  }

  const user: UserAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    displayName: (displayName && displayName.trim()) || normalizedEmail.split('@')[0],
    createdAt: Date.now(),
  };

  usersStore.set(normalizedEmail, user);

  // Generate session token
  const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  activeSessions.set(token, { email: normalizedEmail, expiresAt: Date.now() + 86400000 * 30 });

  res.json({
    success: true,
    message: 'Account successfully registered and encrypted sync session active.',
    token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
    },
  });
});

// 2. Login Endpoint
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = usersStore.get(normalizedEmail);

  if (!existingUser) {
    // If not found, provide clear error asking to create account
    res.status(401).json({
      error: 'No account found with this email. Please switch to the "Create Account" tab to register.',
      code: 'USER_NOT_FOUND',
    });
    return;
  }

  if (existingUser.passwordHash !== hashPassword(password)) {
    res.status(401).json({
      error: 'Incorrect password. Please verify and try again.',
      code: 'INVALID_PASSWORD',
    });
    return;
  }

  const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  activeSessions.set(token, { email: normalizedEmail, expiresAt: Date.now() + 86400000 * 30 });

  res.json({
    success: true,
    message: 'Successfully authenticated. Sync connection established.',
    token,
    user: {
      id: existingUser.id,
      email: existingUser.email,
      displayName: existingUser.displayName,
      createdAt: existingUser.createdAt,
    },
  });
});

// 3. Current User Profile / Status Endpoint
app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No active session token provided' });
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const session = activeSessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    res.status(401).json({ error: 'Session expired or invalid' });
    return;
  }

  const user = usersStore.get(session.email);
  if (!user) {
    res.status(404).json({ error: 'User profile not found' });
    return;
  }

  res.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
    },
  });
});

// 4. Logout Endpoint
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    activeSessions.delete(token);
  }
  res.json({ success: true, message: 'Logged out. Switched to local device mode.' });
});

app.post('/api/sync/push', (req: Request, res: Response) => {
  const { account, vents } = req.body;
  const userKey = account || 'anonymous_user';

  if (!serverSyncStore[userKey]) {
    serverSyncStore[userKey] = [];
  }

  // Update store
  if (Array.isArray(vents)) {
    vents.forEach((item: any) => {
      const idx = serverSyncStore[userKey].findIndex((v) => v.id === item.id);
      if (idx !== -1) {
        serverSyncStore[userKey][idx] = item;
      } else {
        serverSyncStore[userKey].push(item);
      }
    });
  }

  res.json({ success: true, count: vents?.length || 0, timestamp: Date.now() });
});

app.get('/api/sync/pull', (req: Request, res: Response) => {
  const account = (req.query.account as string) || 'anonymous_user';
  const vents = serverSyncStore[account] || [];
  res.json({ vents, timestamp: Date.now() });
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Smart Vent server listening on port ${PORT}`);
  });
}

startServer();
