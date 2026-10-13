import { BlockerType, UnstuckResult, StepItem, HelpStartResult, BrainDumpCategorized, AdaptDayResult, Task, EnergyLevel } from '../types';

export function getFallbackUnstuck(
  task: string,
  blocker: BlockerType,
  makeSmallerCount: number = 0,
  availableMinutes?: number,
  energyLevel?: EnergyLevel,
  extraContext?: string
): UnstuckResult {
  const cleanTask = task.trim() || 'this task';
  const timeNote = availableMinutes ? `within your ${availableMinutes} minutes available` : '';

  if (makeSmallerCount > 0) {
    if (makeSmallerCount === 1) {
      return {
        understanding: `Taking the initial step on "${cleanTask}" is still causing high cognitive friction.`,
        nextAction: `Simply open the program, file, or physical spot for "${cleanTask}" and do only 60 seconds of setup. You have full permission to close it after minute one.`,
        whyThisHelps: "Reducing commitment to 60 seconds bypasses the amygdala's task-avoidance alarm.",
        smallerAlternative: `Touch the keyboard, book, or work area for 10 slow breaths without typing or reading anything.`,
        followUpQuestion: null,
        estimatedMinutes: 1,
        makeSmallerCount: 1,
      };
    } else {
      return {
        understanding: `Even setup feels too demanding right now. Let's make it microscopic.`,
        nextAction: `Just glance at where "${cleanTask}" takes place. Put your hands on the desk, notebook, or tools and drink a sip of water.`,
        whyThisHelps: "Physical presence without expectation of output breaks avoidance with zero pressure.",
        smallerAlternative: `Close your eyes for 30 seconds and acknowledge that showing up is already a success.`,
        followUpQuestion: null,
        estimatedMinutes: 1,
        makeSmallerCount,
      };
    }
  }

  switch (blocker) {
    case 'cant-start':
      return {
        understanding: `Your working memory is anticipating the full weight of "${cleanTask}" rather than just the initiation threshold.`,
        nextAction: `Open the exact workspace or document for "${cleanTask}". Find the very first line or requirement, and write or read only that single item.`,
        whyThisHelps: "Task initiation requires entering the environment before applying cognitive effort.",
        smallerAlternative: `Locate the relevant file, tab, or tool without starting the actual work yet.`,
        followUpQuestion: extraContext ? null : `Do you already have the file or tool open, or do you need to open it first?`,
        estimatedMinutes: 2,
        makeSmallerCount: 0,
      };

    case 'overwhelmed':
      return {
        understanding: `"${cleanTask}" contains multiple hidden decisions competing for attention simultaneously.`,
        nextAction: availableMinutes && availableMinutes <= 20
          ? `With only ${availableMinutes} minutes, ignore the full scope. Pick only the most accessible 10-minute slice of "${cleanTask}" and stop there.`
          : `Isolate just the very first physical component of "${cleanTask}". Disregard everything that comes after step one.`,
        whyThisHelps: "Constraining scope to a single tangible piece halts cognitive overload.",
        smallerAlternative: `Write down on scrap paper the single part of "${cleanTask}" you are most sure about.`,
        followUpQuestion: null,
        estimatedMinutes: Math.min(5, availableMinutes || 5),
        makeSmallerCount: 0,
      };

    case 'distracted':
      return {
        understanding: `Attention drifted away from "${cleanTask}". Regaining momentum is about gentle reorientation, not discipline.`,
        nextAction: `Close or minimize the distracting window or app. Look back at the last thing you completed in "${cleanTask}" and reread it once.`,
        whyThisHelps: "Re-reading the last state reactivates relevant mental schema without asking for new output.",
        smallerAlternative: `Leave a 1-sentence note of where you were before looking away.`,
        followUpQuestion: null,
        estimatedMinutes: 2,
        makeSmallerCount: 0,
      };

    case 'running-out-of-time':
      return {
        understanding: `Time pressure on "${cleanTask}" is inducing panic paralysis. Perfection is off the table; we want a minimum viable deliverable.`,
        nextAction: `Strip "${cleanTask}" down to its core requirement. Complete only the highest-priority section needed to make it acceptable.`,
        whyThisHelps: "Shifting from 'perfect' to 'done enough to submit' relieves panic and unlocks execution.",
        smallerAlternative: `Draft an outline or skeleton of the deliverable so you have a tangible draft.`,
        followUpQuestion: availableMinutes ? null : `How many minutes do you realistically have right now?`,
        estimatedMinutes: Math.min(10, availableMinutes || 10),
        makeSmallerCount: 0,
      };

    case 'no-energy':
      return {
        understanding: `Physical or mental depletion means analytical problem-solving on "${cleanTask}" will encounter immediate resistance.`,
        nextAction: `Drink a glass of water, lean back, and do only the lowest-brainpower administrative task related to "${cleanTask}" (like organizing a folder or formatting a title).`,
        whyThisHelps: "Low-cognitive motor tasks sustain contact with the goal without draining mental reserves.",
        smallerAlternative: `Set a 10-minute timer to rest with zero guilt before making another attempt.`,
        followUpQuestion: null,
        estimatedMinutes: 2,
        makeSmallerCount: 0,
      };
  }
}

