import React from 'react';
import { BookOpen, Calendar, Clock, HeartHandshake, Settings } from 'lucide-react';
import { ActiveTab, useApp } from '../../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, t } = useApp();

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'home', label: t.navHome, icon: Clock },
    { id: 'calendar', label: t.navCalendar, icon: Calendar },
    { id: 'hadith', label: t.navHadith, icon: BookOpen },
    { id: 'dua-amal', label: t.navDuaAmal, icon: HeartHandshake },
    { id: 'settings', label: t.navSettings, icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-colors pb-safe">
      <div className="max-w-md md:max-w-xl mx-auto grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-all relative cursor-pointer ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute top-1 w-8 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] md:text-[11px] mt-1 tracking-tight truncate max-w-[68px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
