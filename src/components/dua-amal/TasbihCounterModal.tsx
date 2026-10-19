import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Undo2, X, CheckCircle2, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DuaAmalRecord, TasbihSessionItem } from '../../types';
import { saveTasbihSession } from '../../services/storage';

interface TasbihCounterModalProps {
  initialItem: DuaAmalRecord | null;
  allSessionItems?: DuaAmalRecord[];
  onClose: () => void;
}

export const TasbihCounterModal: React.FC<TasbihCounterModalProps> = ({
  initialItem,
  allSessionItems,
  onClose,
}) => {
  const { language, prayerSettings, t } = useApp();

  // Prepare session items list
  const sessionSourceList = allSessionItems && allSessionItems.length > 0
    ? allSessionItems
    : initialItem
    ? [initialItem]
    : [];

  const [items, setItems] = useState<TasbihSessionItem[]>(() =>
    sessionSourceList.map((d) => ({
      duaId: d.id,
      title: d.title[language] || d.title.en,
      arabicText: d.arabicText,
      transliteration: d.transliteration,
      translation: d.translations[language] || d.translations.en,
      sourceReference: d.sourceReference,
      targetCount: d.prescribedCount || 33, // Default to 33 if open
      currentCount: 0,
      isCompleted: false,
    }))
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [historyStack, setHistoryStack] = useState<number[]>([]); // for Undo
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isCompletedAlert, setIsCompletedAlert] = useState(false);
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  const currentItem = items[currentIndex];

  // Save progress to IndexedDB on state changes
  useEffect(() => {
    if (!currentItem) return;

    const sessionRecord = {
      sessionId: `session_${sessionSourceList[0]?.id || 'custom'}`,
      sessionType: 'today_amal' as const,
      items,
      currentItemIndex: currentIndex,
      status: (isSessionFinished ? 'completed' : 'in_progress') as 'completed' | 'in_progress',
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };

    saveTasbihSession(sessionRecord).catch(console.warn);
  }, [items, currentIndex, isSessionFinished]);

  if (!currentItem) return null;

  const target = currentItem.targetCount;
  const count = currentItem.currentCount;
  const progressPercent = Math.min(100, (count / target) * 100);

  // SVG circular ring geometry
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const handleTap = () => {
    if (count >= target) return;

    // Haptic vibration
    if (prayerSettings.vibrationEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch (e) {}
    }

    const newCount = count + 1;
    setHistoryStack((prev) => [...prev, count]);

    const updatedItems = [...items];
    updatedItems[currentIndex] = {
      ...currentItem,
      currentCount: newCount,
      isCompleted: newCount >= target,
    };
    setItems(updatedItems);

    // Target reached!
    if (newCount >= target) {
      // Haptic celebration burst
      if (prayerSettings.vibrationEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([40, 60, 80]);
        } catch (e) {}
      }

      setIsCompletedAlert(true);

      setTimeout(() => {
        setIsCompletedAlert(false);

        // Advance to next item or conclude session
        if (currentIndex < items.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setHistoryStack([]);
        } else {
          setIsSessionFinished(true);
        }
      }, 700);
    }
  };

  const handleUndo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (historyStack.length === 0) return;

    const prevCount = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));

    const updatedItems = [...items];
    updatedItems[currentIndex] = {
      ...currentItem,
      currentCount: prevCount,
      isCompleted: false,
    };
    setItems(updatedItems);
  };

  const handleConfirmReset = () => {
    const updatedItems = [...items];
    updatedItems[currentIndex] = {
      ...currentItem,
      currentCount: 0,
      isCompleted: false,
    };
    setItems(updatedItems);
    setHistoryStack([]);
    setShowResetConfirm(false);
  };

  // Session Completion Celebration Screen
  if (isSessionFinished) {
    const totalReps = items.reduce((acc, curr) => acc + curr.currentCount, 0);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">
            {t.sessionCompletedTitle}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            {t.sessionCompletedDesc}
          </p>

          <div className="my-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex justify-around font-mono text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-sans">Items</span>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {items.length}
              </div>
            </div>
            <div className="w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-sans">Repetitions</span>
              <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {totalReps}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            {t.finishSession}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-400">
            {t.itemProgress} {currentIndex + 1} / {items.length}
          </span>
          {isCompletedAlert && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-semibold bg-emerald-950/80 border border-emerald-700/80 px-2 py-0.5 rounded-full animate-bounce">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.itemCompleted}</span>
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          title={t.close}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Recitation Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto w-full overflow-y-auto">
        <span className="text-xs uppercase font-medium tracking-wider text-slate-400">
          {currentItem.title}
        </span>

        {/* Arabic Calligraphy */}
        <p
          dir="rtl"
          className="my-5 text-3xl sm:text-4xl font-serif text-slate-50 leading-relaxed font-amiri"
        >
          {currentItem.arabicText}
        </p>

        {/* Transliteration */}
        <p className="text-xs sm:text-sm text-emerald-300/90 font-medium italic mb-2">
          "{currentItem.transliteration}"
        </p>

        {/* Translation */}
        <p className="text-xs text-slate-300/80 leading-relaxed max-w-md">
          "{currentItem.translation}"
        </p>

        <span className="mt-3 text-[10px] text-slate-500 font-medium">
          Source: {currentItem.sourceReference}
        </span>
      </div>

      {/* Interactive Bottom Tap Area & Digital Ring */}
      <div
        onClick={handleTap}
        className="w-full h-80 sm:h-96 bg-gradient-to-t from-emerald-950/60 via-slate-900 to-transparent border-t border-white/10 flex flex-col items-center justify-center cursor-pointer active:scale-[0.99] transition-transform relative touch-manipulation"
      >
        {/* SVG Circular Progress Ring */}
        <div className="relative flex items-center justify-center">
          <svg className="w-48 h-48 sm:w-56 sm:h-56 -rotate-90 transform">
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-white/10"
            />
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-emerald-400 transition-all duration-150 ease-out"
            />
          </svg>

          {/* Large Count Inside Ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-5xl sm:text-6xl font-bold font-mono tabular-nums tracking-tight text-white">
              {count}
            </span>
            <span className="text-xs text-slate-400 mt-1">
              / {target}
            </span>
          </div>
        </div>

        <span className="mt-4 text-xs font-semibold text-emerald-400 uppercase tracking-widest opacity-80">
          {t.tapToCount}
        </span>
      </div>

      {/* Control Bar: Previous, Undo, Reset, Next */}
      <div className="flex items-center justify-between p-4 bg-slate-900 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-1">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Previous Item"
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </button>
          <button
            disabled={currentIndex === items.length - 1}
            onClick={() => setCurrentIndex((prev) => Math.min(items.length - 1, prev + 1))}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Next Item"
          >
            <ChevronRight className="w-5 h-5 rtl:rotate-180" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={historyStack.length === 0}
            onClick={handleUndo}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>{t.undo}</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.reset}</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-xs rounded-2xl bg-slate-900 border border-white/20 p-5 text-center shadow-2xl">
            <h4 className="text-sm font-bold text-white">
              {t.resetConfirmTitle}
            </h4>
            <p className="text-xs text-slate-300 mt-2">
              {t.resetConfirmMessage}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 rounded-lg text-slate-200 transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleConfirmReset}
                className="flex-1 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                {t.confirmReset}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
