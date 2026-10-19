import React, { useEffect, useState } from 'react';
import { Calendar, Download, Printer } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fetchOrComputeMonthSchedule, formatTimeDisplay } from '../../services/prayer-service';
import { DailyPrayerTimes } from '../../types';

export const MonthlyTimetable: React.FC = () => {
  const { activeLocation, prayerSettings, language, t } = useApp();
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);
  const [schedules, setSchedules] = useState<DailyPrayerTimes[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchOrComputeMonthSchedule(currentYear, currentMonth, activeLocation, prayerSettings, language)
      .then((data) => {
        if (isMounted) {
          setSchedules(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Error fetching month schedule', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentYear, currentMonth, activeLocation, prayerSettings, language]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!schedules.length) return;
    const headers = ['Date', 'Hijri', 'Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const rows = schedules.map((s) => [
      s.dateString,
      `${s.hijriDate.day} ${s.hijriDate.monthNameEn}`,
      s.timings.Fajr,
      s.timings.Sunrise,
      s.timings.Dhuhr,
      s.timings.Asr,
      s.timings.Maghrib,
      s.timings.Isha,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Prayer_Timetable_${activeLocation.name}_${currentYear}_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header with Month Selection, Location & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {monthNames[currentMonth - 1]} {currentYear} — {t.monthlyTimetable}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activeLocation.name}, {activeLocation.country} · {prayerSettings.methodName} · {prayerSettings.asrSchool === 'hanafi' ? 'Hanafi Asr' : 'Standard Asr'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Print Schedule"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading monthly timetable...</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 sticky top-0">
              <tr>
                <th className="py-3 px-3 font-semibold">Date</th>
                <th className="py-3 px-3 font-semibold">Hijri</th>
                <th className="py-3 px-3 font-semibold text-emerald-700 dark:text-emerald-400">{t.fajr}</th>
                <th className="py-3 px-3 font-semibold text-slate-500">{t.sunrise}</th>
                <th className="py-3 px-3 font-semibold text-emerald-700 dark:text-emerald-400">{t.dhuhr}</th>
                <th className="py-3 px-3 font-semibold text-emerald-700 dark:text-emerald-400">{t.asr}</th>
                <th className="py-3 px-3 font-semibold text-emerald-700 dark:text-emerald-400">{t.maghrib}</th>
                <th className="py-3 px-3 font-semibold text-emerald-700 dark:text-emerald-400">{t.isha}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono tabular-nums">
              {schedules.map((day) => {
                const todayStr = new Date().toISOString().split('T')[0];
                const isToday = day.dateString === todayStr;

                return (
                  <tr
                    key={day.dateString}
                    className={`transition-colors ${
                      isToday
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 font-semibold text-emerald-900 dark:text-emerald-200'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-sans whitespace-nowrap">
                      {day.gregorianDate.day} {day.gregorianDate.dayName.slice(0, 3)}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {day.hijriDate.day} {day.hijriDate.monthNameLocalized}
                    </td>
                    <td className="py-2.5 px-3">{formatTimeDisplay(day.timings.Fajr, prayerSettings.timeFormat)}</td>
                    <td className="py-2.5 px-3 text-slate-400">{formatTimeDisplay(day.timings.Sunrise, prayerSettings.timeFormat)}</td>
                    <td className="py-2.5 px-3">{formatTimeDisplay(day.timings.Dhuhr, prayerSettings.timeFormat)}</td>
                    <td className="py-2.5 px-3">{formatTimeDisplay(day.timings.Asr, prayerSettings.timeFormat)}</td>
                    <td className="py-2.5 px-3">{formatTimeDisplay(day.timings.Maghrib, prayerSettings.timeFormat)}</td>
                    <td className="py-2.5 px-3">{formatTimeDisplay(day.timings.Isha, prayerSettings.timeFormat)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
