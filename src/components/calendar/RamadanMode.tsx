import React, { useEffect, useState } from 'react';
import { AlertCircle, Moon, Sparkles, Sun } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fetchOrComputeMonthSchedule, formatCountdownMs, formatTimeDisplay } from '../../services/prayer-service';
import { DailyPrayerTimes } from '../../types';
import { VERIFIED_DUAS } from '../../data/verified-content';

export const RamadanMode: React.FC = () => {
  const { todayPrayerTimes, activeLocation, prayerSettings, language, t } = useApp();
  const [monthSchedules, setMonthSchedules] = useState<DailyPrayerTimes[]>([]);
  const [sehriCountdownMs, setSehriCountdownMs] = useState<number>(0);
  const [iftarCountdownMs, setIftarCountdownMs] = useState<number>(0);

  const iftarDua = VERIFIED_DUAS.find((d) => d.id === 'dua_iftar_sunnah') || VERIFIED_DUAS[0];

  useEffect(() => {
    const now = new Date();
    fetchOrComputeMonthSchedule(now.getFullYear(), now.getMonth() + 1, activeLocation, prayerSettings, language)
      .then(setMonthSchedules)
      .catch(console.warn);
  }, [activeLocation, prayerSettings, language]);

  // Live countdown to Sehri and Iftar
  useEffect(() => {
    if (!todayPrayerTimes) return;

    const timer = setInterval(() => {
      const now = new Date();
      const nowMs = now.getTime();

      // Fajr / Sehri
      const [fH, fM] = todayPrayerTimes.timings.Fajr.split(':').map((v) => parseInt(v, 10));
      const fajrDate = new Date(now);
      fajrDate.setHours(fH, fM, 0, 0);
      if (fajrDate.getTime() < nowMs) {
        fajrDate.setDate(fajrDate.getDate() + 1);
      }
      setSehriCountdownMs(fajrDate.getTime() - nowMs);

      // Maghrib / Iftar
      const [mH, mM] = todayPrayerTimes.timings.Maghrib.split(':').map((v) => parseInt(v, 10));
      const maghribDate = new Date(now);
      maghribDate.setHours(mH, mM, 0, 0);
      if (maghribDate.getTime() < nowMs) {
        maghribDate.setDate(maghribDate.getDate() + 1);
      }
      setIftarCountdownMs(maghribDate.getTime() - nowMs);
    }, 1000);

    return () => clearInterval(timer);
  }, [todayPrayerTimes]);

  if (!todayPrayerTimes) return null;

  const formattedFajr = formatTimeDisplay(todayPrayerTimes.timings.Fajr, prayerSettings.timeFormat);
  const formattedImsak = formatTimeDisplay(todayPrayerTimes.timings.Imsak, prayerSettings.timeFormat);
  const formattedMaghrib = formatTimeDisplay(todayPrayerTimes.timings.Maghrib, prayerSettings.timeFormat);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Hero Sehri / Iftar Countdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Sehri Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-200">
            <span className="flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-indigo-400" />
              {t.sehriDeadline}
            </span>
            <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-full font-mono">
              Imsak: {formattedImsak}
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-bold font-mono tabular-nums">
              {formattedFajr}
            </div>
            <div className="text-right">
              <span className="text-[10px] text-indigo-300 uppercase font-medium">{t.timeRemaining}</span>
              <div className="text-sm font-bold font-mono text-indigo-200">
                {formatCountdownMs(sehriCountdownMs)}
              </div>
            </div>
          </div>
        </div>

        {/* Iftar Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-700 to-rose-900 text-white shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-200">
            <span className="flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-300" />
              {t.iftarTime}
            </span>
            <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-full font-mono">
              Maghrib
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-bold font-mono tabular-nums">
              {formattedMaghrib}
            </div>
            <div className="text-right">
              <span className="text-[10px] text-amber-200 uppercase font-medium">{t.timeRemaining}</span>
              <div className="text-sm font-bold font-mono text-amber-100">
                {formatCountdownMs(iftarCountdownMs)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Fiqh Explanation: Imsak vs Fajr */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-sm mb-0.5">{t.imsakExplanationTitle}</h4>
          <p className="leading-relaxed opacity-90">{t.imsakExplanationText}</p>
        </div>
      </div>

      {/* Sunnah Iftar Dua Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
          <Sparkles className="w-4 h-4" />
          <span>{iftarDua.title[language] || iftarDua.title.en}</span>
        </div>
        <p
          dir="rtl"
          className="text-xl md:text-2xl font-serif text-slate-900 dark:text-slate-100 leading-relaxed font-amiri"
        >
          {iftarDua.arabicText}
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium italic">
          "{iftarDua.transliteration}"
        </p>
        <p className="mt-1 text-xs md:text-sm text-slate-700 dark:text-slate-300">
          "{iftarDua.translations[language] || iftarDua.translations.en}"
        </p>
        <div className="mt-2 text-[10px] text-slate-400">
          Source: {iftarDua.sourceReference}
        </div>
      </div>

      {/* Monthly Fasting Timetable */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
          Daily Fasting Schedule ({monthSchedules[0]?.gregorianDate.monthName || 'Current Month'})
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Hijri</th>
              <th className="py-2.5 px-3 font-semibold text-indigo-700 dark:text-indigo-400">Sehri (Fajr)</th>
              <th className="py-2.5 px-3 font-semibold text-amber-700 dark:text-amber-400">Iftar (Maghrib)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono tabular-nums">
            {monthSchedules.map((day) => {
              const isToday = day.dateString === todayPrayerTimes.dateString;
              return (
                <tr
                  key={day.dateString}
                  className={isToday ? 'bg-amber-50/50 dark:bg-amber-950/20 font-bold text-amber-900 dark:text-amber-200' : 'text-slate-700 dark:text-slate-300'}
                >
                  <td className="py-2 px-3 font-sans">{day.gregorianDate.day} {day.gregorianDate.dayName.slice(0, 3)}</td>
                  <td className="py-2 px-3 font-sans text-slate-500">{day.hijriDate.day} {day.hijriDate.monthNameLocalized}</td>
                  <td className="py-2 px-3">{formatTimeDisplay(day.timings.Fajr, prayerSettings.timeFormat)}</td>
                  <td className="py-2 px-3">{formatTimeDisplay(day.timings.Maghrib, prayerSettings.timeFormat)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
