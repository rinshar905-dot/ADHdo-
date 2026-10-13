import React, { useState, useRef, useEffect } from 'react';
import { BuddyMessage, Task, EnergyLevel } from '../types';
import { requestBuddyChat } from '../services/aiService';
import { 
  Sparkles, 
  Send, 
  LifeBuoy, 
  Timer, 
  PlayCircle, 
  Plus, 
  Bot, 
  User, 
  RotateCcw, 
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { playChime } from '../utils/effects';

interface ADHdoBuddyProps {
  tasks: Task[];
  energy: EnergyLevel | null;
  activeTimerTask?: string;
  onAddTask: (task: { title: string; priority: 'high' | 'medium' | 'low'; isEssential: boolean }) => void;
  onStartTimer: (taskTitle: string, minutes: number) => void;
  onOpenUnstuck: (taskTitle: string) => void;
  onOpenHelpStart: (taskTitle: string) => void;
}

export const ADHdoBuddy: React.FC<ADHdoBuddyProps> = ({
  tasks,
  energy,
  activeTimerTask,
  onAddTask,
  onStartTimer,
  onOpenUnstuck,
  onOpenHelpStart,
}) => {
  const [messages, setMessages] = useState<BuddyMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: "Hey there! I'm your ADHdo Buddy. Whether you're feeling stuck, overwhelmed, or just need to figure out what to touch next, I'm right here with you. What's on your mind?",
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [sourceStatus, setSourceStatus] = useState<'gemini' | 'fallback' | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: BuddyMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);
    setLastError(null);

    const res = await requestBuddyChat(nextMessages, {
      tasks,
      energy,
      activeTimerTask,
    });

    setIsLoading(false);
    setSourceStatus(res.source);

    if (res.error && res.source === 'fallback') {
      setLastError(res.error);
    }

    const assistantMsg: BuddyMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: res.reply,
      timestamp: Date.now(),
      actionSuggestion: res.actionSuggestion,
    };

    setMessages([...nextMessages, assistantMsg]);
    playChime('sparkle');
  };

  const handleActionClick = (action: any) => {
    if (!action) return;
    if (action.type === 'create_task') {
      onAddTask({
        title: action.payload || 'New task from Buddy',
        priority: 'medium',
        isEssential: true,
      });
      playChime('complete');
    } else if (action.type === 'start_timer') {
      onStartTimer(action.payload || 'Focus Burst', 5);
    } else if (action.type === 'open_unstuck') {
      onOpenUnstuck(action.payload || '');
    } else if (action.type === 'open_help_start') {
      onOpenHelpStart(action.payload || '');
    }
  };

  const quickPrompts = [
    "What should I do next?",
    "Make that smaller",
    "I'm feeling distracted",
    "Help me pick one priority",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* 1. Header Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#493568]/10 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-[#493568]/60 uppercase tracking-wider">
                Interactive Companion · ADHdo Buddy
              </span>
              <span className="text-xs font-bold text-[#493568] bg-[#FFC978]/40 px-2 py-0.5 rounded-md">
                Multi-Turn Grounded
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#493568] tracking-tight">
              Talk through friction in plain language.
            </h1>
            <p className="text-sm text-[#493568]/80 mt-1 max-w-2xl leading-relaxed">
              Tell me where you are stuck, ask me to make an action smaller, or ask what to do next. I know your current tasks ({tasks.filter(t => !t.completed).length} unfinished) and energy ({energy || 'unspecified'}).
            </p>
          </div>

          <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
            {sourceStatus && (
              <span className={`text-[11px] font-mono px-2.5 py-1 rounded-lg font-semibold ${
                sourceStatus === 'gemini' 
                  ? 'bg-[#BDE8D1]/40 text-[#493568] border border-[#BDE8D1]' 
                  : 'bg-[#FFC978]/30 text-[#493568] border border-[#FFC978]'
              }`}>
                {sourceStatus === 'gemini' ? '● Connected to Gemini' : '○ Offline Fallback Mode'}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 2. Chat Log */}
      <div className="bg-white rounded-3xl border border-[#493568]/10 shadow-sm overflow-hidden flex flex-col h-[520px]">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-[#493568] text-white'
                      : 'bg-[#C7B5FF] text-[#493568]'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed space-y-2.5 ${
                    isUser
                      ? 'bg-[#493568] text-white'
                      : 'bg-[#F7F1E8] text-[#493568] border border-[#493568]/10'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {/* Optional Action Suggestion Button */}
                  {m.actionSuggestion && (
                    <div className="pt-2 border-t border-[#493568]/15 flex items-center gap-2">
                      <button
                        onClick={() => handleActionClick(m.actionSuggestion)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#493568] hover:bg-[#5f4783] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#FFC978]" />
                        <span>{m.actionSuggestion.label}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#C7B5FF] text-[#493568] flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#F7F1E8] rounded-2xl p-4 text-sm text-[#493568] border border-[#493568]/10 flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-[#FFC978]" />
                <span className="text-xs font-semibold text-[#493568]/70">ADHdo Buddy is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error notification banner if API failed */}
        {lastError && (
          <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-xs text-rose-700">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Gemini unavailable: {lastError}. Offline assistant active.</span>
            </div>
            <button
              onClick={() => handleSendMessage(messages[messages.length - 1]?.content)}
              className="text-xs font-bold underline cursor-pointer hover:text-rose-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* Quick prompt suggestions strip */}
        <div className="px-4 py-2.5 bg-[#F7F1E8]/60 border-t border-[#493568]/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-[#493568]/50 uppercase tracking-wider shrink-0">
            Quick prompts:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="text-xs bg-white hover:bg-[#C7B5FF]/30 text-[#493568] px-2.5 py-1 rounded-lg border border-[#493568]/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 bg-white border-t border-[#493568]/10 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message (e.g., 'What should I tackle first?' or 'Make this smaller')..."
            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-[#493568]/20 focus:outline-none focus:ring-2 focus:ring-[#C7B5FF] text-[#493568] placeholder:text-[#493568]/40"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-[#493568] hover:bg-[#5f4783] disabled:opacity-40 text-white rounded-xl transition-all shadow-sm cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
