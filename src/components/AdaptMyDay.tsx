import React, { useState } from 'react';
import { Task, EnergyLevel, AdaptDayResult } from '../types';
import { requestAdaptDayGuidance } from '../services/aiService';
import { 
  SlidersHorizontal, 
  Sparkles, 
  Star, 
  ArrowRight, 
  CheckCircle2, 
  Target, 
  Coffee, 
  ShieldCheck, 
  Info,
  Timer,
  AlertCircle,
  Clock
} from 'lucide-react';
import { triggerCelebration, playChime } from '../utils/effects';

interface AdaptMyDayProps {
  tasks: Task[];
  energy: EnergyLevel | null;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onSelectSingleFocus: (task: Task) => void;
  onReturnToDashboard: () => void;
}

export const AdaptMyDay: React.FC<AdaptMyDayProps> = ({
  tasks,
  energy,
  onUpdateTask,
  onSelectSingleFocus,
  onReturnToDashboard,
}) => {
  const [availableMinutes, setAvailableMinutes] = useState<number | ''>('');
  const [aiResult, setAiResult] = useState<AdaptDayResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sourceTag, setSourceTag] = useState<'gemini' | 'fallback' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const unfinishedTasks = tasks.filter((t) => !t.completed);
  const essentialTasks = unfinishedTasks.filter((t) => t.isEssential);
  const optionalTasks = unfinishedTasks.filter((t) => !t.isEssential);

  const handleGetAiGuidance = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const res = await requestAdaptDayGuidance(
      tasks,
      energy,
      typeof availableMinutes === 'number' ? availableMinutes : undefined
    );

    setIsLoading(false);
    setAiResult(res.result);
    setSourceTag(res.source);

    if (res.error && res.source === 'fallback') {
      setErrorMessage(res.error);
    }

    playChime('sparkle');
  };

  const handleApplySuggestedPlan = () => {
    if (!aiResult) return;
    
    // Apply suggested essentials
    aiResult.suggestedEssentialIds.forEach((id) => {
      onUpdateTask(id, { isEssential: true });
    });

    // Apply suggested optionals
    aiResult.suggestedOptionalIds.forEach((id) => {
      onUpdateTask(id, { isEssential: false });
    });

    triggerCelebration();
    playChime('complete');
  };

  const handleToggleEssential = (task: Task) => {
    onUpdateTask(task.id, { isEssential: !task.isEssential });
  };

  const handleCyclePriority = (task: Task) => {
    const cycle: Record<string, 'high' | 'medium' | 'low'> = {
      low: 'medium',
      medium: 'high',
      high: 'low',
    };
    onUpdateTask(task.id, { priority: cycle[task.priority] });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* 1. Header Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#493568]/10 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-[#493568]/60 uppercase tracking-wider">
                Replanning & Overwhelm Tamer · Adapt My Day
              </span>
              <span className="text-xs font-bold text-[#493568] bg-[#FFC978]/40 px-2 py-0.5 rounded-md">
                Cut the Noise
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#493568] tracking-tight">
              When the plan falls apart, adapt without guilt.
            </h1>
            <p className="text-sm sm:text-base text-[#493568]/80 mt-2 max-w-2xl leading-relaxed">
              Days rarely go as scheduled. Instead of cramming 10 things into exhausted hours, pick ONE non-negotiable step and defer the rest with confidence.
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

      {/* 2. AI Pacing & Overwhelm Counselor */}
      <div className="bg-[#F7F1E8] rounded-3xl p-6 sm:p-8 border border-[#493568]/10 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#493568]" />
              <h2 className="text-base sm:text-lg font-bold text-[#493568]">
                Need help deciding what to cut?
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#493568]/70 mt-0.5">
              Reviewing your {unfinishedTasks.length} unfinished tasks with energy: <strong>{energy || 'Doing okay'}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#493568]/15">
              <Clock className="w-4 h-4 text-[#493568]/60" />
              <input
                type="number"
                min="5"
                max="360"
                value={availableMinutes}
                onChange={(e) => setAvailableMinutes(e.target.value ? Number(e.target.value) : '')}
                placeholder="Mins left (e.g. 30)"
                className="w-28 text-xs font-semibold text-[#493568] focus:outline-none"
              />
            </div>

            <button
              onClick={handleGetAiGuidance}
              disabled={isLoading || unfinishedTasks.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#493568] hover:bg-[#5f4783] disabled:opacity-40 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-[#FFC978]" />
                  <span>Pacing your day...</span>
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 text-[#FFC978]" />
                  <span>Suggest 1 priority for today</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Gemini notice: {errorMessage}. Offline pacing used.</span>
            </div>
            <button
              onClick={handleGetAiGuidance}
              className="font-bold underline ml-2 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {aiResult && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-[#C7B5FF] space-y-4 animate-fadeIn">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#493568]/70">
                Recommended Focus Anchor
              </span>
              <p className="text-xl font-extrabold text-[#493568] mt-0.5">
                “{aiResult.oneFocusTask}”
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#493568]/10 text-xs sm:text-sm text-[#493568]">
              <p className="leading-relaxed">
                <strong className="font-bold">Realistic Advice: </strong>
                {aiResult.realisticAdvice}
              </p>
              {aiResult.tradeOffs && (
                <p className="text-[#493568]/80 leading-relaxed">
                  <strong className="font-bold">Trade-Off Analysis: </strong>
                  {aiResult.tradeOffs}
                </p>
              )}
            </div>

            {(aiResult.suggestedEssentialIds.length > 0 || aiResult.suggestedOptionalIds.length > 0) && (
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-[#493568]/70 font-medium">
                  Gemini identified {aiResult.suggestedEssentialIds.length} essential and {aiResult.suggestedOptionalIds.length} optional tasks.
                </span>
                <button
                  onClick={handleApplySuggestedPlan}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#493568] hover:bg-[#5f4783] rounded-lg transition-colors cursor-pointer"
                >
                  Apply suggested essential/optional tags
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Essential vs Optional Sorting Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#493568]">
            Sort: Essential vs. Optional for Today
          </h3>
          <span className="text-xs text-[#493568]/60">
            Click star to toggle essential status
          </span>
        </div>

        {unfinishedTasks.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#493568]/10">
            <p className="text-sm font-semibold text-[#493568]">No unfinished tasks right now!</p>
            <button
              onClick={onReturnToDashboard}
              className="mt-3 text-xs font-bold text-[#493568] underline cursor-pointer"
            >
              Return to My Day
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column A: Essential (Keep to 1-3 max) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#FFC978] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#493568]/10">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-[#FFC978] text-[#FFC978]" />
                  <h4 className="text-base font-extrabold text-[#493568]">
                    Essential ({essentialTasks.length})
                  </h4>
                </div>
                <span className="text-xs font-semibold text-[#493568]/70">
                  {essentialTasks.length > 3 ? '⚠️ Try to narrow to 1–3' : 'Good realistic limit'}
                </span>
              </div>

              {essentialTasks.length === 0 ? (
                <p className="text-xs text-[#493568]/50 italic py-4 text-center">
                  No tasks marked essential. Star one from the right to anchor your day.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {essentialTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 bg-[#FFC978]/15 rounded-xl border border-[#FFC978]/40 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => handleToggleEssential(t)}
                          className="text-[#493568] hover:text-[#5f4783] cursor-pointer"
                          title="Demote to optional"
                        >
                          <Star className="w-4 h-4 fill-[#FFC978] text-[#493568]" />
                        </button>
                        <span className="text-sm font-bold text-[#493568] truncate">
                          {t.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleCyclePriority(t)}
                          className="text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-white text-[#493568] border border-[#493568]/10 cursor-pointer"
                          title="Click to cycle priority"
                        >
                          {t.priority}
                        </button>
                        <button
                          onClick={() => onSelectSingleFocus(t)}
                          className="px-2.5 py-1 text-xs font-bold text-[#493568] bg-[#C7B5FF] hover:bg-[#b59ffa] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title="Focus solely on this task"
                        >
                          <Timer className="w-3 h-3" />
                          <span>Focus</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Column B: Optional / Nice to have */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#493568]/15 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#493568]/10">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-[#493568]/60" />
                  <h4 className="text-base font-bold text-[#493568]">
                    Optional / Bonus ({optionalTasks.length})
                  </h4>
                </div>
                <span className="text-xs text-[#493568]/60">Zero guilt if unfinished</span>
              </div>

              {optionalTasks.length === 0 ? (
                <p className="text-xs text-[#493568]/50 italic py-4 text-center">
                  All tasks are currently marked essential. Give yourself breathing room by demoting some.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {optionalTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 bg-[#F7F1E8]/70 rounded-xl border border-[#493568]/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => handleToggleEssential(t)}
                          className="text-[#493568]/40 hover:text-[#FFC978] cursor-pointer"
                          title="Promote to essential"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-[#493568] truncate">
                          {t.title}
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleEssential(t)}
                        className="text-xs font-semibold text-[#493568]/60 hover:text-[#493568] cursor-pointer"
                      >
                        Make Essential
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Done button */}
      <div className="pt-4 flex items-center justify-end">
        <button
          onClick={onReturnToDashboard}
          className="px-6 py-2.5 text-sm font-bold text-white bg-[#493568] hover:bg-[#5f4783] rounded-xl shadow-sm cursor-pointer"
        >
          Save Plan & Return to My Day
        </button>
      </div>
    </div>
  );
};