export function getFallbackHelpStart(task: string, smallerFirstStep: boolean = false): HelpStartResult {
  const cleanTask = task.trim() || 'your goal';

  // Check if task is already small and concrete
  const words = cleanTask.split(' ');
  const isTrivial = words.length <= 6 && (
    cleanTask.toLowerCase().includes('trash') ||
    cleanTask.toLowerCase().includes('water') ||
    cleanTask.toLowerCase().includes('call') ||
    cleanTask.toLowerCase().includes('email') ||
    cleanTask.toLowerCase().includes('stretch') ||
    cleanTask.toLowerCase().includes('breathe') ||
    cleanTask.toLowerCase().includes('wipe')
  );

  if (isTrivial) {
    return {
      goal: cleanTask,
      assumptions: ['This task is already compact and directly actionable.'],
      steps: [
        {
          id: 'step-1',
          title: `Do the action now: "${cleanTask}"`,
          description: 'This is already small enough to complete in one quick motion.',
          estimatedMinutes: 2,
          completed: false,
        },
      ],
      clarifyingQuestion: null,
      isAlreadySmall: true,
    };
  }

  // Domain specific patterns for realistic demonstration
  const lower = cleanTask.toLowerCase();

  if (lower.includes('java') || lower.includes('code') || lower.includes('program') || lower.includes('assignment')) {
    return {
      goal: cleanTask,
      assumptions: ['You have your IDE or code environment installed.'],
      steps: [
        {
          id: 'step-1',
          title: 'Open the project and read the first requirement',
          description: 'Do not write any code yet. Just locate the file or class and read requirement #1.',
          estimatedMinutes: 2,
          completed: false,
        },
        {
          id: 'step-2',
          title: 'Declare the main class or function skeleton',
          description: 'Set up the basic method signature or imports without implementing logic.',
          estimatedMinutes: 5,
          completed: false,
        },
        {
          id: 'step-3',
          title: 'Implement logic for just the first test case or requirement',
          description: 'Write the simplest code that satisfies the first condition.',
          estimatedMinutes: 10,
          completed: false,
        },
        {
          id: 'step-4',
          title: 'Run or compile to check for immediate output',
          description: 'Verify execution without worrying about edge cases yet.',
          estimatedMinutes: 3,
          completed: false,
        },
      ],
      clarifyingQuestion: null,
      isAlreadySmall: false,
    };
  }

  if (lower.includes('exam') || lower.includes('study') || lower.includes('test') || lower.includes('quiz')) {
    return {
      goal: cleanTask,
      assumptions: ['You have access to notes, textbook, or syllabus.'],
      steps: [
        {
          id: 'step-1',
          title: 'Open syllabus and select exactly ONE topic',
          description: 'Do not study yet. Pick one specific concept (e.g. one theorem or chapter subsection).',
          estimatedMinutes: 2,
          completed: false,
        },
        {
          id: 'step-2',
          title: 'Read one definition or example for that topic for 5 minutes',
          description: 'Read with a timer. When the timer sounds, stop reading.',
          estimatedMinutes: 5,
          completed: false,
        },
        {
          id: 'step-3',
          title: 'Answer or trace one short practice question',
          description: 'Test your understanding on one specific problem without looking at the solution.',
          estimatedMinutes: 8,
          completed: false,
        },
        {
          id: 'step-4',
          title: 'Check the answer and jot down any gap',
          description: 'Close this study block with a concrete record of what you covered.',
          estimatedMinutes: 3,
          completed: false,
        },
      ],
      clarifyingQuestion: null,
      isAlreadySmall: false,
    };
  }

  return {
    goal: cleanTask,
    assumptions: ['Targeting the minimum initial sequence to overcome inertia.'],
    steps: [
      {
        id: 'step-1',
        title: smallerFirstStep ? `Gather materials for "${cleanTask}"` : `Open the workspace for "${cleanTask}"`,
        description: 'Set up the tools or environment. No performance required.',
        estimatedMinutes: 2,
        completed: false,
      },
      {
        id: 'step-2',
        title: `Work on the very first sub-part for 5 minutes`,
        description: 'Set a 5-minute container. Give yourself permission to pause when done.',
        estimatedMinutes: 5,
        completed: false,
      },
      {
        id: 'step-3',
        title: `Review progress and define the next milestone`,
        description: 'Anchor the momentum while the context is fresh.',
        estimatedMinutes: 3,
        completed: false,
      },
    ],
    clarifyingQuestion: null,
    isAlreadySmall: false,
  };
}

