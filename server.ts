import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { 
  getFallbackUnstuck, 
  getFallbackHelpStart, 
  getFallbackBrainDump, 
  getFallbackAdaptDay 
} from './src/utils/aiFallbacks';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Timeout helper so API calls never hang indefinitely
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 8500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API request timed out after 8.5s')), timeoutMs)
    ),
  ]);
}

// Format error messages cleanly (prevents dumping raw JSON to users)
function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota exceeded')) {
      return 'Free tier daily request limit reached for Gemini. Running in smart offline mode.';
    }
    if (msg.includes('timed out')) {
      return 'Gemini response timed out. Using smart offline engine.';
    }
    return msg.slice(0, 120);
  }
  return 'AI service temporarily unavailable. Using smart offline engine.';
}

// Model fallback executor: tries gemini-3.8-flash first; if 429 quota exhausted, falls back to gemini-3.1-flash-lite
async function generateWithFallback(params: {
  contents: string;
  config: any;
  systemInstruction?: string;
}): Promise<{ text?: string; modelUsed: string }> {
  if (!ai) throw new Error('Gemini API key not configured');

  const configWithInstruction = params.systemInstruction
    ? { ...params.config, systemInstruction: params.systemInstruction }
    : params.config;

  // Attempt 1: gemini-3.8-flash
  try {
    const res = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: params.contents,
        config: configWithInstruction,
      }),
      8500
    );
    return { text: res.text, modelUsed: 'gemini-3.8-flash' };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[Gemini 3.8 Flash attempt failed]:`, errMsg);

    // If quota error (429) or failure, try gemini-3.1-flash-lite
    try {
      console.log(`[Switching to model fallback]: gemini-3.1-flash-lite`);
      const fallbackRes = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: params.contents,
          config: configWithInstruction,
        }),
        8500
      );
      return { text: fallbackRes.text, modelUsed: 'gemini-3.1-flash-lite' };
    } catch (fallbackErr: unknown) {
      const secondMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      console.warn(`[Gemini 3.1 Flash Lite attempt also failed]:`, secondMsg);
      throw fallbackErr;
    }
  }
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(ai),
    timestamp: Date.now(),
  });
});

// 1. Unstuck Mode Endpoint
app.post('/api/gemini/unstuck', async (req: Request, res: Response) => {
  const { 
    task, 
    blocker, 
    makeSmallerCount = 0, 
    availableMinutes, 
    energyLevel, 
    extraContext, 
    previousAction 
  } = req.body;

  if (!task || typeof task !== 'string') {
    res.status(400).json({ error: 'Task is required' });
    return;
  }

  if (ai) {
    try {
      const prompt = `You are ADHdo!, an intelligent, context-aware productivity companion with the tagline "It's ADH-doable!".
A user is experiencing task friction. Analyze their inputs deeply:

TASK: "${task}"
BLOCKER: "${blocker}"
${availableMinutes ? `AVAILABLE TIME: ${availableMinutes} minutes` : ''}
${energyLevel ? `ENERGY LEVEL: "${energyLevel}"` : ''}
${extraContext ? `ADDITIONAL CONTEXT: "${extraContext}"` : ''}
${makeSmallerCount > 0 ? `REDUCTION LEVEL: ${makeSmallerCount} (User already tried a step and needs an even smaller micro-action)` : ''}
${previousAction ? `PREVIOUS PROPOSED ACTION (FOUND TOO DEMANDING): "${previousAction}"` : ''}

