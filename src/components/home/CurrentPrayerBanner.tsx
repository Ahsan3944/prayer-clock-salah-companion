import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCountdownMs, formatTimeDisplay } from '../../services/prayer-service';

export const CurrentPrayerBanner: React.FC = () => {
  const { currentPrayerStatus, todayPrayerTimes, prayerSettings, t } = useApp();

  if (!currentPrayerStatus || !todayPrayerTimes) {
    return (
      <div className="w-full bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-6 animate-pulse" />
    );
  }

  const {
    currentPrayer,
    currentPrayerEndTime,
    currentPrayerTimeRemainingMs,
    currentPrayerElapsedPercent,
    nextPrayer,
    nextPrayerStartTime,
    nextPrayerTimeRemainingMs,
    isMakruhTime,
    makruhReason,
  } = currentPrayerStatus;

  // Localized prayer name helper
  const getPrayerLocalizedName = (name: string) => {
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

  const formattedNextStartTime = formatTimeDisplay(nextPrayerStartTime, prayerSettings.timeFormat);
  const formattedCurrentEndTime = currentPrayerEndTime
    ? formatTimeDisplay(currentPrayerEndTime, prayerSettings.timeFormat)
    : null;

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Makruh Time Alert Banner */}
      {isMakruhTime && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">{t.makruhNotice}: </span>
            <span>{makruhReason || t.makruhDescription}</span>
          </div>
        </div>
      )}

      {/* Main Focus Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-5 md:p-6 shadow-xl shadow-emerald-950/20">
        {/* Subtle geometric pattern overlay */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="flex flex-col gap-4">
          {/* Top row: Next Prayer & Countdown */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-200/90 font-medium">
                {t.nextSalah}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-0.5">
                {getPrayerLocalizedName(nextPrayer)}
              </h2>
              <span className="text-xs text-emerald-100/80">
                {t.startsIn.toLowerCase() === 'starts in' ? `Starts at ${formattedNextStartTime}` : `${formattedNextStartTime}`}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-emerald-200/90 font-medium">
                {t.timeRemaining}
              </span>
              <div className="text-2xl md:text-3xl font-bold font-mono tabular-nums text-white mt-0.5">
                {formatCountdownMs(nextPrayerTimeRemainingMs)}
              </div>
            </div>
          </div>

          {/* Middle row: Current Prayer status and valid window remaining */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            {currentPrayer ? (
              <div className="flex items-center gap-1.5 text-emerald-100">
                <Clock className="w-3.5 h-3.5 text-emerald-300" />
                <span>
                  {t.currentSalah}: <strong className="text-white font-semibold">{getPrayerLocalizedName(currentPrayer)}</strong>
                  {formattedCurrentEndTime && ` (Valid until ${formattedCurrentEndTime})`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-200/80">
                <Clock className="w-3.5 h-3.5" />
                <span>Between prayer windows</span>
              </div>
            )}

            {currentPrayer && (
              <span className="text-emerald-200 font-mono tabular-nums">
                {t.remainingInWindow}: {formatCountdownMs(currentPrayerTimeRemainingMs)}
              </span>
            )}
          </div>

          {/* Bottom Progress Bar through valid window */}
          {currentPrayer && (
            <div className="flex flex-col gap-1.5">
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-300 h-full rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${currentPrayerElapsedPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-emerald-200/80 font-mono">
                <span>{t.windowProgress}</span>
                <span>{Math.round(currentPrayerElapsedPercent)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
