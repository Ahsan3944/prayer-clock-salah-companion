import React from 'react';
import { Bookmark, ExternalLink, Share2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HadithRecord } from '../../types';

interface HadithDetailModalProps {
  hadith: HadithRecord | null;
  onClose: () => void;
}

export const HadithDetailModal: React.FC<HadithDetailModalProps> = ({ hadith, onClose }) => {
  const { language, t, bookmarks, handleToggleBookmark } = useApp();

  if (!hadith) return null;

  const isBookmarked = bookmarks.includes(hadith.id);
  const collectionName = hadith.collectionName[language] || hadith.collectionName.en;
  const chapter = hadith.chapterTitle[language] || hadith.chapterTitle.en;

  const arabicText = hadith.arabicText;
  const englishText = hadith.translations.en;
  const selectedLangTranslation = hadith.translations[language];

  // Localized section labels
  const arabicLabel = language === 'ar' ? t.originalArabic : `العربية — ${t.originalArabic}`;
  const englishLabel = t.englishTranslation;
  const selectedLangLabel =
    language === 'bn'
      ? t.bengaliTranslation
      : language === 'hi'
      ? t.hindiTranslation
      : language === 'ur'
      ? t.urduTranslation
      : '';

  const sourceUrl = `https://sunnah.com/bukhari:${hadith.hadithNumber}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${collectionName} - Hadith #${hadith.hadithNumber}`,
          text: `"${englishText}" — ${hadith.reference} (${sourceUrl})`,
          url: sourceUrl,
        })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`"${englishText}" — ${hadith.reference} (${sourceUrl})`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center flex-wrap gap-2 mb-1">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/80 border border-emerald-300/60 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                  {hadith.grading}
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {collectionName} · #{hadith.hadithNumber}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {chapter}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl transition-colors"
                title={t.viewOriginalSource}
              >
                <span className="hidden sm:inline">{t.viewOriginalSource}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => handleToggleBookmark(hadith.id, 'hadith')}
                className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                  isBookmarked
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
                title={isBookmarked ? t.bookmarked : t.bookmark}
                aria-label={isBookmarked ? t.bookmarked : t.bookmark}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Share Hadith"
                aria-label="Share Hadith"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title={t.close}
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 1. Authentic Arabic Text (Mandatory) */}
          <div className="my-4 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {arabicLabel}
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/70 dark:border-emerald-900/40">
              <p
                dir="rtl"
                className="text-lg sm:text-xl md:text-2xl font-serif text-slate-900 dark:text-slate-100 leading-loose font-amiri text-right select-text"
              >
                {arabicText}
              </p>
            </div>
          </div>

          {/* 2. English Translation (Mandatory) */}
          <div className="my-3 space-y-1">
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {englishLabel}
            </div>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 select-text">
              {englishText || t.translationNotAvailable}
            </p>
          </div>

          {/* 3. Selected-Language Translation (When Bengali, Hindi, or Urdu is active) */}
          {(language === 'bn' || language === 'hi' || language === 'ur') && (
            <div className="my-3 space-y-1">
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                {selectedLangLabel}
              </div>
              {selectedLangTranslation ? (
                <p
                  dir={language === 'ur' ? 'rtl' : 'ltr'}
                  className={`text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-emerald-50/25 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 select-text ${
                    language === 'ur' ? 'font-serif text-right text-base leading-loose' : 'font-sans'
                  }`}
                >
                  {selectedLangTranslation}
                </p>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                  {t.translationNotAvailable}
                </div>
              )}
            </div>
          )}

          {/* Metadata Footer */}
          <div className="mt-5 pt-3.5 border-t border-slate-200/80 dark:border-slate-800 space-y-1 text-xs text-slate-500 dark:text-slate-400">
            <div>
              <strong className="text-slate-700 dark:text-slate-300">{t.sourceReferences}:</strong>{' '}
              {hadith.reference}
            </div>
            <div>
              <strong className="text-slate-700 dark:text-slate-300">{t.grading}:</strong>{' '}
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{hadith.grading}</span>{' '}
              (Verified by: {hadith.grader})
            </div>
            <div className="pt-1">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                <span>{t.viewOriginalSource}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-3 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};
