import React from 'react';
import { HeartHandshake, Play } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VERIFIED_DUAS } from '../../data/verified-content';

export const TodayAmalCard: React.FC = () => {
  const { language, t, startTasbihSession } = useApp();

  // Select today's featured Amal (e.g. index based on day of month)
  const todayIndex = new Date().getDate() % VERIFIED_DUAS.length;
  const amal = VERIFIED_DUAS[todayIndex] || VERIFIED_DUAS[0];

  const title = amal.title[language] || amal.title.en;
  const translation = amal.translations[language] || amal.translations.en;

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <HeartHandshake className="w-4 h-4" />
            <span>{t.todaysAmal}</span>
          </div>
          {amal.prescribedCount ? (
            <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {amal.prescribedCount}× Sunnah
            </span>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t.openCount}
            </span>
          )}
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">
          {title}
        </h3>

        {/* Arabic Calligraphy Snippet */}
        <p
          dir="rtl"
          className="mt-3 text-xl md:text-2xl font-serif text-slate-900 dark:text-slate-100 leading-relaxed font-amiri"
        >
          {amal.arabicText}
        </p>

        {/* Translation */}
        <p className="mt-2 text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
          "{translation}"
        </p>

        <div className="mt-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          Source: {amal.sourceReference}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => startTasbihSession(amal)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-medium text-xs shadow-sm transition-all cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{t.startAmalSession}</span>
        </button>
      </div>
    </div>
  );
};
