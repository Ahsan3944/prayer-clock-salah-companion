import React from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VERIFIED_HADITHS } from '../../data/verified-content';

export const HadithOfDayCard: React.FC = () => {
  const { language, t, setActiveTab } = useApp();

  // Select today's featured Hadith based on day of month
  const todayIndex = new Date().getDate() % VERIFIED_HADITHS.length;
  const hadith = VERIFIED_HADITHS[todayIndex] || VERIFIED_HADITHS[0];

  const collectionName = hadith.collectionName[language] || hadith.collectionName.en;
  const chapter = hadith.chapterTitle[language] || hadith.chapterTitle.en;
  const translation = hadith.translations[language] || hadith.translations.en;

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-400">
            <BookOpen className="w-4 h-4" />
            <span>{t.hadithOfDay}</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
            {hadith.grading}
          </span>
        </div>

        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          {collectionName} · {chapter} · Hadith #{hadith.hadithNumber}
        </div>

        {/* Arabic Calligraphy Snippet */}
        <p
          dir="rtl"
          className="mt-3 text-lg md:text-xl font-serif text-slate-900 dark:text-slate-100 leading-relaxed font-amiri line-clamp-2"
        >
          {hadith.arabicText}
        </p>

        {/* Translation */}
        <p className="mt-2 text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
          "{translation}"
        </p>

        <div className="mt-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          Graded by: {hadith.grader}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('hadith')}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <span>{t.readFullHadith}</span>
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
};
