import React from 'react';
import { Logo } from './Logo';
import { LifeBuoy, Sun, PlayCircle, Timer, Sparkles, SlidersHorizontal, Bot, Menu, X } from 'lucide-react';

export type ActiveTab = 'my-day' | 'unstuck' | 'help-start' | 'timer' | 'brain-dump' | 'adapt-day' | 'buddy';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenUnstuckQuick: () => void;
  unfinishedCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenUnstuckQuick,
  unfinishedCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'my-day', label: 'My Day', icon: Sun },
    { id: 'unstuck', label: 'Unstuck Mode', icon: LifeBuoy },
    { id: 'help-start', label: 'Help Me Start', icon: PlayCircle },
    { id: 'timer', label: 'Focus Timer', icon: Timer },
    { id: 'brain-dump', label: 'Brain Dump', icon: Sparkles },
    { id: 'adapt-day', label: 'Adapt Day', icon: SlidersHorizontal },
    { id: 'buddy', label: 'ADHdo Buddy', icon: Bot },
  ];

  const handleLinkClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F7F1E8]/95 backdrop-blur-md border-b border-[#493568]/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4 sm:gap-6">
          {/* Zone 1: Brand Wordmark */}
          <div className="shrink-0">
            <Logo
              size="sm"
              showTagline={true}
              onClick={() => handleLinkClick('my-day')}
            />
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium text-[#493568]/80">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`flex items-center gap-1.5 py-1.5 transition-colors whitespace-nowrap shrink-0 relative cursor-pointer ${
                    isActive
                      ? 'text-[#493568] font-bold'
                      : 'hover:text-[#493568] text-[#493568]/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#493568]' : 'text-[#493568]/60'}`} />
                  <span>{link.label}</span>
                  {link.id === 'my-day' && unfinishedCount > 0 && (
                    <span className="text-xs font-mono font-semibold tabular-nums text-[#493568]/70">
                      ({unfinishedCount})
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#493568] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action & Mobile Hamburger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenUnstuckQuick}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#493568] bg-[#C7B5FF] hover:bg-[#b59ffa] active:scale-95 transition-all rounded-xl shadow-sm hover:shadow whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LifeBuoy className="w-4 h-4 text-[#493568]" />
              <span className="hidden sm:inline">Help me get unstuck</span>
              <span className="sm:hidden">Unstick</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#493568] hover:bg-[#493568]/10 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#493568]/10 bg-[#F7F1E8] px-4 pt-3 pb-6 space-y-1 shadow-lg animate-fadeIn">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-[#C7B5FF]/40 text-[#493568] font-bold'
                    : 'text-[#493568]/80 hover:bg-[#493568]/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-[#493568]" />
                  <span>{link.label}</span>
                </div>
                {link.id === 'my-day' && unfinishedCount > 0 && (
                  <span className="text-xs font-mono font-bold tabular-nums text-[#493568]/70">
                    {unfinishedCount} unfinished
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