export function getFallbackBrainDump(rawText: string): BrainDumpCategorized {
  const lines = rawText
    .split(/\r?\n|;|\./)
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  const categorized: BrainDumpCategorized = {
    tasks: [],
    reminders: [],
    ideas: [],
    later: [],
  };

  lines.forEach((line, idx) => {
    const lower = line.toLowerCase();
    const id = `bd-${Date.now()}-${idx}`;

    if (lower.startsWith('idea') || lower.includes('maybe ') || lower.includes('what if') || lower.includes('could ') || lower.includes('concept')) {
      categorized.ideas.push({ id, title: line.replace(/^(idea:?|maybe)\s*/i, ''), note: 'Preserved as exploratory idea', selected: true });
    } else if (lower.startsWith('remind') || lower.includes('remember to') || lower.includes("don't forget") || lower.includes('appointment')) {
      categorized.reminders.push({ id, title: line.replace(/^(remind(er)?:?|remember to)\s*/i, ''), selected: true });
    } else if (lower.includes('someday') || lower.includes('later') || lower.includes('future') || lower.includes('eventually') || lower.includes('worry')) {
      categorized.later.push({ id, title: line.replace(/^(later:?|someday)\s*/i, ''), note: 'Deferred to protect current focus', selected: true });
    } else {
      const isUrgent = lower.includes('urgent') || lower.includes('asap') || lower.includes('must') || lower.includes('today');
      categorized.tasks.push({
        id,
        title: line.replace(/^(todo:?|task:?)\s*/i, ''),
        priority: isUrgent ? 'high' : 'medium',
        isEssential: isUrgent,
        selected: true,
      });
    }
  });

  return categorized;
}

export function getFallbackAdaptDay(
  tasks: Task[],
  energyLevel: EnergyLevel | null,
  availableMinutes?: number
): AdaptDayResult {
  const unfinished = tasks.filter((t) => !t.completed);
  const essentials = unfinished.filter((t) => t.isEssential);
  const topTask = essentials[0] || unfinished[0];

  const oneFocusTask = topTask ? topTask.title : 'Take a moment to ground and reset.';
  
  let realisticAdvice = 'Focus on one non-negotiable task and let the rest wait safely.';
  let tradeOffs = 'By deferring optional items, you preserve cognitive bandwidth for what truly matters.';

  if (energyLevel === 'empty' || energyLevel === 'low') {
    realisticAdvice = 'Energy is scarce today. Cut the task list to just one single item, or take guilt-free rest.';
    tradeOffs = 'Lowering expectations today prevents burnout tomorrow.';
  } else if (availableMinutes && availableMinutes <= 30) {
    realisticAdvice = `With only ${availableMinutes} minutes left, full completion is unrealistic. Deliver one core section.`;
    tradeOffs = 'Focusing on one deliverable beats scattering attention across three partial drafts.';
  }

  const suggestedEssentialIds = topTask ? [topTask.id] : [];
  const suggestedOptionalIds = unfinished.filter((t) => t.id !== topTask?.id).map((t) => t.id);

  return {
    oneFocusTask,
    realisticAdvice,
    tradeOffs,
    suggestedEssentialIds,
    suggestedOptionalIds,
  };
}
