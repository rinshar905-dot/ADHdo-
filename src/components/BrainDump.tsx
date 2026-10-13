import React, { useState } from 'react';
import { BrainDumpCategorized, Task } from '../types';
import { requestBrainDumpOrganize } from '../services/aiService';
import { 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Clock, 
  Lightbulb, 
  Calendar, 
  ArrowRight, 
  RotateCcw,
  Check,
  AlertTriangle
} from 'lucide-react';
import { triggerCelebration, playChime } from '../utils/effects';

interface BrainDumpProps {
  onImportTasksToMyDay: (newTasks: Omit<Task, 'id' | 'createdAt' | 'completed'>[]) => void;
  onReturnToDashboard: () => void;
}

export const BrainDump: React.FC<BrainDumpProps> = ({
  onImportTasksToMyDay,
  onReturnToDashboard,
}) => {
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [categorized, setCategorized] = useState<BrainDumpCategorized | null>(null);

  const handleOrganize = async () => {
    if (!rawText.trim()) return;
    setIsLoading(true);

    const res = await requestBrainDumpOrganize(rawText.trim());
    setIsLoading(false);
    setCategorized(res.categorized);
    playChime('sparkle');
  };

  const handleToggleItem = (category: keyof BrainDumpCategorized, id: string) => {
    if (!categorized) return;
    const list = categorized[category] as Array<{ id: string; selected: boolean }>;
    setCategorized({
      ...categorized,
      [category]: list.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      ),
    });
  };

  const handleDeleteItem = (category: keyof BrainDumpCategorized, id: string) => {
    if (!categorized) return;
    const list = categorized[category] as Array<{ id: string }>;
    setCategorized({
      ...categorized,
      [category]: list.filter((item) => item.id !== id),
    });
  };

  const handleImportToMyDay = () => {
    if (!categorized) return;
    const tasksToImport: Omit<Task, 'id' | 'createdAt' | 'completed'>[] = [];

    // Selected tasks
    categorized.tasks.forEach((t) => {
      if (t.selected && t.title.trim()) {
        tasksToImport.push({
          title: t.title.trim(),
          priority: t.priority,
          isEssential: t.isEssential,
        });
      }
    });

    // Also allow selected reminders to be imported as light reminders
    categorized.reminders.forEach((r) => {
      if (r.selected && r.title.trim()) {
        tasksToImport.push({
          title: `Reminder: ${r.title.trim()}`,
          priority: 'low',
          isEssential: false,
          notes: r.note,
        });
      }
    });

    if (tasksToImport.length > 0) {
      triggerCelebration();
      playChime('complete');
      onImportTasksToMyDay(tasksToImport);
    }
  };

  const selectedCount = categorized
    ? categorized.tasks.filter((t) => t.selected).length +
      categorized.reminders.filter((r) => r.selected).length
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* 1. Header Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#493568]/10 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-[#493568]/60 uppercase tracking-wider">
            Mental Unclutter · Untangle My Brain
          </span>
          <span className="text-xs font-bold text-[#493568] bg-[#C7B5FF]/40 px-2 py-0.5 rounded-md">
            Safe & Selective
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#493568] tracking-tight">
          Everything on your mind. Get it out of your head.
        </h1>
        <p className="text-sm sm:text-base text-[#493568]/80 mt-2 max-w-2xl leading-relaxed">
          Dump messy thoughts, half-finished ideas, worries, and to-dos. ADHdo! helps sort them into actionable tasks, reminders, and things to set aside for later. Nothing is saved without your explicit review.
        </p>
      </section>

      {/* 2. Text Input Card */}
      {!categorized ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#493568]/10 shadow-sm space-y-4">
          <label htmlFor="brain-dump-textarea" className="block text-sm font-bold text-[#493568]">
            Write freely. Bullet points, rambling paragraphs, fragments—anything goes:
          </label>
          <textarea
            id="brain-dump-textarea"
            rows={7}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="e.g. Need to pay wifi bill by Friday. Call mom back. Had an idea for a recipe. Stressed about project deadline. Buy toothpaste. What if I learn guitar this summer? Clean closet..."
            className="w-full p-4 rounded-2xl border border-[#493568]/20 focus:outline-none focus:ring-2 focus:ring-[#C7B5FF] text-base text-[#493568] placeholder:text-[#493568]/40 leading-relaxed resize-y"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs text-[#493568]/60">
              *Preserves your meaning. Worries won't be turned into fake obligations.
            </span>
            <button
              onClick={handleOrganize}
              disabled={!rawText.trim() || isLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#493568] hover:bg-[#5f4783] disabled:opacity-40 text-white font-bold rounded-2xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-[#FFC978]" />
                  <span>Sorting thoughts...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#FFC978]" />
                  <span>Untangle thoughts</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* 3. Categorized Review & Selectable Import */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#C7B5FF] shadow-lg space-y-8 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#493568]/10 pb-4">
            <div>
              <span className="text-xs font-semibold text-[#493568]/60 uppercase tracking-wider">
                Review Sorted Thoughts
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#493568]">
                Select what belongs in My Day
              </h2>
            </div>
            <button
              onClick={() => setCategorized(null)}
              className="text-xs text-[#493568]/70 hover:text-[#493568] font-semibold flex items-center gap-1.5 p-2 rounded-xl hover:bg-[#F7F1E8] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Edit raw text</span>
            </button>
          </div>

          {/* Category Grids */}
          <div className="space-y-6">
            {/* Category A: Actionable Tasks */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-[#493568]">
                  Actionable Tasks ({categorized.tasks.length})
                </h3>
                <span className="text-xs text-[#493568]/60">Physical, concrete things to do</span>
              </div>

              {categorized.tasks.length === 0 ? (
                <p className="text-xs text-[#493568]/50 italic pl-7">No urgent tasks identified.</p>
              ) : (
                <div className="space-y-2">
                  {categorized.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                        task.selected
                          ? 'bg-[#BDE8D1]/20 border-[#BDE8D1]'
                          : 'bg-[#F7F1E8]/40 border-[#493568]/10 opacity-60'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleItem('tasks', task.id)}
                        className="flex items-center gap-2.5 flex-1 text-left cursor-pointer"
                      >
                        {task.selected ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#493568]/40 shrink-0" />
                        )}
                        <span className="text-sm font-semibold text-[#493568]">{task.title}</span>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        {task.isEssential && (
                          <span className="text-[11px] font-bold bg-[#FFC978] text-[#493568] px-1.5 py-0.5 rounded">
                            Essential
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteItem('tasks', task.id)}
                          className="p-1 text-[#493568]/40 hover:text-rose-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category B: Reminders */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-[#493568]">
                  Reminders ({categorized.reminders.length})
                </h3>
                <span className="text-xs text-[#493568]/60">Cues and notes</span>
              </div>

              {categorized.reminders.length === 0 ? (
                <p className="text-xs text-[#493568]/50 italic pl-7">No reminders found.</p>
              ) : (
                <div className="space-y-2">
                  {categorized.reminders.map((rem) => (
                    <div
                      key={rem.id}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                        rem.selected
                          ? 'bg-[#FFC978]/15 border-[#FFC978]'
                          : 'bg-[#F7F1E8]/40 border-[#493568]/10 opacity-60'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleItem('reminders', rem.id)}
                        className="flex items-center gap-2.5 flex-1 text-left cursor-pointer"
                      >
                        {rem.selected ? (
                          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#493568]/40 shrink-0" />
                        )}
                        <span className="text-sm font-medium text-[#493568]">{rem.title}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteItem('reminders', rem.id)}
                        className="p-1 text-[#493568]/40 hover:text-rose-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category C: Ideas & Later (Non-pressuring) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#F7F1E8] rounded-2xl border border-[#493568]/10 space-y-2">
                <div className="flex items-center gap-2 text-[#493568]">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <h4 className="text-sm font-bold">Ideas to keep safe</h4>
                </div>
                {categorized.ideas.length === 0 ? (
                  <p className="text-xs text-[#493568]/50 italic">None</p>
                ) : (
                  <ul className="text-xs text-[#493568]/80 space-y-1 list-disc list-inside">
                    {categorized.ideas.map((idea) => (
                      <li key={idea.id}>{idea.title}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="p-4 bg-[#F7F1E8] rounded-2xl border border-[#493568]/10 space-y-2">
                <div className="flex items-center gap-2 text-[#493568]">
                  <Calendar className="w-4 h-4 text-[#493568]/70" />
                  <h4 className="text-sm font-bold">Things for later / not today</h4>
                </div>
                {categorized.later.length === 0 ? (
                  <p className="text-xs text-[#493568]/50 italic">None</p>
                ) : (
                  <ul className="text-xs text-[#493568]/80 space-y-1 list-disc list-inside">
                    {categorized.later.map((laterItem) => (
                      <li key={laterItem.id}>{laterItem.title}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-[#493568]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-semibold text-[#493568]">
              {selectedCount} item{selectedCount === 1 ? '' : 's'} ready to import
            </span>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setCategorized(null)}
                className="px-4 py-2.5 text-xs font-semibold text-[#493568]/70 hover:text-[#493568] cursor-pointer"
              >
                Discard & try again
              </button>
              <button
                onClick={handleImportToMyDay}
                disabled={selectedCount === 0}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-[#493568] hover:bg-[#5f4783] disabled:opacity-40 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                <Check className="w-4 h-4 text-[#FFC978]" />
                <span>Save selected to My Day</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
