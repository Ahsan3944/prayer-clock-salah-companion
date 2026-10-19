import React from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HistoricalEvent } from '../../types';

interface EventDetailModalProps {
  event: HistoricalEvent | null;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  const { language, t } = useApp();

  if (!event) return null;

  const title = event.title[language] || event.title.en;
  const description = event.description[language] || event.description.en;

  const getConfidenceBadge = () => {
    switch (event.confidence) {
      case 'Confirmed':
        return (
          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
            {t.confidenceConfirmed}
          </span>
        );
      case 'Approximate':
        return (
          <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
            {t.confidenceApproximate}
          </span>
        );
      case 'Disputed':
        return (
          <span className="text-[11px] font-semibold text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full">
            {t.confidenceDisputed}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {getConfidenceBadge()}
              {event.historicalYearHijri && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {event.historicalYearHijri} AH / {event.historicalYearGregorian} CE
                </span>
              )}
            </div>
            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {description}
          </p>

          <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.sourceReferences}</span>
            </div>
            <ul className="mt-1.5 list-disc list-inside text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
              {event.sourceReferences.map((ref, idx) => (
                <li key={idx}>{ref}</li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-2.5 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};