REASONING RULES:
1. Understand the exact subject matter and physical/cognitive nature of "${task}".
2. The selected blocker MUST fundamentally shape your advice:
   - "cant-start": The obstacle is the threshold of starting. Suggest a concrete step to enter the environment (e.g. find the file, read requirement #1) with ZERO requirement to produce final output yet.
   - "overwhelmed": The obstacle is cognitive crowding. Isolate ONE single conceptual slice (e.g. learn difference between PDA and FA; or answer 1 short question). Instruct them explicitly to ignore the rest of the syllabus or scope.
   - "distracted": The obstacle is losing the mental thread. Guide them to reorient by looking at the last completed artifact without shame.
   - "running-out-of-time": The obstacle is panic paralysis. Cut scope to the single minimum viable deliverable. If available time is tight (e.g. 20-30 min), fit within that container.
   - "no-energy": Low battery. Propose a low-cognitive motor step or a brief guilt-free rest.
3. "nextAction": ONE immediate, concrete action directly on the task that can be started right now.
4. "smallerAlternative": An even easier fallback if they still hesitate.
5. "whyThisHelps": 1 clear sentence explaining why this micro-action specifically addresses the blocker.
6. "followUpQuestion": At most ONE focused question if critical info is missing, or null if sufficient info exists.
7. Output JSON matching the schema.`;

      const genResult = await generateWithFallback({
        contents: prompt,
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              understanding: { type: Type.STRING },
              nextAction: { type: Type.STRING },
              whyThisHelps: { type: Type.STRING },
              smallerAlternative: { type: Type.STRING },
              followUpQuestion: { type: Type.STRING, nullable: true },
              estimatedMinutes: { type: Type.NUMBER },
            },
            required: ['understanding', 'nextAction', 'whyThisHelps', 'smallerAlternative', 'estimatedMinutes'],
          },
        },
      });

      const parsed = JSON.parse(genResult.text?.trim() || '{}');
      res.json({ ...parsed, _source: 'gemini', _model: genResult.modelUsed });
      return;
    } catch (error: unknown) {
      const cleanMessage = formatErrorMessage(error);
      console.warn('Gemini Unstuck call failed, using grounded fallback:', cleanMessage);
      const fallback = getFallbackUnstuck(task, blocker, makeSmallerCount, availableMinutes, energyLevel, extraContext);
      res.json({ ...fallback, _source: 'fallback', _error: cleanMessage });
      return;
    }
  }

  const fallback = getFallbackUnstuck(task, blocker, makeSmallerCount, availableMinutes, energyLevel, extraContext);
  res.json({ ...fallback, _source: 'fallback', _error: 'Gemini API key not configured' });
});

// 2. Help Me Start Endpoint
app.post('/api/gemini/help-start', async (req: Request, res: Response) => {
  const { task, smallerFirstStep = false, availableMinutes, preferences } = req.body;

  if (!task || typeof task !== 'string') {
    res.status(400).json({ error: 'Task is required' });
    return;
  }

  if (ai) {
    try {
      const prompt = `You are ADHdo!, an expert at turning intimidating or vague tasks into clear, executable micro-actions.

USER GOAL: "${task}"
${smallerFirstStep ? 'SPECIAL REQUIREMENT: Step 1 must be exceptionally small (under 2 minutes, pure setup or 1 single item).' : ''}
${availableMinutes ? `TIME BUDGET: ${availableMinutes} minutes` : ''}
${preferences ? `PREFERENCES: "${preferences}"` : ''}

REASONING RULES:
1. Is the task ALREADY small and immediately actionable (e.g. "take out the trash", "drink a glass of water")?
   - If YES, set "isAlreadySmall" to true, and output 1-2 simple steps.
2. If the task is substantial or vague (e.g. "Prepare for my Java OOP exam", "Clean the apartment"):
   - Transform it into 3 to 5 concrete sequential steps.
   - Ground steps in real task domain (e.g. for Java OOP: 1. Gather syllabus & questions, 2. Pick first topic, 3. Read one example program, 4. Run/trace program, 5. Answer one question without notes).
   - Step 1 must be immediately executable without preliminary dread.
   - Include realistic estimatedMinutes for each step.
   - If the task is ambiguous, state a reasonable assumption in "assumptions" or provide one short "clarifyingQuestion" (otherwise null).
3. Output pure JSON matching the schema.`;

      const genResult = await generateWithFallback({
        contents: prompt,
        config: {
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              goal: { type: Type.STRING },
              assumptions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              isAlreadySmall: { type: Type.BOOLEAN },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    estimatedMinutes: { type: Type.NUMBER },
                  },
                  required: ['title', 'estimatedMinutes'],
                },
              },
              clarifyingQuestion: { type: Type.STRING, nullable: true },
            },
            required: ['goal', 'steps'],
          },
        },
      });

      const parsed = JSON.parse(genResult.text?.trim() || '{}');
      res.json({ ...parsed, _source: 'gemini', _model: genResult.modelUsed });
      return;
    } catch (error: unknown) {
      const cleanMessage = formatErrorMessage(error);
      console.warn('Gemini Help-Start call failed, using grounded fallback:', cleanMessage);
      const fallback = getFallbackHelpStart(task, smallerFirstStep);
      res.json({ ...fallback, _source: 'fallback', _error: cleanMessage });
      return;
    }
  }

  const fallback = getFallbackHelpStart(task, smallerFirstStep);
  res.json({ ...fallback, _source: 'fallback', _error: 'Gemini API key not configured' });
});

// 3. Brain Dump Endpoint
app.post('/api/gemini/brain-dump', async (req: Request, res: Response) => {
  const { rawText } = req.body;

  if (!rawText || typeof rawText !== 'string') {
    res.status(400).json({ error: 'Raw text is required' });
    return;
  }

  if (ai) {
    try {
      const prompt = `You are ADHdo!, untangling a user's brain dump without altering their intentions.
RAW TEXT:
"""
${rawText}
"""

REASONING RULES:
1. Preserve the user's authentic meaning.
2. NEVER invent tasks, commitments, names, or deadlines that were not in the user's text.
3. Preserve uncertainty! If the user says "maybe learn guitar", keep it as an idea or later item.
4. Distinguish 4 categories: tasks, reminders, ideas, later.
5. Output pure JSON matching schema.`;

      const genResult = await generateWithFallback({
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    isEssential: { type: Type.BOOLEAN },
                  },
                  required: ['title', 'priority', 'isEssential'],
                },
              },
              reminders: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    note: { type: Type.STRING },
                  },
                  required: ['title'],
                },
              },
              ideas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    note: { type: Type.STRING },
                  },
                  required: ['title'],
                },
              },
              later: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    note: { type: Type.STRING },
                  },
                  required: ['title'],
                },
              },
            },
            required: ['tasks', 'reminders', 'ideas', 'later'],
          },
        },
      });

      const parsed = JSON.parse(genResult.text?.trim() || '{}');
      res.json({ ...parsed, _source: 'gemini', _model: genResult.modelUsed });
      return;
    } catch (error: unknown) {
      const cleanMessage = formatErrorMessage(error);
      console.warn('Gemini Brain-Dump call failed, using grounded fallback:', cleanMessage);
      const fallback = getFallbackBrainDump(rawText);
      res.json({ ...fallback, _source: 'fallback', _error: cleanMessage });
      return;
    }
  }

  const fallback = getFallbackBrainDump(rawText);
  res.json({ ...fallback, _source: 'fallback', _error: 'Gemini API key not configured' });
});

// 4. Adapt My Day Endpoint
app.post('/api/gemini/adapt-day', async (req: Request, res: Response) => {
  const { tasks, energyLevel, availableMinutes } = req.body;

  if (ai) {
    try {
      const taskSummary = Array.isArray(tasks)
        ? tasks.map((t: { id?: string; title: string; isEssential?: boolean; priority?: string; completed?: boolean; deadline?: string }) => 
            `[ID: ${t.id || t.title}] "${t.title}" (${t.completed ? 'COMPLETED' : 'UNFINISHED'}, Priority: ${t.priority || 'medium'}, Essential: ${t.isEssential ? 'yes' : 'no'}${t.deadline ? `, Deadline: ${t.deadline}` : ''})`
          ).join('\n')
        : 'None';

      const prompt = `You are ADHdo!, a practical replanning assistant.
CONTEXT:
Energy level: "${energyLevel || 'doing okay'}"
${availableMinutes ? `Available time remaining: ${availableMinutes} minutes` : ''}
Current task list:
${taskSummary}

REASONING RULES:
1. Identify ONE single task the user should commit to first (oneFocusTask).
2. Consider urgency, energy level, and user-defined priority.
3. Explain the key trade-off briefly in "tradeOffs".
4. Provide practical, grounded advice in "realisticAdvice".
5. List suggestedEssentialIds and suggestedOptionalIds.
6. Output pure JSON matching schema.`;

      const genResult = await generateWithFallback({
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              oneFocusTask: { type: Type.STRING },
              realisticAdvice: { type: Type.STRING },
              tradeOffs: { type: Type.STRING },
              suggestedEssentialIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              suggestedOptionalIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['oneFocusTask', 'realisticAdvice', 'tradeOffs'],
          },
        },
      });

      const parsed = JSON.parse(genResult.text?.trim() || '{}');
      res.json({ ...parsed, _source: 'gemini', _model: genResult.modelUsed });
      return;
    } catch (error: unknown) {
      const cleanMessage = formatErrorMessage(error);
      console.warn('Gemini Adapt-Day call failed, using grounded fallback:', cleanMessage);
      const fallback = getFallbackAdaptDay(tasks, energyLevel, availableMinutes);
      res.json({ ...fallback, _source: 'fallback', _error: cleanMessage });
      return;
    }
  }

  const fallback = getFallbackAdaptDay(tasks, energyLevel, availableMinutes);
  res.json({ ...fallback, _source: 'fallback', _error: 'Gemini API key not configured' });
});

// 5. ADHdo Buddy Multi-Turn Chat Endpoint
app.post('/api/gemini/buddy', async (req: Request, res: Response) => {
  const { messages, appContext } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required' });
    return;
  }

  const latestMessage = messages[messages.length - 1]?.content || '';

  if (ai) {
    try {
      const taskOverview = appContext?.tasks
        ? appContext.tasks.map((t: any) => `- "${t.title}" (${t.completed ? 'Done' : 'Unfinished'}, ${t.isEssential ? 'Essential' : 'Optional'})`).join('\n')
        : 'None';

      const systemInstruction = `You are ADHdo Buddy, a supportive, witty, and grounded productivity companion with the tagline "It's ADH-doable!".
CURRENT USER STATE:
- Energy: ${appContext?.energy || 'Not checked in yet'}
- Tasks in My Day:
${taskOverview}
${appContext?.activeTimerTask ? `- Active Timer: focusing on "${appContext.activeTimerTask}"` : ''}

CONVERSATION RULES:
1. Always maintain multi-turn context. Understand references like "make that smaller", "what should I do next?", or "I got stuck on that".
2. Focus on the user's LATEST message rather than re-answering previous prompts.
3. Be practical, warm, and concise. No generic therapeutic cheerleading.
4. Guide users into existing ADHdo! tools when appropriate (Unstuck Mode, Help Me Start, Focus Timer, Brain Dump).
5. If the user wants to take an action, you can suggest a concrete in-app action in actionSuggestion:
   { type: 'create_task' | 'start_timer' | 'open_unstuck' | 'open_help_start', label: '...', payload: ... }
6. Never falsely claim you have already updated their database or started a timer. Propose the action cleanly.`;

      const prompt = `Conversation history:
${messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

Respond as ADHdo Buddy to the user's latest message: "${latestMessage}".
Output pure JSON matching the schema.`;

      const genResult = await generateWithFallback({
        contents: prompt,
        systemInstruction,
        config: {
          temperature: 0.4,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              actionSuggestion: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  label: { type: Type.STRING },
                  payload: { type: Type.STRING },
                },
                nullable: true,
              },
            },
            required: ['reply'],
          },
        },
      });

      const parsed = JSON.parse(genResult.text?.trim() || '{}');
      res.json({ ...parsed, _source: 'gemini', _model: genResult.modelUsed });
      return;
    } catch (error: unknown) {
      const cleanMessage = formatErrorMessage(error);
      console.warn('Gemini Buddy call failed, using grounded fallback:', cleanMessage);
    }
  }

  // Grounded fallback response for Buddy
  let reply = "I'm right here with you! Let's find the smallest doable piece together.";
  let actionSuggestion: any = null;

  if (latestMessage.toLowerCase().includes('smaller')) {
    reply = "Let's slice it down to 60 seconds: what is the single tool, document, or tab you need to open first? You don't have to work on it yet.";
  } else if (latestMessage.toLowerCase().includes('what should i do')) {
    const unfinished = appContext?.tasks?.filter((t: any) => !t.completed) || [];
    const essential = unfinished.find((t: any) => t.isEssential) || unfinished[0];
    if (essential) {
      reply = `Looking at your day, "${essential.title}" is your anchor. Want to launch a 5-minute focus burst on it?`;
      actionSuggestion = {
        type: 'start_timer',
        label: `Start 5m on "${essential.title}"`,
        payload: essential.title,
      };
    } else {
      reply = "You don't have any unfinished tasks right now! Take a breath, or write a quick thought into Brain Dump.";
    }
  } else if (latestMessage.toLowerCase().includes('presentation') || latestMessage.toLowerCase().includes('essay')) {
    reply = "Big creative projects trigger huge resistance. What if you just open the document and name the title file? No writing required yet.";
    actionSuggestion = {
      type: 'open_unstuck',
      label: 'Open Unstuck Mode for this',
      payload: latestMessage,
    };
  }

  res.json({
    reply,
    actionSuggestion,
    _source: 'fallback',
    _error: 'Gemini API in smart offline mode',
  });
});

// Mount Vite or static server
async function setupApp() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ADHdo!] Server running on http://0.0.0.0:${PORT}`);
  });
}

setupApp().catch((err) => {
  console.error('Failed to start server:', err);
});
