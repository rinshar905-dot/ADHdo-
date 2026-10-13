import { 
  BlockerType, 
  UnstuckResult, 
  StepItem, 
  HelpStartResult, 
  BrainDumpCategorized, 
  AdaptDayResult, 
  Task, 
  EnergyLevel, 
  BuddyMessage 
} from '../types';
import { 
  getFallbackUnstuck, 
  getFallbackHelpStart, 
  getFallbackBrainDump, 
  getFallbackAdaptDay 
} from '../utils/aiFallbacks';

function cleanErrorMessage(raw?: string): string | undefined {
  if (!raw) return undefined;
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED') || raw.includes('Quota exceeded')) {
    return 'Free tier daily request limit reached for Gemini. Running in smart task-grounded mode.';
  }
  if (raw.includes('timed out')) {
    return 'Gemini response timed out. Using smart task-grounded mode.';
  }
  return raw.slice(0, 110);
}

export async function requestUnstuckAdvice(params: {
  task: string;
  blocker: BlockerType;
  makeSmallerCount?: number;
  availableMinutes?: number;
  energyLevel?: EnergyLevel;
  extraContext?: string;
  previousAction?: string;
}): Promise<{ result: UnstuckResult; source: 'gemini' | 'fallback'; error?: string }> {
  const { task, blocker, makeSmallerCount = 0, availableMinutes, energyLevel, extraContext, previousAction } = params;

  try {
    const res = await fetch('/api/gemini/unstuck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task,
        blocker,
        makeSmallerCount,
        availableMinutes,
        energyLevel,
        extraContext,
        previousAction,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && data.nextAction) {
      return {
        result: {
          understanding: data.understanding || "Breaking inertia step by step.",
          nextAction: data.nextAction,
          whyThisHelps: data.whyThisHelps || "Reduces the cognitive load of starting.",
          smallerAlternative: data.smallerAlternative || "Touch the tools without output.",
          followUpQuestion: data.followUpQuestion || null,
          estimatedMinutes: Number(data.estimatedMinutes) || 2,
          makeSmallerCount,
        },
        source: data._source || 'gemini',
        error: cleanErrorMessage(data._error),
      };
    }
    throw new Error('Malformed AI response from server');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    return {
      result: getFallbackUnstuck(task, blocker, makeSmallerCount, availableMinutes, energyLevel, extraContext),
      source: 'fallback',
      error: cleanErrorMessage(message),
    };
  }
}

export async function requestHelpStart(params: {
  task: string;
  smallerFirstStep?: boolean;
  availableMinutes?: number;
  preferences?: string;
}): Promise<{ result: HelpStartResult; source: 'gemini' | 'fallback'; error?: string }> {
  const { task, smallerFirstStep = false, availableMinutes, preferences } = params;

  try {
    const res = await fetch('/api/gemini/help-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, smallerFirstStep, availableMinutes, preferences }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && Array.isArray(data.steps) && data.steps.length > 0) {
      const formattedSteps: StepItem[] = data.steps.map(
        (s: { title?: string; description?: string; estimatedMinutes?: number }, idx: number) => ({
          id: `step-${Date.now()}-${idx}`,
          title: s.title || `Step ${idx + 1}`,
          description: s.description,
          estimatedMinutes: Number(s.estimatedMinutes) || 3,
          completed: false,
        })
      );

      return {
        result: {
          goal: data.goal || task,
          assumptions: Array.isArray(data.assumptions) ? data.assumptions : [],
          steps: formattedSteps,
          clarifyingQuestion: data.clarifyingQuestion || null,
          isAlreadySmall: Boolean(data.isAlreadySmall),
        },
        source: data._source || 'gemini',
        error: cleanErrorMessage(data._error),
      };
    }
    throw new Error('Malformed AI steps from server');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    return {
      result: getFallbackHelpStart(task, smallerFirstStep),
      source: 'fallback',
      error: cleanErrorMessage(message),
    };
  }
}

