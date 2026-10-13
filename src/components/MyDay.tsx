import React, { useState } from 'react';
import { Task, EnergyLevel } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Edit3, 
  LifeBuoy, 
  PlayCircle, 
  Timer, 
  Battery, 
  BatteryLow, 
  BatteryMedium, 
  BatteryCharging, 
  Sparkles, 
  Check, 
  X, 
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { triggerCelebration, playChime } from '../utils/effects';

interface MyDayProps {
  tasks: Task[];
  energy: EnergyLevel | null;
  onSetEnergy: (energy: EnergyLevel) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onToggleTask: (id: string) => void;
  onOpenUnstuckForTask: (taskTitle: string) => void;
  onOpenHelpStartForTask: (taskTitle: string) => void;
  onStartTimerForTask: (task: Task) => void;
  onOpenUnstuckGeneral: () => void;
}

export const MyDay: React.FC<MyDayProps> = ({
  tasks,
  energy,
  onSetEnergy,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTask,
  onOpenUnstuckForTask,
  onOpenHelpStartForTask,
  onStartTimerForTask,
  onOpenUnstuckGeneral,
}) => {
  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newIsEssential, setNewIsEssential] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Edit task state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [editIsEssential, setEditIsEssential] = useState(false);

  // Filter state
  const [filter, setFilter] = useState<'all' | 'unfinished' | 'completed'>('all');

  const energyOptions: { id: EnergyLevel; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
    { id: 'empty', label: 'Running on empty', icon: Battery, color: 'text-rose-500' },
    { id: 'low', label: 'A little low', icon: BatteryLow, color: 'text-amber-500' },
    { id: 'okay', label: 'Doing okay', icon: BatteryMedium, color: 'text-[#493568]' },
    { id: 'ready', label: 'Ready to go', icon: BatteryCharging, color: 'text-emerald-600' },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask({
      title: newTitle.trim(),
      priority: newPriority,
      isEssential: newIsEssential,
    });
    setNewTitle('');
    setIsAdding(false);
  };

  const handleStartEdit = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditIsEssential(task.isEssential);
  };

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim()) return;
    onUpdateTask(id, {
      title: editTitle.trim(),
      priority: editPriority,
      isEssential: editIsEssential,
    });
    setEditingId(null);
  };

  const handleToggle = (task: Task, e: React.MouseEvent) => {
    if (!task.completed) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      triggerCelebration(rect.left + rect.width / 2, rect.top + rect.height / 2);
      playChime('complete');
    }
    onToggleTask(task.id);
  };

  // Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const unfinishedTasks = tasks.filter((t) => !t.completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'unfinished') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Welcoming Hero Banner */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#493568]/10 shadow-sm relative overflow-hidden">
        {/* Decorative soft pastel circle accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C7B5FF]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-[#FFC978]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-[#493568]/60 uppercase tracking-wider">
                My Day · Dashboard
              </span>
              <span className="text-xs font-bold text-[#493568] bg-[#FFC978]/40 px-2 py-0.5 rounded-md">
                It's ADH-doable!
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#493568] tracking-tight">
              What kind of day are we having?
            </h1>
            <p className="text-sm sm:text-base text-[#493568]/80 mt-1.5 leading-relaxed">
              No pressure to conquer the world. We’re just finding the next doable step and treating ourselves gently.
            </p>

            {/* Energy check-in buttons */}
            <div className="mt-5">
              <span className="text-xs font-medium text-[#493568]/70 block mb-2">
                Quick energy check-in (optional):
              </span>
              <div className="flex flex-wrap gap-2">
                {energyOptions.map((opt) => {
                  const isSelected = energy === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => onSetEnergy(opt.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#493568] text-white shadow-sm ring-2 ring-[#493568]/20'
                          : 'bg-[#F7F1E8] text-[#493568] hover:bg-[#ebdcc8] border border-[#493568]/10'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-[#FFC978]' : opt.color}`} />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Stats & Hero Unstuck Button */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={onOpenUnstuckGeneral}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#C7B5FF] hover:bg-[#b59ffa] active:scale-95 text-[#493568] font-bold rounded-2xl shadow-sm hover:shadow transition-all cursor-pointer group"
            >
              <LifeBuoy className="w-5 h-5 text-[#493568] transition-transform group-hover:rotate-12" />
              <span>Help me get unstuck</span>
            </button>

            {totalTasks > 0 && (
              <div className="bg-[#F7F1E8] rounded-2xl p-4 border border-[#493568]/10">
                <div className="flex items-center justify-between gap-4 text-xs font-semibold text-[#493568]/80 mb-1.5">
                  <span>Today's Progress</span>
                  <span className="font-mono tabular-nums font-bold text-[#493568]">
                    {completedTasks}/{totalTasks} done ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-[#493568]/10 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#BDE8D1] h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%`, backgroundColor: '#BDE8D1' }}
                  />
                </div>
                <p className="text-[11px] text-[#493568]/70 mt-1.5">
                  {completedTasks === 0
                    ? 'Every tiny step counts. You got this.'
                    : completedTasks === totalTasks
                    ? '🎉 Incredible job! Take a well-deserved rest.'
                    : 'Good momentum. Keep going at your own pace.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Tasks Section Header & Filter */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-[#493568]">Today's Focus</h2>
            <span className="text-xs font-mono font-bold text-[#493568] bg-[#C7B5FF]/30 px-2.5 py-1 rounded-lg">
              {unfinishedTasks} to do
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex items-center p-1 bg-white rounded-xl border border-[#493568]/10 text-xs font-medium">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  filter === 'all'
                    ? 'bg-[#493568] text-white shadow-sm'
                    : 'text-[#493568]/70 hover:text-[#493568]'
                }`}
              >
                All ({totalTasks})
              </button>
              <button
                onClick={() => setFilter('unfinished')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  filter === 'unfinished'
                    ? 'bg-[#493568] text-white shadow-sm'
                    : 'text-[#493568]/70 hover:text-[#493568]'
                }`}
              >
                Unfinished ({unfinishedTasks})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  filter === 'completed'
                    ? 'bg-[#493568] text-white shadow-sm'
                    : 'text-[#493568]/70 hover:text-[#493568]'
                }`}
              >
                Completed ({completedTasks})
              </button>
            </div>

            {/* Quick Add Button */}
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-[#493568] hover:bg-[#5f4783] rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Inline Add Task Drawer / Card */}
        {isAdding && (
          <form
            onSubmit={handleCreateSubmit}
            className="bg-white rounded-2xl p-5 border-2 border-[#C7B5FF] shadow-md space-y-4 animate-fadeIn"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#493568]">Add a new task</h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="p-1 text-[#493568]/50 hover:text-[#493568] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What task is calling for attention? (e.g. Clean the kitchen counter, reply to Alex)"
                className="w-full px-4 py-2.5 text-sm sm:text-base rounded-xl border border-[#493568]/20 focus:outline-none focus:ring-2 focus:ring-[#C7B5FF] text-[#493568] placeholder:text-[#493568]/40"
                autoFocus
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                {/* Priority Selection */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[#493568]/70 font-medium">Priority:</span>
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPriority(p)}
                      className={`px-2.5 py-1 rounded-lg capitalize transition-colors font-semibold cursor-pointer ${
                        newPriority === p
                          ? 'bg-[#493568] text-white'
                          : 'bg-[#F7F1E8] text-[#493568]/70 hover:text-[#493568]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Essential Toggle */}
                <button
                  type="button"
                  onClick={() => setNewIsEssential(!newIsEssential)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    newIsEssential
                      ? 'bg-[#FFC978] text-[#493568]'
                      : 'bg-[#F7F1E8] text-[#493568]/60 hover:text-[#493568]'
                  }`}
                >
                  {newIsEssential ? '★ Essential for today' : 'Optional'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#493568]/70 hover:text-[#493568] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#493568] hover:bg-[#5f4783] disabled:opacity-40 rounded-xl transition-colors cursor-pointer"
                >
                  Add to My Day
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 4. Task List */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#493568]/10 shadow-sm space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#C7B5FF]/30 flex items-center justify-center text-[#493568]">
              <Sparkles className="w-7 h-7 text-[#493568]" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-lg font-bold text-[#493568]">
                {filter === 'completed'
                  ? 'No completed tasks yet.'
                  : filter === 'unfinished'
                  ? 'All tasks checked off! Take a breath.'
                  : 'Your day is a clean slate.'}
              </h3>
              <p className="text-sm text-[#493568]/70 leading-relaxed">
                {filter === 'all'
                  ? 'Add your first task, dump messy thoughts in Brain Dump, or tap Unstuck Mode if you are feeling resistance.'
                  : 'Start small. Even one 2-minute task builds tremendous momentum.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 text-sm font-bold text-white bg-[#493568] hover:bg-[#5f4783] rounded-xl shadow-sm cursor-pointer"
              >
                Add a task
              </button>
              <button
                onClick={onOpenUnstuckGeneral}
                className="px-4 py-2 text-sm font-bold text-[#493568] bg-[#C7B5FF] hover:bg-[#b59ffa] rounded-xl shadow-sm cursor-pointer"
              >
                Unstuck Mode
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isEditing = editingId === task.id;

              if (isEditing) {
                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl p-4 border-2 border-[#C7B5FF] shadow-sm space-y-3"
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-medium rounded-xl border border-[#493568]/20 focus:outline-none focus:ring-2 focus:ring-[#C7B5FF]"
                      autoFocus
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        {(['low', 'medium', 'high'] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setEditPriority(p)}
                            className={`px-2 py-1 rounded-lg capitalize font-semibold cursor-pointer ${
                              editPriority === p
                                ? 'bg-[#493568] text-white'
                                : 'bg-[#F7F1E8] text-[#493568]/70'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setEditIsEssential(!editIsEssential)}
                          className={`px-2 py-1 rounded-lg font-semibold cursor-pointer ${
                            editIsEssential
                              ? 'bg-[#FFC978] text-[#493568]'
                              : 'bg-[#F7F1E8] text-[#493568]/60'
                          }`}
                        >
                          {editIsEssential ? 'Essential' : 'Optional'}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 text-xs text-[#493568]/60 hover:text-[#493568]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(task.id)}
                          className="px-3 py-1 text-xs font-bold text-white bg-[#493568] rounded-lg"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={task.id}
                  className={`group bg-white rounded-2xl p-4 border transition-all ${
                    task.completed
                      ? 'border-[#BDE8D1] bg-[#BDE8D1]/10 opacity-75'
                      : 'border-[#493568]/10 hover:border-[#C7B5FF] shadow-sm hover:shadow'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Checkbox & Task Title */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        onClick={(e) => handleToggle(task, e)}
                        className="mt-0.5 text-[#493568] hover:text-[#5f4783] transition-transform active:scale-90 cursor-pointer shrink-0"
                        aria-label={task.completed ? 'Mark incomplete' : 'Mark completed'}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-[#BDE8D1]" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#493568]/40 hover:text-[#493568]" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className={`text-sm sm:text-base font-semibold text-[#493568] break-words ${
                              task.completed ? 'line-through text-[#493568]/60' : ''
                            }`}
                          >
                            {task.title}
                          </p>

                          {/* Priority and Essential indicators (clean unboxed text with separators) */}
                          <div className="flex items-center gap-1.5 text-xs text-[#493568]/60 font-medium">
                            {task.isEssential && (
                              <span className="text-[#493568] font-bold text-[11px] bg-[#FFC978]/60 px-1.5 py-0.5 rounded">
                                Essential
                              </span>
                            )}
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">{task.priority}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {!task.completed && (
                        <>
                          <button
                            onClick={() => onOpenUnstuckForTask(task.title)}
                            className="p-1.5 text-[#493568] hover:bg-[#C7B5FF]/30 rounded-lg transition-colors cursor-pointer"
                            title="Help me unstick this task"
                            aria-label="Unstick this task"
                          >
                            <LifeBuoy className="w-4 h-4 text-[#493568]" />
                          </button>
                          <button
                            onClick={() => onOpenHelpStartForTask(task.title)}
                            className="p-1.5 text-[#493568] hover:bg-[#C7B5FF]/30 rounded-lg transition-colors cursor-pointer"
                            title="Break down into small steps"
                            aria-label="Break down task"
                          >
                            <PlayCircle className="w-4 h-4 text-[#493568]" />
                          </button>
                          <button
                            onClick={() => onStartTimerForTask(task)}
                            className="p-1.5 text-[#493568] hover:bg-[#C7B5FF]/30 rounded-lg transition-colors cursor-pointer"
                            title="Start focus timer on this"
                            aria-label="Start timer"
                          >
                            <Timer className="w-4 h-4 text-[#493568]" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleStartEdit(task)}
                        className="p-1.5 text-[#493568]/60 hover:text-[#493568] hover:bg-[#F7F1E8] rounded-lg transition-colors cursor-pointer"
                        title="Edit task"
                        aria-label="Edit task"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1.5 text-rose-500/70 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete task"
                        aria-label="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
