import React, { useState } from 'react';
import { Info, Sun, Sunset, Moon, Sunrise as SunriseIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatTimeDisplay } from '../../services/prayer-service';
import { PrayerName } from '../../types';

interface RakatBreakdown {
  fard: number;
  sunnahMuakkadah: number;
  sunnahGhairMuakkadah?: number;
  witr?: number;
  nafl?: number;
  notes: string;
}

const RAKAT_DETAILS: Record<PrayerName, RakatBreakdown> = {
  Fajr: {
    fard: 2,
    sunnahMuakkadah: 2, // Before Fard
    notes: '2 Sunnah Mu’akkadah before 2 Fard. The Prophet (ﷺ) emphasized: "The two rakats before Fajr are better than the world and all it contains." (Sahih Muslim 725)',
  },
  Sunrise: {
    fard: 0,
    sunnahMuakkadah: 0,
    nafl: 2, // Ishraq / Duha after sunrise
    notes: 'Astronomical sunrise marks the end of the Fajr window. Voluntary prayer (Ishraq/Duha) begins approx 15 minutes after sunrise.',
  },
  Dhuhr: {
    fard: 4,
    sunnahMuakkadah: 6, // 4 before, 2 after
    nafl: 2,
    notes: '4 Sunnah Mu’akkadah before 4 Fard, followed by 2 Sunnah Mu’akkadah and optional 2 Nafl. (Sahih al-Bukhari 1180, Muslim 728)',
  },
  Asr: {
    fard: 4,
    sunnahMuakkadah: 0,
    sunnahGhairMuakkadah: 4, // 4 before Fard
    notes: '4 Fard. Recommended 4 Sunnah Ghair Mu’akkadah before Fard: "May Allah have mercy on the one who prays four rakats before Asr." (Jami` at-Tirmidhi 430)',
  },
  Maghrib: {
    fard: 3,
    sunnahMuakkadah: 2, // after Fard
    nafl: 2,
    notes: '3 Fard followed by 2 Sunnah Mu’akkadah and optional 2 Nafl. (Sahih Muslim 728)',
  },
  Isha: {
    fard: 4,
    sunnahMuakkadah: 2, // after Fard
    witr: 3, // 1 or 3
    nafl: 2,
    notes: '4 Fard followed by 2 Sunnah Mu’akkadah, 3 Witr, and optional Nafl. (Sahih al-Bukhari 1128, Muslim 749)',
  },
};

export const PrayerStrip: React.FC = () => {
  const { todayPrayerTimes, currentPrayerStatus, prayerSettings, t } = useApp();
  const [selectedRakatPrayer, setSelectedRakatPrayer] = useState<PrayerName | null>(null);

  if (!todayPrayerTimes || !currentPrayerStatus) return null;

  const prayers: Array<{ name: PrayerName; time: string; windowEnd: string; icon: React.FC<{ className?: string }> }> = [
    { name: 'Fajr', time: todayPrayerTimes.timings.Fajr, windowEnd: todayPrayerTimes.windowEnds.Fajr, icon: SunriseIcon },
    { name: 'Sunrise', time: todayPrayerTimes.timings.Sunrise, windowEnd: todayPrayerTimes.timings.Dhuhr, icon: Sun },
    { name: 'Dhuhr', time: todayPrayerTimes.timings.Dhuhr, windowEnd: todayPrayerTimes.windowEnds.Dhuhr, icon: Sun },
    { name: 'Asr', time: todayPrayerTimes.timings.Asr, windowEnd: todayPrayerTimes.windowEnds.Asr, icon: Sun },
    { name: 'Maghrib', time: todayPrayerTimes.timings.Maghrib, windowEnd: todayPrayerTimes.windowEnds.Maghrib, icon: Sunset },
    { name: 'Isha', time: todayPrayerTimes.timings.Isha, windowEnd: todayPrayerTimes.windowEnds.Isha, icon: Moon },
  ];

  const getPrayerLocalizedName = (name: PrayerName) => {
    switch (name) {
      case 'Fajr': return t.fajr;
      case 'Sunrise': return t.sunrise;
      case 'Dhuhr': return t.dhuhr;
      case 'Asr': return t.asr;
      case 'Maghrib': return t.maghrib;
      case 'Isha': return t.isha;
      default: return name;
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 mt-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {prayers.map((p) => {
          const isActive = currentPrayerStatus.currentPrayer === p.name;
          const isNext = currentPrayerStatus.nextPrayer === p.name;
          const Icon = p.icon;

          const formattedTime = formatTimeDisplay(p.time, prayerSettings.timeFormat);
          const formattedEnd = formatTimeDisplay(p.windowEnd, prayerSettings.timeFormat);

          return (
            <div
              key={p.name}
              className={`relative flex flex-col justify-between p-3 rounded-xl border transition-all ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30'
                  : isNext
                  ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-700/60 shadow-sm'
                  : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {getPrayerLocalizedName(p.name)}
                </span>
                <button
                  onClick={() => setSelectedRakatPrayer(p.name)}
                  className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                  title="View Rakat Breakdown"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-2">
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {formattedTime}
                </div>
                {p.name !== 'Sunrise' && (
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Valid till {formattedEnd}
                  </div>
                )}
              </div>

              {isActive && (
                <span className="mt-2 inline-flex items-center text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {t.activeNow}
                </span>
              )}
              {isNext && (
                <span className="mt-2 inline-flex items-center text-[10px] font-semibold text-teal-600 dark:text-teal-400">
                  {t.upcoming}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Rakat Breakdown Modal */}
      {selectedRakatPrayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {getPrayerLocalizedName(selectedRakatPrayer)} — Salah Structure
              </h3>
              <button
                onClick={() => setSelectedRakatPrayer(null)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              {RAKAT_DETAILS[selectedRakatPrayer].fard > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-medium">Fard (Obligatory):</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">{RAKAT_DETAILS[selectedRakatPrayer].fard} Rakats</span>
                </div>
              )}
              {RAKAT_DETAILS[selectedRakatPrayer].sunnahMuakkadah > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-medium">Sunnah Mu’akkadah (Confirmed):</span>
                  <span className="font-semibold text-teal-600 dark:text-teal-400">{RAKAT_DETAILS[selectedRakatPrayer].sunnahMuakkadah} Rakats</span>
                </div>
              )}
              {RAKAT_DETAILS[selectedRakatPrayer].sunnahGhairMuakkadah && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-medium">Sunnah Ghair Mu’akkadah:</span>
                  <span className="font-semibold">{RAKAT_DETAILS[selectedRakatPrayer].sunnahGhairMuakkadah} Rakats</span>
                </div>
              )}
              {RAKAT_DETAILS[selectedRakatPrayer].witr && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-medium">Witr:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{RAKAT_DETAILS[selectedRakatPrayer].witr} Rakats</span>
                </div>
              )}
              {RAKAT_DETAILS[selectedRakatPrayer].nafl && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-medium">Nafl (Voluntary):</span>
                  <span className="font-semibold">{RAKAT_DETAILS[selectedRakatPrayer].nafl} Rakats</span>
                </div>
              )}

              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                {RAKAT_DETAILS[selectedRakatPrayer].notes}
              </p>
            </div>

            <button
              onClick={() => setSelectedRakatPrayer(null)}
              className="mt-5 w-full rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-2.5 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
