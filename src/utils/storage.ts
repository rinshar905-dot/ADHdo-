import { Task, EnergyLevel, LastActiveState, TimerState } from '../types';

const STORAGE_KEYS = {
  TASKS: 'adhdo_tasks_v1',
  ENERGY: 'adhdo_energy_v1',
  LAST_ACTIVE: 'adhdo_last_active_v1',
  TIMER: 'adhdo_timer_v1',
  CHECKIN_DATE: 'adhdo_checkin_date_v1',
};

// Safe JSON parser
function safeGet<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[ADHdo! Storage] Failed to parse key ${key}:`, err);
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[ADHdo! Storage] Failed to write key ${key}:`, err);
  }
}

export const Storage = {
  // Tasks
  getTasks(): Task[] {
    const tasks = safeGet<Task[]>(STORAGE_KEYS.TASKS, []);
    return Array.isArray(tasks) ? tasks : [];
  },

  saveTasks(tasks: Task[]): void {
    safeSet(STORAGE_KEYS.TASKS, tasks);
  },

  // Energy Check-in
  getEnergy(): EnergyLevel | null {
    const savedDate = localStorage.getItem(STORAGE_KEYS.CHECKIN_DATE);
    const today = new Date().toDateString();
    if (savedDate !== today) {
      return null; // Prompt fresh check-in for a new day
    }
    return safeGet<EnergyLevel | null>(STORAGE_KEYS.ENERGY, null);
  },

  setEnergy(energy: EnergyLevel): void {
    safeSet(STORAGE_KEYS.ENERGY, energy);
    try {
      localStorage.setItem(STORAGE_KEYS.CHECKIN_DATE, new Date().toDateString());
    } catch {}
  },

  // Last Active State (for Bring Me Back)
  getLastActive(): LastActiveState | null {
    return safeGet<LastActiveState | null>(STORAGE_KEYS.LAST_ACTIVE, null);
  },

  setLastActive(state: LastActiveState | null): void {
    if (state === null) {
      localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVE);
    } else {
      safeSet(STORAGE_KEYS.LAST_ACTIVE, state);
    }
  },

  // Focus Timer State
  getTimerState(): TimerState | null {
    return safeGet<TimerState | null>(STORAGE_KEYS.TIMER, null);
  },

  saveTimerState(state: TimerState): void {
    safeSet(STORAGE_KEYS.TIMER, state);
  },

  clearTimerState(): void {
    localStorage.removeItem(STORAGE_KEYS.TIMER);
  },
};