export async function requestBrainDumpOrganize(
  rawText: string
): Promise<{ categorized: BrainDumpCategorized; source: 'gemini' | 'fallback'; error?: string }> {
  try {
    const res = await fetch('/api/gemini/brain-dump', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && (data.tasks || data.reminders || data.ideas || data.later)) {
      const formatGroup = <T extends { title?: string; priority?: string; isEssential?: boolean; note?: string }>(
        arr: T[] | undefined,
        type: 'tasks' | 'reminders' | 'ideas' | 'later'
      ) => {
        if (!Array.isArray(arr)) return [];
        return arr.map((item, idx) => ({
          id: `bd-${type}-${Date.now()}-${idx}`,
          title: item.title || '',
          note: item.note,
          priority: (item.priority as 'high' | 'medium' | 'low') || 'medium',
          isEssential: Boolean(item.isEssential),
          selected: true,
        }));
      };

      return {
        categorized: {
          tasks: formatGroup(data.tasks, 'tasks'),
          reminders: formatGroup(data.reminders, 'reminders'),
          ideas: formatGroup(data.ideas, 'ideas'),
          later: formatGroup(data.later, 'later'),
        },
        source: data._source || 'gemini',
        error: cleanErrorMessage(data._error),
      };
    }
    throw new Error('Malformed brain dump response');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    return {
      categorized: getFallbackBrainDump(rawText),
      source: 'fallback',
      error: cleanErrorMessage(message),
    };
  }
}

export async function requestAdaptDayGuidance(
  tasks: Task[],
  energyLevel: EnergyLevel | null,
  availableMinutes?: number
): Promise<{ result: AdaptDayResult; source: 'gemini' | 'fallback'; error?: string }> {
  try {
    const res = await fetch('/api/gemini/adapt-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks, energyLevel, availableMinutes }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && data.oneFocusTask) {
      return {
        result: {
          oneFocusTask: data.oneFocusTask,
          realisticAdvice: data.realisticAdvice || 'Protect your energy and celebrate the single step.',
          tradeOffs: data.tradeOffs || 'Deferring optional tasks frees working memory for your anchor.',
          suggestedEssentialIds: Array.isArray(data.suggestedEssentialIds) ? data.suggestedEssentialIds : [],
          suggestedOptionalIds: Array.isArray(data.suggestedOptionalIds) ? data.suggestedOptionalIds : [],
        },
        source: data._source || 'gemini',
        error: cleanErrorMessage(data._error),
      };
    }
    throw new Error('Malformed adapt day response');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    return {
      result: getFallbackAdaptDay(tasks, energyLevel, availableMinutes),
      source: 'fallback',
      error: cleanErrorMessage(message),
    };
  }
}

export async function requestBuddyChat(
  messages: BuddyMessage[],
  appContext: { tasks: Task[]; energy: EnergyLevel | null; activeTimerTask?: string }
): Promise<{ reply: string; actionSuggestion?: any; source: 'gemini' | 'fallback'; error?: string }> {
  try {
    const res = await fetch('/api/gemini/buddy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, appContext }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && data.reply) {
      return {
        reply: data.reply,
        actionSuggestion: data.actionSuggestion,
        source: data._source || 'gemini',
        error: cleanErrorMessage(data._error),
      };
    }
    throw new Error('Malformed Buddy chat response');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    const lastUserMsg = messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '';
    
    // Deterministic fallback for Buddy chat
    let reply = "I'm right here with you! Let's find the smallest doable piece together.";
    if (lastUserMsg.toLowerCase().includes('smaller')) {
      reply = "Let's slice it down to 60 seconds: what is the single tool or tab you need to open first? You don't have to work on it yet.";
    } else if (lastUserMsg.toLowerCase().includes('what should i do')) {
      const unfinished = appContext.tasks.filter((t) => !t.completed);
      const essential = unfinished.find((t) => t.isEssential) || unfinished[0];
      if (essential) {
        reply = `Looking at your day, "${essential.title}" is your anchor. Want to launch a 5-minute focus burst on it?`;
      } else {
        reply = "You don't have any unfinished tasks right now! Take a breath, or write a quick thought into Brain Dump.";
      }
    }

    return {
      reply,
      source: 'fallback',
      error: cleanErrorMessage(message),
    };
  }
}
