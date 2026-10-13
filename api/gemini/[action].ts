import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action } = req.query || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    res.status(503).json({ error: 'GEMINI_API_KEY is not configured in Vercel environment' });
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Model fallback runner: tries gemini-3.8-flash, falls back to gemini-3.1-flash-lite
  async function generateWithFallback(params: { contents: string; config: any; systemInstruction?: string }) {
    const configWithInstruction = params.systemInstruction
      ? { ...params.config, systemInstruction: params.systemInstruction }
      : params.config;

    try {
      const resp = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: params.contents,
        config: configWithInstruction,
      });
      return { text: resp.text, model: 'gemini-3.8-flash' };
    } catch (err) {
      const resp = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: params.contents,
        config: configWithInstruction,
      });
      return { text: resp.text, model: 'gemini-3.1-flash-lite' };
    }
  }

  try {
    if (action === 'unstuck') {
      const { task, blocker, makeSmallerCount = 0, availableMinutes, energyLevel, extraContext, previousAction } = req.body || {};
      const prompt = `You are ADHdo!, an intelligent productivity companion ("It's ADH-doable!").
TASK: "${task}"
BLOCKER: "${blocker}"
${availableMinutes ? `AVAILABLE TIME: ${availableMinutes} minutes` : ''}
${energyLevel ? `ENERGY LEVEL: "${energyLevel}"` : ''}
${extraContext ? `ADDITIONAL CONTEXT: "${extraContext}"` : ''}
${makeSmallerCount > 0 ? `REDUCTION LEVEL: ${makeSmallerCount}` : ''}
${previousAction ? `PREVIOUS ACTION: "${previousAction}"` : ''}

Rules:
1. Understand the exact task domain. Propose ONE specific, concrete next action directly on the task.
2. Structure output strictly according to the schema.`;

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

      res.status(200).json(JSON.parse(genResult.text?.trim() || '{}'));
      return;
    }

    if (action === 'help-start') {
      const { task, smallerFirstStep = false, availableMinutes } = req.body || {};
      const prompt = `You are ADHdo!, sequencing micro-actions for: "${task}".
${smallerFirstStep ? 'Requirement: Make Step 1 exceptionally small (under 2 minutes).' : ''}
${availableMinutes ? `Time budget: ${availableMinutes} minutes.` : ''}
Rules:
- If task is already small, flag isAlreadySmall=true.
- Otherwise give 3 to 5 concrete steps with realistic estimatedMinutes.`;

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

      res.status(200).json(JSON.parse(genResult.text?.trim() || '{}'));
      return;
    }

    if (action === 'brain-dump') {
      const { rawText } = req.body || {};
      const prompt = `Organize raw thoughts into tasks, reminders, ideas, later without fabricating deadlines or facts.
Text: """${rawText}"""`;

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

      res.status(200).json(JSON.parse(genResult.text?.trim() || '{}'));
      return;
    }

    if (action === 'adapt-day') {
      const { tasks, energyLevel, availableMinutes } = req.body || {};
      const taskSummary = Array.isArray(tasks)
        ? tasks.map((t: any) => `- [${t.id || t.title}] "${t.title}" (${t.completed ? 'Done' : 'Unfinished'}, Essential: ${t.isEssential ? 'yes' : 'no'})`).join('\n')
        : 'None';

      const prompt = `Adapt day for user with energy: "${energyLevel}". Available minutes: ${availableMinutes || 'not specified'}.\nTasks:\n${taskSummary}\nOutput oneFocusTask, realisticAdvice, tradeOffs.`;

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

      res.status(200).json(JSON.parse(genResult.text?.trim() || '{}'));
      return;
    }

    if (action === 'buddy') {
      const { messages, appContext } = req.body || {};
      const prompt = `You are ADHdo Buddy. User state: energy=${appContext?.energy}. Latest conversation: ${JSON.stringify(messages)}`;

      const genResult = await generateWithFallback({
        contents: prompt,
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

      res.status(200).json(JSON.parse(genResult.text?.trim() || '{}'));
      return;
    }

    res.status(404).json({ error: `Unknown action "${action}"` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
