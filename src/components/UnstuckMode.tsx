import React, { useState } from 'react';
import { BlockerType, Task, UnstuckResult, EnergyLevel } from '../types';
import { requestUnstuckAdvice } from '../services/aiService';
import { 
  LifeBuoy, 
  ArrowRight, 
  Minimize2, 
  Timer, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  Compass, 
  Flame, 
  Battery,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { playChime } from '../utils/effects';

interface UnstuckModeProps {
  initialTaskTitle?: string;
  existingTasks: Task[];
  currentEnergy?: EnergyLevel | null;
  onStartFocusSession: (taskTitle: string, stepTitle: string, minutes: number) => void;
  onSaveStepAsTask: (stepTitle: string) => void;
  onReturnToDashboard: () => void;
}

export const UnstuckMode: React.FC<UnstuckModeProps> = ({
  initialTaskTitle = '',
  existingTasks,
  currentEnergy,
  onStartFocusSession,
  onSaveStepAsTask,
  onReturnToDashboard,
}) => {
  const [taskInput, setTaskInput] = useState(initialTaskTitle);
  const [selectedBlocker, setSelectedBlocker] = useState<BlockerType | null>(null);
  
  // Contextual inputs
  const [availableMinutes, setAvailableMinutes] = useState<number | ''>('');
  const [extraContext, setExtraContext] = useState<string>('');
  const [showAdvancedContext, setShowAdvancedContext] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<UnstuckResult | null>(null);
  const [makeSmallerCount, setMakeSmallerCount] = useState(0);
  const [sourceTag, setSourceTag] = useState<'gemini' | 'fallback' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const blockers: { id: BlockerType; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      id: 'cant-start',
      label: "I can't get started.",
      desc: 'The starting threshold feels like a brick wall.',
      icon: Compass,
    },
    {
      id: 'overwhelmed',
      label: 'Everything feels overwhelming.',
      desc: 'Too many moving parts crowded in your brain.',
      icon: Flame,
    },
    {
      id: 'distracted',
      label: 'I got distracted.',
      desc: 'You lost the thread and want to return without guilt.',
      icon: RotateCcw,
    },
    {
      id: 'running-out-of-time',
      label: "I'm running out of time.",
      desc: 'Urgency is causing paralysis. Let’s do the bare essentials.',
      icon: Clock,
    },
    {
      id: 'no-energy',
      label: 'I have no energy.',
      desc: 'Low battery. Heavy thinking is off the table right now.',
      icon: Battery,
    },
  ];

  const handleFetchAdvice = async (smallerCount: number = 0) => {
    if (!taskInput.trim() || !selectedBlocker) return;

    setIsLoading(true);
    setErrorMessage(null);

    const res = await requestUnstuckAdvice({
      task: taskInput.trim(),
      blocker: selectedBlocker,
      makeSmallerCount: smallerCount,
      availableMinutes: typeof availableMinutes === 'number' ? availableMinutes : undefined,
      energyLevel: currentEnergy || undefined,
      extraContext: extraContext.trim() || undefined,
      previousAction: result ? result.nextAction : undefined,
    });

    setIsLoading(false);
    setResult(res.result);
    setSourceTag(res.source);
    setMakeSmallerCount(smallerCount);

    if (res.error && res.source === 'fallback') {
      setErrorMessage(res.error);
    }

    playChime('sparkle');
  };

  const handleMakeSmaller = () => {
    const nextCount = makeSmallerCount + 1;
    handleFetchAdvice(nextCount);
  };

  const handleReset = () => {
    setResult(null);
    setMakeSmallerCount(0);
    setSourceTag(null);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* 1. Header Banner */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#493568]/10 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-[#493568]/60 uppercase tracking-wider">
                Signature Companion · Unstuck Mode
              </span>
              <span className="text-xs font-bold text-[#493568] bg-[#C7B5FF]/40 px-2 py-0.5 rounded-md">
                Grounded Reasoning
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#493568] tracking-tight">
              “Okay. Let's make this smaller.”
            </h1>
            <p className="text-sm sm:text-base text-[#493568]/80 mt-2 max-w-2xl leading-relaxed">
              Tell ADHdo! what you’re trying to do and what is blocking you. We’ll isolate one concrete, immediate micro-action directly on your task.
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

      {/* 2. Interactive Input Flow */}
      {!result ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#493568]/10 shadow-sm space-y-6">
          {/* Step 1: Which Task? */}
          <div className="space-y-3">
            <label htmlFor="unstuck-task-input" className="block text-sm font-bold text-[#493568]">
              1. What task are you struggling with?
            </label>
            <input
              id="unstuck-task-input"
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="e.g. Study Theory of Computation for Monday's exam, submit Java assignment, finish tax form..."
              className="w-full px-4 py-3 rounded-2xl border border-[#493568]/20 focus:outline-none focus:ring-2 focus:ring-[#C7B5FF] text-base text-[#493568] placeholder:text-[#493568]/40"
            />

            {/* Quick Pick from Existing Tasks if any */}
            {existingTasks.filter((t) => !t.completed).length > 0 && (
              <div className="flex items-center flex-wrap gap-2 pt-1">
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

          {/* Step 2: What is the blocker? */}
          <div className="space-y-3 pt-2">
            <span className="block text-sm font-bold text-[#493568]">
              2. What is making this difficult right now?
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {blockers.map((b) => {
                const isSelected = selectedBlocker === b.id;
                const Icon = b.icon;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBlocker(b.id)}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#C7B5FF]/25 border-[#493568] ring-2 ring-[#493568]/20 shadow-sm'
                        : 'bg-[#F7F1E8] border-[#493568]/10 hover:border-[#C7B5FF] hover:bg-white'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isSelected ? 'bg-[#493568] text-white' : 'bg-white text-[#493568]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#493568]">{b.label}</p>
                      <p className="text-xs text-[#493568]/70 mt-0.5 leading-snug">{b.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Optional Context Accordion (Time Available & Where you're at) */}
          <div className="pt-2 border-t border-[#493568]/10">
            <button
              type="button"
              onClick={() => setShowAdvancedContext(!showAdvancedContext)}
              className="flex items-center gap-2 text-xs font-bold text-[#493568]/80 hover:text-[#493568] transition-colors cursor-pointer py-1"
            >
              <span>+ Add context (Time available, current status)</span>
              {showAdvancedContext ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvancedContext && (
              <div className="mt-3 p-4 bg-[#F7F1E8]/70 rounded-2xl border border-[#493568]/10 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                <div>
                  <label htmlFor="available-minutes-input" className="block text-xs font-bold text-[#493568] mb-1">
                    Available Time (minutes):
                  </label>
                  <input
                    id="available-minutes-input"
                    type="number"
                    min="1"
                    max="480"
                    value={availableMinutes}
                    onChange={(e) => setAvailableMinutes(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 20, 30, 45"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#493568]/20 focus:outline-none focus:ring-1 focus:ring-[#C7B5FF] bg-white text-[#493568]"
                  />
                  <div className="flex gap-1.5 mt-2">
                    {[10, 20, 30, 45].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setAvailableMinutes(m)}
                        className={`text-xs px-2 py-0.5 rounded-md font-medium cursor-pointer ${
                          availableMinutes === m ? 'bg-[#493568] text-white' : 'bg-white border border-[#493568]/10 text-[#493568]/70'
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="extra-context-input" className="block text-xs font-bold text-[#493568] mb-1">
                    Where you're currently at:
                  </label>
                  <input
                    id="extra-context-input"
                    type="text"
                    value={extraContext}
                    onChange={(e) => setExtraContext(e.target.value)}
                    placeholder="e.g. Instructions available, but project is not open"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#493568]/20 focus:outline-none focus:ring-1 focus:ring-[#C7B5FF] bg-white text-[#493568]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-[#493568]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#493568]/60">
              *Generates ONE concrete next action directly related to "{taskInput || 'your task'}".
            </p>
            <button
              onClick={() => handleFetchAdvice(0)}
              disabled={!taskInput.trim() || !selectedBlocker || isLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#493568] hover:bg-[#5f4783] disabled:opacity-40 text-white font-bold rounded-2xl shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-[#FFC978]" />
                  <span>Isolating micro-action...</span>
                </>
              ) : (
                <>
                  <span>Show me the small step</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* 3. Generated Context-Aware Micro-Action Output Card */
        <div className="bg-white rounded-3xl p-6 sm:p-9 border-2 border-[#C7B5FF] shadow-lg space-y-6 animate-fadeIn">
          {/* Header acknowledgement */}
          <div className="flex items-start justify-between gap-4 border-b border-[#493568]/10 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-[#493568]/60 uppercase tracking-wider">
                  Target Task
                </span>
                <span className="text-xs font-mono font-bold text-[#493568] bg-[#FFC978]/40 px-2 py-0.5 rounded">
                  ~{result.estimatedMinutes} min micro-action
                </span>
                {makeSmallerCount > 0 && (
                  <span className="text-xs font-bold text-[#493568] bg-[#BDE8D1] px-2 py-0.5 rounded">
                    Reduction Level {makeSmallerCount}
                  </span>
                )}
                {sourceTag && (
                  <span className="text-xs font-mono text-[#493568]/70">
                    [{sourceTag === 'gemini' ? 'Gemini 3.8 Flash' : 'Offline Engine'}]
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#493568]">
                “{taskInput}”
              </h2>
            </div>

            <button
              onClick={handleReset}
              className="text-xs text-[#493568]/60 hover:text-[#493568] flex items-center gap-1.5 p-2 rounded-xl hover:bg-[#F7F1E8] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Change task or blocker</span>
            </button>
          </div>

          {/* Error Banner if fallback was triggered with an error */}
          {errorMessage && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Notice: Gemini request had an issue ({errorMessage}). Displaying task-aware offline advice.</span>
              </div>
              <button
                onClick={() => handleFetchAdvice(makeSmallerCount)}
                className="font-bold underline ml-2 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Understanding (Brief interpretation of actual task and blocker) */}
          <div className="bg-[#F7F1E8] rounded-2xl p-5 border border-[#493568]/10 space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#493568]/70">
              Obstacle Analysis:
            </span>
            <p className="text-sm font-semibold text-[#493568] leading-relaxed">
              {result.understanding}
            </p>
          </div>

          {/* THE SINGLE CONCRETE ACTION */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#C7B5FF]/20 border-2 border-[#C7B5FF] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#493568]">
                Your ONE Action Right Now:
              </span>
              <span className="text-xs font-mono font-bold text-[#493568] bg-white px-2 py-0.5 rounded-md border border-[#493568]/10">
                {result.estimatedMinutes} minutes
              </span>
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-[#493568] leading-snug">
              {result.nextAction}
            </p>
            {result.whyThisHelps && (
              <p className="text-xs sm:text-sm text-[#493568]/80 pt-2 border-t border-[#493568]/15">
                <span className="font-bold text-[#493568]">Why this fits:</span> {result.whyThisHelps}
              </p>
            )}
          </div>

          {/* Smaller Alternative fallback */}
          {result.smallerAlternative && (
            <div className="p-4 bg-[#FFC978]/15 rounded-2xl border border-[#FFC978]/40 space-y-1 text-xs sm:text-sm">
              <span className="font-bold text-[#493568]">Still feeling friction? Try this even simpler alternative:</span>
              <p className="text-[#493568]/85">{result.smallerAlternative}</p>
            </div>
          )}

          {/* Follow-up question if essential info is missing */}
          {result.followUpQuestion && (
            <div className="p-4 bg-white rounded-2xl border border-[#493568]/20 flex items-start gap-2.5 text-xs sm:text-sm">
              <HelpCircle className="w-4 h-4 text-[#493568] mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-[#493568]">Focused question: </span>
                <span className="text-[#493568]/80">{result.followUpQuestion}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#493568]/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Start Focus Session */}
              <button
                onClick={() => onStartFocusSession(taskInput, result.nextAction, result.estimatedMinutes || 5)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#493568] hover:bg-[#5f4783] text-white text-sm font-bold rounded-xl shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Timer className="w-4 h-4 text-[#FFC978]" />
                <span>Focus on this step ({result.estimatedMinutes}m)</span>
              </button>

              {/* Make it even smaller */}
              <button
                onClick={handleMakeSmaller}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#FFC978]/30 hover:bg-[#FFC978]/50 text-[#493568] text-sm font-bold rounded-xl border border-[#FFC978] transition-colors cursor-pointer whitespace-nowrap"
                title="If this step still creates resistance, let's cut it down further"
              >
                <Minimize2 className="w-4 h-4 text-[#493568]" />
                <span>Make it even smaller</span>
              </button>

              {/* Save Step to My Day */}
              <button
                onClick={() => onSaveStepAsTask(result.nextAction)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#F7F1E8] hover:bg-[#ebdcc8] text-[#493568] text-sm font-semibold rounded-xl border border-[#493568]/15 transition-colors cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4 text-[#493568]" />
                <span>Save step to My Day</span>
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
