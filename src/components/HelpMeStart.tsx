import React, { useState } from 'react';
import { StepItem, Task, HelpStartResult } from '../types';
import { requestHelpStart } from '../services/aiService';
import { 
  PlayCircle, 
  ArrowRight, 
  Minimize2, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Timer, 
  Sparkles, 
  RotateCcw,
  Clock,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { triggerCelebration, playChime } from '../utils/effects';

interface HelpMeStartProps {
  initialTask?: string;
  existingTasks: Task[];
  onSaveStepsToMyDay: (taskTitle: string, steps: StepItem[]) => void;
  onStartTimerForStep: (taskTitle: string, stepTitle: string, minutes: number) => void;
  onReturnToDashboard: () => void;
}

export const HelpMeStart: React.FC<HelpMeStartProps> = ({
  initialTask = '',
  existingTasks,
  onSaveStepsToMyDay,
  onStartTimerForStep,
  onReturnToDashboard,
}) => {
  const [taskInput, setTaskInput] = useState(initialTask);
  const [availableMinutes, setAvailableMinutes] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<HelpStartResult | null>(null);
  const [isSmallerFirstStep, setIsSmallerFirstStep] = useState(false);
  const [newStepText, setNewStepText] = useState('');
  const [sourceTag, setSourceTag] = useState<'gemini' | 'fallback' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async (smallerFirst: boolean = false) => {
    if (!taskInput.trim() || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    const res = await requestHelpStart({
      task: taskInput.trim(),
      smallerFirstStep: smallerFirst,
      availableMinutes: typeof availableMinutes === 'number' ? availableMinutes : undefined,
    });

    setIsLoading(false);
    setResult(res.result);
    setSourceTag(res.source);
    setIsSmallerFirstStep(smallerFirst);

    if (res.error && res.source === 'fallback') {
      setErrorMessage(res.error);
    }

    playChime('sparkle');
  };

  const handleToggleStep = (id: string, e: React.MouseEvent) => {
    if (!result) return;
    const target = result.steps.find((s) => s.id === id);
    if (target && !target.completed) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      triggerCelebration(rect.left + rect.width / 2, rect.top + rect.height / 2);
      playChime('complete');
    }

    setResult({
      ...result,
      steps: result.steps.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)),
    });
  };

  const handleUpdateStepTitle = (id: string, newTitle: string) => {
    if (!result) return;
    setResult({
      ...result,
      steps: result.steps.map((s) => (s.id === id ? { ...s, title: newTitle } : s)),
    });
  };

  const handleDeleteStep = (id: string) => {
    if (!result) return;
    setResult({
      ...result,
      steps: result.steps.filter((s) => s.id !== id),
    });
  };

  const handleAddManualStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepText.trim() || !result) return;
    const newStep: StepItem = {
      id: `step-manual-${Date.now()}`,
      title: newStepText.trim(),
      estimatedMinutes: 3,
      completed: false,
    };
    setResult({
      ...result,
      steps: [...result.steps, newStep],
    });
    setNewStepText('');
  };

  const handleSaveToDay = () => {
    if (!result || result.steps.length === 0) return;
    onSaveStepsToMyDay(result.goal || taskInput.trim(), result.steps);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* 1. Header Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#493568]/10 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-[#493568]/60 uppercase tracking-wider">
                Sequencing Engine · Help Me Start
              </span>
              <span className="text-xs font-bold text-[#493568] bg-[#FFC978]/40 px-2 py-0.5 rounded-md">
                No Generic Fluff
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#493568] tracking-tight">
              Turn vague, heavy tasks into easy bites.
            </h1>
            <p className="text-sm sm:text-base text-[#493568]/80 mt-2 max-w-2xl leading-relaxed">
              We break complex goals into 3–5 domain-specific micro-actions. If a task is already compact, we won't overcomplicate it.
            </p>
          </div>

          {sourceTag && (
            <div className="hidden sm:block shrink-0">
              <span className={`text-[11px] font-mono px-2.5 py-1 rounded-lg font-semibold ${
                sourceTag === 'gemini' 
                  ? 'bg-[#BDE8D1]/40 text-[#493568] border border-[#BDE8D1]' 
                  : 'bg-[#FFC978]/30 text-[#493568] border border-[#FFC978]'
              }`}>
                {sourceTag === 'gemini' ? '● Gemini Powered' : '○ Offline Assistant'}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 2. Task Input & Pre-fill Options */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#493568]/10 shadow-sm space-y-5">
        <div className="space-y-2">
          <label htmlFor="help-start-task-input" className="block text-sm font-bold text-[#493568]">
            What big or intimidating task do you want to break down?
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="help-start-task-input"
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="e.g. Prepare for my Java OOP exam, submit semester project, clean kitchen..."
              className="flex-1 px-4 py-3 rounded-2xl border border-[#493568]/20 focus:outline-none focus:ring-2 focus:ring-[#C7B5FF] text-base text-[#493568] placeholder:text-[#493568]/40"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGenerate(false);
                }
              }}
            />
            <button
              onClick={() => handleGenerate(false)}
              disabled={!taskInput.trim() || isLoading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#493568] hover:bg-[#5f4783] disabled:opacity-40 text-white font-bold rounded-2xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-[#FFC978]" />
                  <span>Sequencing...</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5 text-[#FFC978]" />
                  <span>Break it down</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Existing Tasks Pickers */}
        {existingTasks.filter((t) => !t.completed).length > 0 && (
          <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-[#493568]/10">
            <span className="text-xs text-[#493568]/60 font-medium">Or pick from My Day:</span>
            {existingTasks
              .filter((t) => !t.completed)
              .slice(0, 4)
              .map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTaskInput(t.title)}
                  className="text-xs bg-[#F7F1E8] hover:bg-[#ebdcc8] text-[#493568] font-medium px-2.5 py-1 rounded-lg border border-[#493568]/10 transition-colors cursor-pointer"
                >
                  {t.title}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* 3. Generated Steps List */}
      {result && result.steps.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#C7B5FF] shadow-lg space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#493568]/10 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-[#493568]/60 uppercase tracking-wider">
                  Goal Breakdown
                </span>
                {result.isAlreadySmall && (
                  <span className="text-xs font-bold text-[#493568] bg-[#BDE8D1] px-2 py-0.5 rounded">
                    Already Small & Executable
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#493568]">
                “{result.goal || taskInput}”
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleGenerate(!isSmallerFirstStep)}
                disabled={isLoading}
                className="text-xs font-bold text-[#493568] bg-[#FFC978]/30 hover:bg-[#FFC978]/50 border border-[#FFC978] px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>{isSmallerFirstStep ? 'Standard sequence' : 'Want an easier first step?'}</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Gemini API issue ({errorMessage}). Showing offline structured sequence.</span>
              </div>
              <button
                onClick={() => handleGenerate(isSmallerFirstStep)}
                className="font-bold underline ml-2 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Assumptions if any */}
          {result.assumptions && result.assumptions.length > 0 && (
            <div className="bg-[#F7F1E8] rounded-2xl p-4 border border-[#493568]/10 space-y-1">
              <span className="text-xs font-bold text-[#493568]/70 uppercase tracking-wider">
                Assumptions:
              </span>
              <ul className="text-xs text-[#493568]/80 list-disc list-inside space-y-0.5">
                {result.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Clarifying question if any */}
          {result.clarifyingQuestion && (
            <div className="p-3.5 bg-white rounded-xl border border-[#493568]/20 flex items-start gap-2.5 text-xs text-[#493568]">
              <HelpCircle className="w-4 h-4 text-[#493568] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Clarifying question: </span>
                <span>{result.clarifyingQuestion}</span>
              </div>
            </div>
          )}

          {/* Steps List */}
          <div className="space-y-3">
            {result.steps.map((step, index) => {
              const isFirst = index === 0;
              return (
                <div
                  key={step.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    step.completed
                      ? 'bg-[#BDE8D1]/15 border-[#BDE8D1] opacity-75'
                      : isFirst
                      ? 'bg-[#C7B5FF]/15 border-[#C7B5FF] shadow-sm ring-1 ring-[#C7B5FF]'
                      : 'bg-[#F7F1E8]/50 border-[#493568]/10 hover:border-[#C7B5FF]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        onClick={(e) => handleToggleStep(step.id, e)}
                        className="mt-0.5 text-[#493568] hover:text-[#5f4783] cursor-pointer shrink-0"
                      >
                        {step.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-[#BDE8D1]" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#493568]/40 hover:text-[#493568]" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-[#493568] bg-[#493568]/10 px-1.5 py-0.5 rounded">
                            Step {index + 1}
                          </span>
                          {isFirst && !step.completed && (
                            <span className="text-xs font-bold text-[#493568] bg-[#FFC978] px-2 py-0.5 rounded">
                              Start here today
                            </span>
                          )}
                          <span className="text-xs font-mono tabular-nums text-[#493568]/60">
                            ~{step.estimatedMinutes} min
                          </span>
                        </div>

                        {/* Title input (inline editable) */}
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => handleUpdateStepTitle(step.id, e.target.value)}
                          className={`w-full mt-1 font-semibold text-sm sm:text-base text-[#493568] bg-transparent border-b border-transparent hover:border-[#493568]/20 focus:border-[#493568] focus:outline-none ${
                            step.completed ? 'line-through text-[#493568]/50' : ''
                          }`}
                        />

                        {step.description && (
                          <p className="text-xs text-[#493568]/70 mt-1 leading-relaxed">
                            {step.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Step Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!step.completed && (
                        <button
                          onClick={() => onStartTimerForStep(taskInput, step.title, step.estimatedMinutes)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#493568] bg-white hover:bg-[#C7B5FF]/30 border border-[#493568]/10 rounded-lg transition-colors cursor-pointer"
                          title="Focus on this step with timer"
                        >
                          <Timer className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Timer</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteStep(step.id)}
                        className="p-1 text-[#493568]/40 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                        title="Remove step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add a manual step */}
          <form onSubmit={handleAddManualStep} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newStepText}
              onChange={(e) => setNewStepText(e.target.value)}
              placeholder="Add your own custom sub-step..."
              className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#493568]/20 focus:outline-none focus:ring-1 focus:ring-[#C7B5FF]"
            />
            <button
              type="submit"
              disabled={!newStepText.trim()}
              className="px-3.5 py-2 text-xs font-semibold text-[#493568] bg-[#F7F1E8] hover:bg-[#ebdcc8] disabled:opacity-40 rounded-xl border border-[#493568]/10 cursor-pointer"
            >
              Add step
            </button>
          </form>

          {/* Save / Complete Actions */}
          <div className="pt-4 border-t border-[#493568]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveToDay}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#493568] hover:bg-[#5f4783] rounded-xl shadow-sm cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4 text-[#FFC978]" />
                <span>Save steps to My Day</span>
              </button>
            </div>

            <button
              onClick={onReturnToDashboard}
              className="text-xs text-[#493568]/70 hover:text-[#493568] font-semibold underline underline-offset-4 cursor-pointer"
            >
              Return to dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
