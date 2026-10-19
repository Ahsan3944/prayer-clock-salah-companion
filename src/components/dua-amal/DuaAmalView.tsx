import React, { useState } from 'react';
import { HeartHandshake, Play, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VERIFIED_DUAS } from '../../data/verified-content';
import { DuaAmalRecord } from '../../types';
import { TasbihCounterModal } from './TasbihCounterModal';

export const DuaAmalView: React.FC = () => {
  const { language, t, activeTasbihItem, startTasbihSession, closeTasbihSession } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [fullSessionItems, setFullSessionItems] = useState<DuaAmalRecord[] | null>(null);

  const categories = [
    { id: 'all', label: 'All Duas & Adhkar' },
    { id: 'post_prayer', label: t.categoryPostPrayer },
    { id: 'morning', label: t.categoryMorning },
    { id: 'daily', label: t.categoryDaily },
  ];

  const filteredDuas = VERIFIED_DUAS.filter((d) => {
    if (selectedCategory === 'all') return true;
    return d.category === selectedCategory;
  });

  const handleStartPostSalahSession = () => {
    // Collect all post-salah tasbih items in Sunnah order (33 Subhanallah, 33 Alhamdulillah, 34 Allahu Akbar)
    const postSalah = VERIFIED_DUAS.filter((d) => d.category === 'post_prayer');
    setFullSessionItems(postSalah);
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-20">
      {/* Hero Quick-Start Session Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-200 font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Recommended Sunnah Session</span>
          </div>
          <h3 className="text-base md:text-lg font-bold mt-1">
            Complete Post-Salah Adhkar (Tasbih Fatimah)
          </h3>
          <p className="text-xs text-emerald-100/80 mt-0.5">
            33× Subhanallah · 33× Alhamdulillah · 34× Allahu Akbar
          </p>
        </div>

        <button
          onClick={handleStartPostSalahSession}
          className="flex items-center gap-2 py-2 px-4 rounded-xl bg-white text-emerald-900 font-semibold text-xs shadow-sm hover:bg-emerald-50 active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Start Full Session</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === c.id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Dua Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDuas.map((dua) => {
          const title = dua.title[language] || dua.title.en;
          const translation = dua.translations[language] || dua.translations.en;
          const meaning = dua.meaning[language] || dua.meaning.en;

          return (
            <div
              key={dua.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {title}
                  </span>
                  {dua.prescribedCount ? (
                    <span className="text-[11px] font-mono font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                      {dua.prescribedCount}× Sunnah
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      {t.openCount}
                    </span>
                  )}
                </div>

                {/* Arabic Script */}
                <p
                  dir="rtl"
                  className="my-3 text-xl md:text-2xl font-serif text-slate-900 dark:text-slate-100 leading-relaxed font-amiri"
                >
                  {dua.arabicText}
                </p>

                {/* Transliteration */}
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium italic mb-1.5">
                  "{dua.transliteration}"
                </p>

                {/* Translation */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  "{translation}"
                </p>

                {/* Meaning / Commentary */}
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {meaning}
                </p>

                <div className="mt-3 text-[10px] text-slate-400">
                  Reference: {dua.sourceReference}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                <button
                  onClick={() => startTasbihSession(dua)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>{t.launchInTasbih}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Single Item Tasbih Modal */}
      {activeTasbihItem && (
        <TasbihCounterModal
          initialItem={activeTasbihItem}
          onClose={closeTasbihSession}
        />
      )}

      {/* Multi-Item Session Tasbih Modal */}
      {fullSessionItems && (
        <TasbihCounterModal
          initialItem={null}
          allSessionItems={fullSessionItems}
          onClose={() => setFullSessionItems(null)}
        />
      )}
    </div>
  );
};
