export type EnergyLevel = 'empty' | 'low' | 'okay' | 'ready';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  priority: 'high' | 'medium' | 'low';
  isEssential: boolean;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  subtasks?: Subtask[];
  estimatedMinutes?: number;
  deadline?: string;
}

export type BlockerType = 
  | 'cant-start'
  | 'overwhelmed'
  | 'distracted'
  | 'running-out-of-time'
  | 'no-energy';

export interface BlockerOption {
  id: BlockerType;
  label: string;
  description: string;
  iconName: string;
}

// Upgraded Unstuck Result matching Section 4 structured output
export interface UnstuckResult {
  understanding: string;
  nextAction: string;
  whyThisHelps: string;
  smallerAlternative: string;
  followUpQuestion?: string | null;
  estimatedMinutes: number;
  makeSmallerCount: number;
}

// Upgraded Help Me Start Step and Result
export interface StepItem {
  id: string;
  title: string;
  description?: string;
  estimatedMinutes: number;
  completed: boolean;
}

export interface HelpStartResult {
  goal: string;
  assumptions: string[];
  steps: StepItem[];
  clarifyingQuestion?: string | null;
  isAlreadySmall?: boolean;
}

export interface TimerState {
  taskId?: string;
  taskTitle?: string;
  stepTitle?: string;
  totalDurationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  lastStartedTimestamp: number | null;
  presetMinutes: 5 | 15 | 25;
  completedSessionsCount: number;
}

export interface BrainDumpCategorized {
  tasks: Array<{ id: string; title: string; priority: 'high' | 'medium' | 'low'; isEssential: boolean; selected: boolean }>;
  reminders: Array<{ id: string; title: string; note?: string; selected: boolean }>;
  ideas: Array<{ id: string; title: string; note?: string; selected: boolean }>;
  later: Array<{ id: string; title: string; note?: string; selected: boolean }>;
}

export interface AdaptDayResult {
  oneFocusTask: string;
  realisticAdvice: string;
  tradeOffs: string;
  suggestedEssentialIds: string[];
  suggestedOptionalIds: string[];
}

export interface LastActiveState {
  taskId?: string;
  taskTitle?: string;
  stepTitle?: string;
  actionSource: 'unstuck' | 'help-start' | 'timer' | 'task';
  timestamp: number;
}

// ADHdo Buddy conversation message
export interface BuddyMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  actionSuggestion?: {
    type: 'create_task' | 'start_timer' | 'open_unstuck' | 'open_help_start';
    label: string;
    payload?: any;
  };
}
