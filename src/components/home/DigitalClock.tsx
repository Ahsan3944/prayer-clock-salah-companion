import React from 'react';
import { useApp } from '../../context/AppContext';

export const DigitalClock: React.FC = () => {
  const { currentTime, prayerSettings, todayPrayerTimes } = useApp();

  let hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();

  let period = '';
  if (prayerSettings.timeFormat === '12h') {
    period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
  }

  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  const secondsStr = seconds.toString().padStart(2, '0');

  // Format date readout
  const gregorianDateStr = currentTime.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const hijriStr = todayPrayerTimes?.hijriDate
    ? `${todayPrayerTimes.hijriDate.day} ${todayPrayerTimes.hijriDate.monthNameLocalized} ${todayPrayerTimes.hijriDate.year} ${todayPrayerTimes.hijriDate.designation}`
    : '';

  return (
    <div className="flex flex-col items-center justify-center text-center py-4 md:py-6">
      {/* Date Dual Header */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
        <span>{gregorianDateStr}</span>
        {hijriStr && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{hijriStr}</span>
          </>
        )}
      </div>

      {/* Hero Time Digits */}
      <div className="flex items-baseline justify-center font-mono tabular-nums tracking-tighter text-slate-900 dark:text-slate-50 mt-1 select-none">
        <span className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight">
          {hoursStr}:{minutesStr}
        </span>
        {prayerSettings.showSeconds && (
          <span className="text-2xl sm:text-3xl md:text-4xl text-slate-400 dark:text-slate-500 font-semibold ml-1.5">
            :{secondsStr}
          </span>
        )}
        {prayerSettings.timeFormat === '12h' && (
          <span className="text-lg sm:text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-semibold ml-2 tracking-normal uppercase">
            {period}
          </span>
        )}
      </div>
    </div>
  );
};
