import React, { useState } from 'react';
import { Compass, MapPin, WifiOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { QiblaCompassModal } from '../qibla/QiblaCompassModal';

export const TopHeader: React.FC = () => {
  const { t, activeLocation, setActiveTab, isOnline } = useApp();
  const [isQiblaOpen, setIsQiblaOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3 md:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2 text-left group cursor-pointer focus-visible:outline-none"
            >
              <span className="text-xl font-bold tracking-tight text-emerald-800 dark:text-emerald-400 font-sans whitespace-nowrap">
                {t.appName}
              </span>
            </button>
          </div>

          {/* Zone 2: Location indicator button & Qibla Shortcut */}
          <div className="flex items-center justify-center gap-2 min-w-0">
            <button
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800 truncate cursor-pointer"
              title={t.activeLocation}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">{activeLocation.name}</span>
            </button>

            {/* Qibla Compass Trigger Button */}
            <button
              onClick={() => setIsQiblaOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shrink-0 cursor-pointer"
              title="Open Qibla Compass"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Qibla</span>
            </button>
          </div>

          {/* Zone 3: Actions (Offline Badge & PWA Install) */}
          <div className="flex items-center gap-2 shrink-0">
            {!isOnline && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md whitespace-nowrap">
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </span>
            )}
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Qibla Compass Modal */}
      <QiblaCompassModal
        isOpen={isQiblaOpen}
        onClose={() => setIsQiblaOpen(false)}
      />
    </>
  );
};
