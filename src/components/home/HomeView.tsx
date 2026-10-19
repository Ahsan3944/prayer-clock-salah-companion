import React, { useState } from 'react';
import { Compass, Navigation } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  calculateDistanceToKaaba,
  calculateQiblaBearing,
  getCardinalDirection,
} from '../../services/qibla';
import { DigitalClock } from './DigitalClock';
import { CurrentPrayerBanner } from './CurrentPrayerBanner';
import { PrayerStrip } from './PrayerStrip';
import { TodayAmalCard } from './TodayAmalCard';
import { HadithOfDayCard } from './HadithOfDayCard';
import { QiblaCompassModal } from '../qibla/QiblaCompassModal';

export const HomeView: React.FC = () => {
  const { activeLocation } = useApp();
  const [isQiblaOpen, setIsQiblaOpen] = useState(false);

  const qiblaAngle = calculateQiblaBearing(activeLocation.latitude, activeLocation.longitude);
  const distanceKm = calculateDistanceToKaaba(activeLocation.latitude, activeLocation.longitude);
  const cardinalStr = getCardinalDirection(qiblaAngle);

  return (
    <div className="w-full flex flex-col gap-6 pb-20">
      {/* 1. Hero Digital Clock */}
      <DigitalClock />

      {/* 2. Current & Upcoming Salah Banner with Countdown & Window Progress */}
      <CurrentPrayerBanner />

      {/* 3. Daily Prayer Strip (5 prayers + Sunrise with Rakats modal) */}
      <PrayerStrip />

      {/* 4. Qibla Direction Quick Access Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Qibla Direction
              </h4>
              <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                {qiblaAngle}° {cardinalStr}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {distanceKm.toLocaleString()} km from {activeLocation.name} to the Holy Kaaba in Makkah
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsQiblaOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-semibold text-xs shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Open Compass</span>
        </button>
      </div>

      {/* 5. Two-Column Curated Daily Worship (Today's Amal & Hadith of the Day) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TodayAmalCard />
        <HadithOfDayCard />
      </div>

      {/* Qibla Compass Modal */}
      <QiblaCompassModal
        isOpen={isQiblaOpen}
        onClose={() => setIsQiblaOpen(false)}
      />
    </div>
  );
};
