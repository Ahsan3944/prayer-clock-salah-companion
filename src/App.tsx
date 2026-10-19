import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopHeader } from './components/navigation/TopHeader';
import { BottomNav } from './components/navigation/BottomNav';
import { HomeView } from './components/home/HomeView';
import { CalendarView } from './components/calendar/CalendarView';
import { HadithView } from './components/hadith/HadithView';
import { DuaAmalView } from './components/dua-amal/DuaAmalView';
import { SettingsView } from './components/settings/SettingsView';

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors antialiased">
      {/* 3-Zone Sticky Top Bar */}
      <TopHeader />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-4 md:py-6">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'hadith' && <HadithView />}
        {activeTab === 'dua-amal' && <DuaAmalView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Mobile-First Fixed Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
