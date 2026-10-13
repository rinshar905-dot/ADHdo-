import React, { useState, useEffect, useRef } from 'react';
import { TimerState } from '../types';
import { Storage } from '../utils/storage';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Coffee, 
  Sparkles, 
  Flame, 
  Volume2, 
  VolumeX,
  ArrowRight,
  Check
} from 'lucide-react';
import { triggerCelebration, playChime } from '../utils/effects';

interface FocusTimerProps {
  initialTaskTitle?: string;
  initialStepTitle?: string;
  initialPresetMinutes?: 5 | 15 | 25;
  onMarkTaskComplete?: (taskTitle: string) => void;
  onReturnToDashboard: () => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  initialTaskTitle,
  initialStepTitle,
  initialPresetMinutes = 25,
  onMarkTaskComplete,
  onReturnToDashboard,
}) => {
  // Load saved state or default
  const [timerState, setTimerState] = useState<TimerState>(() => {
    const saved = Storage.getTimerState();
    if (saved && saved.remainingSeconds > 0) {
      // Calculate elapsed time if it was running
      if (saved.isRunning && saved.lastStartedTimestamp) {
        const elapsedSec = Math.floor((Date.now() - saved.lastStartedTimestamp) / 1000);
        const nextRemaining = Math.max(0, saved.remainingSeconds - elapsedSec);
        return {
          ...saved,
          remainingSeconds: nextRemaining,
          lastStartedTimestamp: nextRemaining > 0 ? Date.now() : null,
          isRunning: nextRemaining > 0,
        };
      }
      return saved;
    }

    const duration = initialPresetMinutes * 60;
    return {
      taskTitle: initialTaskTitle || 'My focus session',
      stepTitle: initialStepTitle,
      totalDurationSeconds: duration,
      remainingSeconds: duration,
      isRunning: false,
      lastStartedTimestamp: null,
      presetMinutes: initialPresetMinutes,
      completedSessionsCount: 0,
    };
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const celebrationFiredRef = useRef(false);

  // Sync state to storage
  useEffect(() => {
    Storage.saveTimerState(timerState);
  }, [timerState]);

  // Drift-free interval loop using real elapsed time
  useEffect(() => {
    if (!timerState.isRunning) return;

    const intervalId = window.setInterval(() => {
      setTimerState((prev) => {
        if (!prev.isRunning || !prev.lastStartedTimestamp) return prev;

        const now = Date.now();
        const deltaSeconds = Math.floor((now - prev.lastStartedTimestamp) / 1000);

        if (deltaSeconds >= 1) {
          const nextRemaining = Math.max(0, prev.remainingSeconds - deltaSeconds);

          if (nextRemaining === 0) {
            // Timer finished!
            if (!celebrationFiredRef.current) {
              celebrationFiredRef.current = true;
              triggerCelebration();
              if (soundEnabled) playChime('timer-end');
              setIsCompletedModalOpen(true);
            }
            return {
              ...prev,
              remainingSeconds: 0,
              isRunning: false,
              lastStartedTimestamp: null,
              completedSessionsCount: prev.completedSessionsCount + 1,
            };
          }

          return {
            ...prev,
            remainingSeconds: nextRemaining,
            lastStartedTimestamp: now,
          };
        }

        return prev;
      });
    }, 250);

    return () => clearInterval(intervalId);
  }, [timerState.isRunning, soundEnabled]);

  const handleStart = () => {
    celebrationFiredRef.current = false;
    setTimerState((prev) => ({
      ...prev,
      isRunning: true,
      lastStartedTimestamp: Date.now(),
    }));
  };

  const handlePause = () => {
    setTimerState((prev) => {
      let currentRemaining = prev.remainingSeconds;
      if (prev.lastStartedTimestamp) {
        const delta = Math.floor((Date.now() - prev.lastStartedTimestamp) / 1000);
        currentRemaining = Math.max(0, prev.remainingSeconds - delta);
      }
      return {
        ...prev,
        remainingSeconds: currentRemaining,
        isRunning: false,
        lastStartedTimestamp: null,
      };
    });
  };

  const handleReset = (preset?: 5 | 15 | 25) => {
    celebrationFiredRef.current = false;
    const targetMinutes = preset ?? timerState.presetMinutes;
    const duration = targetMinutes * 60;
    setTimerState((prev) => ({
      ...prev,
      presetMinutes: targetMinutes,
      totalDurationSeconds: duration,
      remainingSeconds: duration,
      isRunning: false,
      lastStartedTimestamp: null,
    }));
  };

  const handlePresetSelect = (mins: 5 | 15 | 25) => {
    handleReset(mins);
  };

  const minutes = Math.floor(timerState.remainingSeconds / 60);
  const seconds = timerState.remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress =
    timerState.totalDurationSeconds > 0
      ? ((timerState.totalDurationSeconds - timerState.remainingSeconds) / timerState.totalDurationSeconds) * 100
      : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* 1. Header Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#493568]/10 shadow-sm text-center relative overflow-hidden">
        <div className="flex items-center justify-between gap-4 mb-2">
          <span className="text-xs font-semibold text-[#493568]/60 uppercase tracking-wider">
            Focus Session · Drift-Free Timer
          </span>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 text-[#493568]/60 hover:text-[#493568] hover:bg-[#F7F1E8] rounded-xl transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute chimes' : 'Unmute chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Current Task Display */}
        <div className="max-w-lg mx-auto space-y-1">
          <span className="text-xs font-semibold text-[#493568]/60 uppercase tracking-widest">
            Currently Focusing On
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#493568] truncate">
            {timerState.taskTitle || 'My Focus Step'}
          </h1>
          {timerState.stepTitle && (
            <p className="text-sm font-medium text-[#493568]/70 italic">
              Step: {timerState.stepTitle}
            </p>
          )}
        </div>

        {/* Presets Toggle */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {([5, 15, 25] as const).map((mins) => (
            <button
              key={mins}
              onClick={() => handlePresetSelect(mins)}
              disabled={timerState.isRunning}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                timerState.presetMinutes === mins
                  ? 'bg-[#493568] text-white shadow-sm'
                  : 'bg-[#F7F1E8] text-[#493568] hover:bg-[#ebdcc8] border border-[#493568]/10 disabled:opacity-50'
              }`}
            >
              {mins === 5 ? '⚡ 5 min micro-burst' : mins === 15 ? '🌱 15 min gentle' : '🎯 25 min deep'}
            </button>
          ))}
        </div>

        {/* Circular / Large Digital Countdown Display */}
        <div className="my-10 relative flex flex-col items-center justify-center">
          {/* Subtle Circular Progress Arc */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-[#F7F1E8]"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-[#C7B5FF] transition-all duration-300 ease-linear"
                strokeWidth="7"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (276.46 * progress) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Numeric Display inside */}
            <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
              <span className="text-5xl sm:text-6xl font-mono font-black tabular-nums tracking-tighter text-[#493568]">
                {timeFormatted}
              </span>
              <span className="text-xs font-semibold text-[#493568]/60 uppercase tracking-widest mt-1">
                {timerState.isRunning ? 'In Progress' : timerState.remainingSeconds === 0 ? 'Completed' : 'Ready'}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {!timerState.isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2.5 px-8 py-4 bg-[#493568] hover:bg-[#5f4783] active:scale-95 text-white text-base font-bold rounded-2xl shadow-md transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>{timerState.remainingSeconds < timerState.totalDurationSeconds ? 'Resume' : 'Start Focus'}</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-2.5 px-8 py-4 bg-[#FFC978] hover:bg-[#f3be6d] active:scale-95 text-[#493568] text-base font-bold rounded-2xl shadow-md transition-all cursor-pointer"
            >
              <Pause className="w-5 h-5 fill-[#493568]" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={() => handleReset()}
            className="p-4 text-[#493568]/70 hover:text-[#493568] hover:bg-[#F7F1E8] rounded-2xl border border-[#493568]/10 transition-colors cursor-pointer"
            title="Reset timer"
            aria-label="Reset timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Motivational note */}
        <p className="text-xs text-[#493568]/70 mt-6 max-w-sm mx-auto leading-relaxed">
          *Starting is the victory. If you need to stop early, that still counts as meaningful progress.
        </p>
      </section>

      {/* Completion Modal / Dialog */}
      {isCompletedModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#493568]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-[#BDE8D1] shadow-2xl text-center space-y-5 animate-scaleUp">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#BDE8D1] flex items-center justify-center text-[#493568]">
              <Sparkles className="w-8 h-8 text-[#493568]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#493568]/70">
                Session Complete!
              </span>
              <h2 className="text-2xl font-extrabold text-[#493568] mt-1">
                You showed up and did it!
              </h2>
              <p className="text-sm text-[#493568]/80 mt-2 leading-relaxed">
                Whether you finished the whole task or simply started the engine, you broke through friction.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {timerState.taskTitle && onMarkTaskComplete && (
                <button
                  onClick={() => {
                    onMarkTaskComplete(timerState.taskTitle || '');
                    setIsCompletedModalOpen(false);
                    onReturnToDashboard();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#BDE8D1] hover:bg-[#a9e0c1] text-[#493568] font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark task as finished</span>
                </button>
              )}

              <button
                onClick={() => {
                  handleReset(5);
                  setIsCompletedModalOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#F7F1E8] hover:bg-[#ebdcc8] text-[#493568] font-semibold rounded-xl border border-[#493568]/10 transition-colors cursor-pointer"
              >
                <Coffee className="w-4 h-4 text-[#493568]" />
                <span>Take a 5-minute breather</span>
              </button>

              <button
                onClick={() => {
                  handleReset(timerState.presetMinutes);
                  setIsCompletedModalOpen(false);
                }}
                className="w-full py-2.5 text-xs text-[#493568]/70 hover:text-[#493568] font-semibold cursor-pointer"
              >
                Start another focus session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
