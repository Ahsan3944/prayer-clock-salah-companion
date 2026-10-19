import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sliders, Table, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { gregorianToHijri, VERIFIED_HISTORICAL_EVENTS } from '../../services/hijri-calendar';
import { fetchOrComputeMonthSchedule, formatTimeDisplay } from '../../services/prayer-service';
import { DailyPrayerTimes, HistoricalEvent } from '../../types';
import { EventDetailModal } from './EventDetailModal';
import { MonthlyTimetable } from './MonthlyTimetable';
import { RamadanMode } from './RamadanMode';

type CalendarSubMode = 'grid' | 'timetable' | 'ramadan';

export const CalendarView: React.FC = () => {
  const { activeLocation, prayerSettings, updatePrayerSettings, language, t } = useApp();
  const [subMode, setSubMode] = useState<CalendarSubMode>('grid');

  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDayNumber, setSelectedDayNumber] = useState(() => new Date().getDate());
  const [monthSchedules, setMonthSchedules] = useState<DailyPrayerTimes[]>([]);
  const [activeEventModal, setActiveEventModal] = useState<HistoricalEvent | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1; // 1-12

  useEffect(() => {
    fetchOrComputeMonthSchedule(year, month, activeLocation, prayerSettings, language)
      .then(setMonthSchedules)
      .catch(console.warn);
  }, [year, month, activeLocation, prayerSettings, language]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayWeekday = new Date(year, month - 1, 1).getDay(); // 0 is Sunday

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 2, 1));
    setSelectedDayNumber(1);
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month, 1));
    setSelectedDayNumber(1);
  };

  const handleToday = () => {
    const today = new Date();
    setViewDate(today);
    setSelectedDayNumber(today.getDate());
  };

  const selectedSchedule = monthSchedules.find(
    (s) => s.gregorianDate.day === selectedDayNumber
  );

  // Check if a day has a verified historical event
  const getEventForDay = (dayNum: number): HistoricalEvent | null => {
    const gDate = new Date(year, month - 1, dayNum);
    const hijri = gregorianToHijri(gDate, prayerSettings.hijriOffsetDays, language);
    return (
      VERIFIED_HISTORICAL_EVENTS.find(
        (e) => e.hijriMonth === hijri.month && e.hijriDay === hijri.day
      ) || null
    );
  };

  const selectedEvent = selectedSchedule ? getEventForDay(selectedDayNumber) : null;

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full flex flex-col gap-4 pb-20">
      {/* View Sub-Mode Switcher */}
      <div className="flex items-center justify-between gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
        <button
          onClick={() => setSubMode('grid')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            subMode === 'grid'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>{t.calendarView}</span>
        </button>
        <button
          onClick={() => setSubMode('timetable')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            subMode === 'timetable'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>{t.monthlyTimetable}</span>
        </button>
        <button
          onClick={() => setSubMode('ramadan')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            subMode === 'ramadan'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>{t.ramadanMode}</span>
        </button>
      </div>

      {subMode === 'timetable' && <MonthlyTimetable />}
      {subMode === 'ramadan' && <RamadanMode />}

      {subMode === 'grid' && (
        <>
          {/* Calendar Header with Month Navigation and Moon Sighting Adjustment */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
              <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                {viewDate.toLocaleString('default', { month: 'long' })} {year}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
              <button
                onClick={handleToday}
                className="ml-2 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                {t.today}
              </button>
            </div>

            {/* Moon Sighting Adjustment Offset Controller */}
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="whitespace-nowrap">{t.moonSightingAdjustment}:</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                {[-2, -1, 0, 1, 2].map((offset) => (
                  <button
                    key={offset}
                    onClick={() => updatePrayerSettings({ hijriOffsetDays: offset })}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      prayerSettings.hijriOffsetDays === offset
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {offset > 0 ? `+${offset}` : offset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Gregorian-First Calendar Grid */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            {/* Weekday Row */}
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
              {weekdayNames.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {/* Empty leading slots */}
              {Array.from({ length: firstDayWeekday }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[64px] sm:min-h-[76px] rounded-xl bg-slate-50/40 dark:bg-slate-950/20" />
              ))}

              {/* Day Cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected = selectedDayNumber === dayNum;
                const today = new Date();
                const isCurrentToday =
                  today.getFullYear() === year &&
                  today.getMonth() + 1 === month &&
                  today.getDate() === dayNum;

                const daySchedule = monthSchedules.find(
                  (s) => s.gregorianDate.day === dayNum
                );

                const event = getEventForDay(dayNum);

                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedDayNumber(dayNum)}
                    className={`min-h-[64px] sm:min-h-[76px] p-1.5 rounded-xl border flex flex-col justify-between items-center transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                        : isCurrentToday
                        ? 'bg-teal-50/50 dark:bg-teal-950/30 border-teal-400 dark:border-teal-700'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Primary Gregorian Day Number */}
                    <span
                      className={`text-sm sm:text-base font-bold font-mono tabular-nums ${
                        isSelected
                          ? 'text-emerald-800 dark:text-emerald-300'
                          : isCurrentToday
                          ? 'text-teal-700 dark:text-teal-400 font-extrabold'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Secondary Hijri Date Display */}
                    {daySchedule?.hijriDate && (
                      <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-sans tracking-tight truncate max-w-full">
                        {daySchedule.hijriDate.day} {daySchedule.hijriDate.monthNameLocalized.slice(0, 5)}
                      </span>
                    )}

                    {/* Verified Event Dot Marker */}
                    {event && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
                        title={event.title[language] || event.title.en}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Details & Prayer Times */}
          {selectedSchedule && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedSchedule.gregorianDate.dayName}, {selectedSchedule.gregorianDate.day} {selectedSchedule.gregorianDate.monthName} {year}
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    {selectedSchedule.hijriDate.day} {selectedSchedule.hijriDate.monthNameLocalized} {selectedSchedule.hijriDate.year} {selectedSchedule.hijriDate.designation}
                  </p>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {activeLocation.name}
                </span>
              </div>

              {/* Verified Event Card for this day (if any) */}
              {selectedEvent && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                      {t.verifiedEvents}
                    </span>
                    <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100 mt-0.5">
                      {selectedEvent.title[language] || selectedEvent.title.en}
                    </h4>
                    <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 mt-1 line-clamp-2">
                      {selectedEvent.description[language] || selectedEvent.description.en}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveEventModal(selectedEvent)}
                    className="shrink-0 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              )}

              {/* 5 Prayers on Selected Day */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { label: t.fajr, time: selectedSchedule.timings.Fajr },
                  { label: t.sunrise, time: selectedSchedule.timings.Sunrise },
                  { label: t.dhuhr, time: selectedSchedule.timings.Dhuhr },
                  { label: t.asr, time: selectedSchedule.timings.Asr },
                  { label: t.maghrib, time: selectedSchedule.timings.Maghrib },
                  { label: t.isha, time: selectedSchedule.timings.Isha },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-center"
                  >
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {item.label}
                    </span>
                    <div className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                      {formatTimeDisplay(item.time, prayerSettings.timeFormat)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical Event Modal */}
          <EventDetailModal
            event={activeEventModal}
            onClose={() => setActiveEventModal(null)}
          />
        </>
      )}
    </div>
  );
};
