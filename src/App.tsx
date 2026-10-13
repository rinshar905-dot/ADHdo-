import React, { useState, useEffect } from 'react';
import { Task, EnergyLevel, LastActiveState, StepItem } from './types';
import { Storage } from './utils/storage';
import { Navigation, ActiveTab } from './components/Navigation';
import { BringMeBackBanner } from './components/BringMeBackBanner';
import { MyDay } from './components/MyDay';
import { UnstuckMode } from './components/UnstuckMode';
import { HelpMeStart } from './components/HelpMeStart';
import { FocusTimer } from './components/FocusTimer';
import { BrainDump } from './components/BrainDump';
import { AdaptMyDay } from './components/AdaptMyDay';
import { ADHdoBuddy } from './components/ADHdoBuddy';
import { Logo } from './components/Logo';
import { Bot, LifeBuoy } from 'lucide-react';

export default function App() {
  // 1. Core State with LocalStorage Persistence
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = Storage.getTasks();
    if (saved && saved.length > 0) return saved;
    return [
      {
        id: 'initial-task-1',
        title: 'Open ADHdo! and take one deep breath',
        priority: 'high',
        isEssential: true,
        completed: true,
        createdAt: Date.now() - 600000,
        completedAt: Date.now() - 300000,
      },
      {
        id: 'initial-task-2',
        title: 'Try Unstuck Mode on any task causing friction',
        priority: 'high',
        isEssential: true,
        completed: false,
        createdAt: Date.now() - 300000,
      },
    ];
  });

  const [energy, setEnergy] = useState<EnergyLevel | null>(() => Storage.getEnergy());
  const [activeTab, setActiveTab] = useState<ActiveTab>('my-day');
  const [lastActive, setLastActive] = useState<LastActiveState | null>(() => Storage.getLastActive());

  // Navigation payload states
  const [unstuckTask, setUnstuckTask] = useState<string>('');
  const [helpStartTask, setHelpStartTask] = useState<string>('');
  const [timerTaskTitle, setTimerTaskTitle] = useState<string>('');
  const [timerStepTitle, setTimerStepTitle] = useState<string>('');
  const [timerPresetMinutes, setTimerPresetMinutes] = useState<5 | 15 | 25>(25);

  // Sync tasks to storage
  useEffect(() => {
    Storage.saveTasks(tasks);
  }, [tasks]);

  // Sync energy to storage
  const handleSetEnergy = (level: EnergyLevel) => {
    setEnergy(level);
    Storage.setEnergy(level);
  };

  // Task Handlers
  const handleAddTask = (newTask: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    const created: Task = {
      ...newTask,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now(),
      completed: false,
    };
    setTasks((prev) => [created, ...prev]);
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? Date.now() : undefined,
            }
          : t
      )
    );
  };

  // Contextual Flow Handlers
  const handleOpenUnstuckForTask = (taskTitle: string) => {
    setUnstuckTask(taskTitle);
    setActiveTab('unstuck');
    const recovery: LastActiveState = {
      taskTitle,
      actionSource: 'unstuck',
      timestamp: Date.now(),
    };
    setLastActive(recovery);
    Storage.setLastActive(recovery);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenHelpStartForTask = (taskTitle: string) => {
    setHelpStartTask(taskTitle);
    setActiveTab('help-start');
    const recovery: LastActiveState = {
      taskTitle,
      actionSource: 'help-start',
      timestamp: Date.now(),
    };
    setLastActive(recovery);
    Storage.setLastActive(recovery);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartTimerForTask = (task: Task) => {
    setTimerTaskTitle(task.title);
    setTimerStepTitle('');
    setTimerPresetMinutes(25);
    setActiveTab('timer');
    const recovery: LastActiveState = {
      taskId: task.id,
      taskTitle: task.title,
      actionSource: 'timer',
      timestamp: Date.now(),
    };
    setLastActive(recovery);
    Storage.setLastActive(recovery);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartTimerForStep = (taskTitle: string, stepTitle: string, minutes: number) => {
    setTimerTaskTitle(taskTitle);
    setTimerStepTitle(stepTitle);
    const closestPreset: 5 | 15 | 25 = minutes <= 7 ? 5 : minutes <= 18 ? 15 : 25;
    setTimerPresetMinutes(closestPreset);
    setActiveTab('timer');
    const recovery: LastActiveState = {
      taskTitle,
      stepTitle,
      actionSource: 'timer',
      timestamp: Date.now(),
    };
    setLastActive(recovery);
    Storage.setLastActive(recovery);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveStepsToMyDay = (taskTitle: string, steps: StepItem[]) => {
    const newTasks: Task[] = steps.map((s, idx) => ({
      id: `task-from-step-${Date.now()}-${idx}`,
      title: `${s.title} (${taskTitle})`,
      priority: idx === 0 ? 'high' : 'medium',
      isEssential: idx === 0,
      completed: s.completed,
      createdAt: Date.now() + idx,
    }));
    setTasks((prev) => [...newTasks, ...prev]);
    setActiveTab('my-day');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImportBrainDumpTasks = (imported: Omit<Task, 'id' | 'createdAt' | 'completed'>[]) => {
    const createdList: Task[] = imported.map((imp, idx) => ({
      ...imp,
      id: `task-bd-${Date.now()}-${idx}`,
      createdAt: Date.now() + idx,
      completed: false,
    }));
    setTasks((prev) => [...createdList, ...prev]);
    setActiveTab('my-day');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResumeLastActive = (taskId?: string, taskTitle?: string) => {
    if (taskId) {
      const match = tasks.find((t) => t.id === taskId);
      if (match) {
        handleStartTimerForTask(match);
        return;
      }
    }
    if (taskTitle) {
      handleOpenUnstuckForTask(taskTitle);
    }
  };

  const handleDismissLastActive = () => {
    setLastActive(null);
    Storage.setLastActive(null);
  };

  const handleMarkTaskCompleteByTitle = (taskTitle: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.title.toLowerCase().trim() === taskTitle.toLowerCase().trim()
          ? { ...t, completed: true, completedAt: Date.now() }
          : t
      )
    );
  };

  const unfinishedCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F1E8] text-[#493568]">
      {/* 1. Universal Top Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenUnstuckQuick={() => {
          setUnstuckTask('');
          setActiveTab('unstuck');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        unfinishedCount={unfinishedCount}
      />

      {/* 2. Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Session Recovery Banner (shown if previous session exists and on My Day tab) */}
        {lastActive && activeTab === 'my-day' && (
          <BringMeBackBanner
            lastState={lastActive}
            onResumeTask={handleResumeLastActive}
            onMakeSmaller={(title) => handleOpenUnstuckForTask(title)}
            onDismiss={handleDismissLastActive}
          />
        )}

        {/* Dynamic Tab Views */}
        {activeTab === 'my-day' && (
          <MyDay
            tasks={tasks}
            energy={energy}
            onSetEnergy={handleSetEnergy}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onToggleTask={handleToggleTask}
            onOpenUnstuckForTask={handleOpenUnstuckForTask}
            onOpenHelpStartForTask={handleOpenHelpStartForTask}
            onStartTimerForTask={handleStartTimerForTask}
            onOpenUnstuckGeneral={() => {
              setUnstuckTask('');
              setActiveTab('unstuck');
            }}
          />
        )}

        {activeTab === 'unstuck' && (
          <UnstuckMode
            initialTaskTitle={unstuckTask}
            existingTasks={tasks}
            currentEnergy={energy}
            onStartFocusSession={(taskTitle, stepTitle, minutes) => {
              handleStartTimerForStep(taskTitle, stepTitle, minutes);
            }}
            onSaveStepAsTask={(stepTitle) => {
              handleAddTask({
                title: stepTitle,
                priority: 'high',
                isEssential: true,
              });
              setActiveTab('my-day');
            }}
            onReturnToDashboard={() => setActiveTab('my-day')}
          />
        )}

        {activeTab === 'help-start' && (
          <HelpMeStart
            initialTask={helpStartTask}
            existingTasks={tasks}
            onSaveStepsToMyDay={handleSaveStepsToMyDay}
            onStartTimerForStep={(taskTitle, stepTitle, minutes) => {
              handleStartTimerForStep(taskTitle, stepTitle, minutes);
            }}
            onReturnToDashboard={() => setActiveTab('my-day')}
          />
        )}

        {activeTab === 'timer' && (
          <FocusTimer
            initialTaskTitle={timerTaskTitle}
            initialStepTitle={timerStepTitle}
            initialPresetMinutes={timerPresetMinutes}
            onMarkTaskComplete={handleMarkTaskCompleteByTitle}
            onReturnToDashboard={() => setActiveTab('my-day')}
          />
        )}

        {activeTab === 'brain-dump' && (
          <BrainDump
            onImportTasksToMyDay={handleImportBrainDumpTasks}
            onReturnToDashboard={() => setActiveTab('my-day')}
          />
        )}

        {activeTab === 'adapt-day' && (
          <AdaptMyDay
            tasks={tasks}
            energy={energy}
            onUpdateTask={handleUpdateTask}
            onSelectSingleFocus={(task) => handleStartTimerForTask(task)}
            onReturnToDashboard={() => setActiveTab('my-day')}
          />
        )}

        {activeTab === 'buddy' && (
          <ADHdoBuddy
            tasks={tasks}
            energy={energy}
            activeTimerTask={timerTaskTitle}
            onAddTask={(t) => handleAddTask(t)}
            onStartTimer={(taskTitle, minutes) => {
              setTimerTaskTitle(taskTitle);
              setTimerStepTitle('');
              setTimerPresetMinutes(5);
              setActiveTab('timer');
            }}
            onOpenUnstuck={(taskTitle) => handleOpenUnstuckForTask(taskTitle)}
            onOpenHelpStart={(taskTitle) => handleOpenHelpStartForTask(taskTitle)}
          />
        )}
      </main>

      {/* Floating Buddy Quick Shortcut Button (when on other tabs) */}
      {activeTab !== 'buddy' && (
        <button
          onClick={() => {
            setActiveTab('buddy');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-2.5 bg-[#493568] hover:bg-[#5f4783] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg border border-[#C7B5FF]/40 active:scale-95 transition-all cursor-pointer group"
          aria-label="Open ADHdo Buddy"
        >
          <Bot className="w-4 h-4 text-[#FFC978] transition-transform group-hover:scale-110" />
          <span>Chat with Buddy</span>
        </button>
      )}

      {/* 3. Thoughtful Footer */}
      <footer className="border-t border-[#493568]/10 bg-white/60 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#493568]/70">
          <div className="flex items-center gap-3">
            <Logo size="sm" showTagline={false} />
            <span className="font-semibold text-[#493568]">It's ADH-doable!</span>
            <span aria-hidden="true">·</span>
            <span>Supportive productivity companion</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-[#493568]/60 text-center sm:text-right">
            <span>Local persistence · Device-private</span>
            <span aria-hidden="true">·</span>
            <span>Not a diagnostic or medical tool</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
