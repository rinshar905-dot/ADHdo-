import React from 'react';
import { LastActiveState } from '../types';
import { RotateCcw, ArrowRight, X, Sparkles, LifeBuoy } from 'lucide-react';

interface BringMeBackBannerProps {
  lastState: LastActiveState;
  onResumeTask: (taskId?: string, taskTitle?: string) => void;
  onMakeSmaller: (taskTitle: string) => void;
  onDismiss: () => void;
}

export const BringMeBackBanner: React.FC<BringMeBackBannerProps> = ({
  lastState,
  onResumeTask,
  onMakeSmaller,
  onDismiss,
}) => {
  const timeDiffMinutes = Math.max(1, Math.round((Date.now() - lastState.timestamp) / 60000));
  const timeLabel =
    timeDiffMinutes < 60
      ? `${timeDiffMinutes} min ago`
      : `${Math.round(timeDiffMinutes / 60)} hour${Math.round(timeDiffMinutes / 60) > 1 ? 's' : ''} ago`;

  return (
    <aside aria-label="Resume previous session" className="relative bg-white border border-[#C7B5FF] rounded-2xl p-4 sm:p-5 shadow-sm mb-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-[#C7B5FF]/30 text-[#493568] rounded-xl shrink-0 mt-0.5">
            <RotateCcw className="w-5 h-5 text-[#493568]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#493568]/60 uppercase tracking-wider">
                Session Recovery · {timeLabel}
              </span>
              <span className="text-xs text-[#BDE8D1] bg-[#493568] px-2 py-0.5 rounded-md font-medium">
                No rush
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#493568] mt-0.5">
              Welcome back. Want to pick up where you left off?
            </h2>
            <p className="text-sm text-[#493568]/80 mt-1">
              You were with{' '}
              <strong className="text-[#493568] font-semibold underline decoration-[#FFC978] decoration-2">
                “{lastState.taskTitle || 'your previous focus'}”
              </strong>
              {lastState.stepTitle && (
                <span>
                  {' '}— step: <span className="italic">{lastState.stepTitle}</span>
                </span>
              )}
              .
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0 self-end sm:self-center">
          <button
            onClick={() => onResumeTask(lastState.taskId, lastState.taskTitle)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#493568] hover:bg-[#5f4783] active:scale-95 transition-all rounded-xl shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span>Resume task</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onMakeSmaller(lastState.taskTitle || 'this task')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#493568] bg-[#F7F1E8] hover:bg-[#ebdcc8] transition-colors rounded-xl border border-[#493568]/15 cursor-pointer whitespace-nowrap"
            title="If resuming feels too big, start with a tiny bite"
          >
            <LifeBuoy className="w-3.5 h-3.5 text-[#493568]" />
            <span>Need a smaller step?</span>
          </button>

          <button
            onClick={onDismiss}
            className="p-2 text-[#493568]/50 hover:text-[#493568] hover:bg-[#F7F1E8] rounded-xl transition-colors cursor-pointer"
            aria-label="Dismiss banner"
            title="Clear and start fresh"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
