import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Share2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BukhariBookSummary, BukhariHadithItem } from '../../types';
import { fetchAndCacheBukhariBook } from '../../services/bukhari-service';

interface BukhariBookReaderModalProps {
  book: BukhariBookSummary | null;
  initialHadithNumber?: number;
  onClose: () => void;
}

export const BukhariBookReaderModal: React.FC<BukhariBookReaderModalProps> = ({
  book,
  initialHadithNumber,
  onClose,
}) => {
  const { language, t, bookmarks, handleToggleBookmark } = useApp();
  const [hadiths, setHadiths] = useState<BukhariHadithItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    if (!book) return;

    let isMounted = true;
    setIsLoading(true);

    fetchAndCacheBukhariBook(book.bookNumber, language)
      .then((items) => {
        if (isMounted) {
          setHadiths(items);
          setIsLoading(false);

          // If an initial Hadith number was provided, jump to its page
          if (initialHadithNumber) {
            const index = items.findIndex((h) => h.hadithNumber === initialHadithNumber);
            if (index !== -1) {
              setPage(Math.floor(index / PAGE_SIZE) + 1);
            }
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load Bukhari book', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [book, language, initialHadithNumber]);

  if (!book) return null;

  const totalPages = Math.ceil(hadiths.length / PAGE_SIZE);
  const paginatedHadiths = hadiths.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const bookTitleLocalized =
    (language === 'bn' && book.titleBn) ||
    (language === 'ur' && book.titleUr) ||
    (language === 'hi' && book.titleHi) ||
    (language === 'ar' && book.titleAr) ||
    book.titleEn;

  // Localized section labels according to selected application language
  const arabicLabel = language === 'ar' ? t.originalArabic : `العربية — ${t.originalArabic}`;
  const englishLabel = t.englishTranslation;
  const bengaliLabel = t.bengaliTranslation;
  const hindiLabel = t.hindiTranslation;
  const urduLabel = t.urduTranslation;

  const handleShareHadith = (h: BukhariHadithItem) => {
    const canonicalUrl = `https://sunnah.com/bukhari:${h.hadithNumber}`;
    const shareText = `"${h.englishText.slice(0, 200)}..." — Sahih al-Bukhari #${h.hadithNumber} (${canonicalUrl})`;
    if (navigator.share) {
      navigator
        .share({
          title: `Sahih al-Bukhari #${h.hadithNumber}`,
          text: shareText,
          url: canonicalUrl,
        })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl h-[94vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header - Identifying Exact Collection and Book Information */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/80 border border-emerald-300/60 dark:border-emerald-800 px-2.5 py-0.5 rounded-full tracking-wide">
                {t.sahihBukhariCollectionName}
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                Book {book.bookNumber} of 97
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Hadiths {book.startHadithNumber}–{book.endHadithNumber} ({book.totalHadiths})
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {bookTitleLocalized}{' '}
              <span className="font-serif font-amiri font-normal text-emerald-700 dark:text-emerald-400 text-sm sm:text-base ml-1">
                ({book.titleAr})
              </span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title={t.close}
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-72 gap-3 text-slate-400">
              <div className="w-9 h-9 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
              <span className="text-xs font-medium">
                Loading authentic Hadiths from {t.sahihBukhariCollectionName}...
              </span>
            </div>
          ) : hadiths.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-sm font-semibold">{t.noHadithFound}</p>
              <p className="text-xs max-w-sm mx-auto text-slate-400">
                Please check your internet connection to download this book for offline reading.
              </p>
            </div>
          ) : (
            paginatedHadiths.map((h) => {
              const bookmarkId = `bukhari_${h.hadithNumber}`;
              const isBookmarked = bookmarks.includes(bookmarkId);
              const directSourceUrl = `https://sunnah.com/bukhari:${h.hadithNumber}`;
              const inBookHadithNum =
                h.inBookReference?.hadith || h.hadithNumber - book.startHadithNumber + 1;

              return (
                <div
                  key={h.hadithNumber}
                  id={`hadith-${h.hadithNumber}`}
                  className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-all"
                >
                  {/* Hadith Item Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-800">
                    <div>
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                          Hadith #{h.hadithNumber}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                          Sahih
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {t.inBookRef}: Book {book.bookNumber}, #{inBookHadithNum}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t.sahihBukhariCollectionName} · {bookTitleLocalized}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={directSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 px-2.5 py-1 rounded-lg transition-colors"
                        title={t.viewOriginalSource}
                      >
                        <span className="hidden sm:inline">{t.viewOriginalSource}</span>
                        <span className="sm:hidden">Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => handleToggleBookmark(bookmarkId, 'hadith')}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isBookmarked
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                        }`}
                        title={isBookmarked ? t.bookmarked : t.bookmark}
                        aria-label={isBookmarked ? t.bookmarked : t.bookmark}
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={() => handleShareHadith(h)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 transition-colors cursor-pointer"
                        title="Share Hadith"
                        aria-label="Share Hadith"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 1. Original Arabic Section (Mandatory) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <span>{arabicLabel}</span>
                      <span className="text-[10px] lowercase font-normal opacity-80">
                        {h.arabicNumber ? `رقم الحديث: ${h.arabicNumber}` : ''}
                      </span>
                    </div>
                    {h.arabicText ? (
                      <p
                        dir="rtl"
                        className="text-lg sm:text-xl md:text-2xl font-serif text-slate-900 dark:text-slate-50 leading-loose sm:leading-loose font-amiri text-right bg-emerald-50/40 dark:bg-emerald-950/20 p-4 sm:p-5 rounded-2xl border border-emerald-100/70 dark:border-emerald-900/40 select-text"
                      >
                        {h.arabicText}
                      </p>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-500">
                        {t.translationNotAvailable}
                      </div>
                    )}
                  </div>

                  {/* 2. English Translation Section (Mandatory) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      <span>{englishLabel}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Dr. M. Muhsin Khan (Darussalam)
                      </span>
                    </div>
                    {h.englishText ? (
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans bg-white dark:bg-slate-900/60 p-3.5 sm:p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 select-text">
                        {h.englishText}
                      </p>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-500">
                        {t.translationNotAvailable}
                      </div>
                    )}
                  </div>

                  {/* 3. Selected-Language Translation Section (Displayed when Bengali, Hindi, or Urdu is active) */}
                  {language === 'bn' && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                        <span>{bengaliLabel}</span>
                        {h.bengaliText && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            ইসলামিক ফাউন্ডেশন বাংলাদেশ ও আধুনিক প্রকাশনী
                          </span>
                        )}
                      </div>
                      {h.bengaliText ? (
                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans bg-emerald-50/20 dark:bg-emerald-950/10 p-3.5 sm:p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 select-text">
                          {h.bengaliText}
                        </p>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>এই হাদিসের বাংলা অনুবাদ এখনও উপলব্ধ নেই।</span>
                        </div>
                      )}
                    </div>
                  )}

                  {language === 'ur' && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                        <span>{urduLabel}</span>
                        {h.urduText && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            مولانا محمد داؤد راز (مکتبہ دارالسلام)
                          </span>
                        )}
                      </div>
                      {h.urduText ? (
                        <p
                          dir="rtl"
                          className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-loose font-serif text-right bg-emerald-50/20 dark:bg-emerald-950/10 p-3.5 sm:p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 select-text"
                        >
                          {h.urduText}
                        </p>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>اس حدیث کا اردو ترجمہ فی الوقت دستیاب نہیں ہے۔</span>
                        </div>
                      )}
                    </div>
                  )}

                  {language === 'hi' && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                        <span>{hindiLabel}</span>
                      </div>
                      {h.hindiText ? (
                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans bg-emerald-50/20 dark:bg-emerald-950/10 p-3.5 sm:p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 select-text">
                          {h.hindiText}
                        </p>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>हिन्दी अनुवाद अभी उपलब्ध नहीं है।</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. Verified Metadata & Provenance Footer */}
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="space-y-0.5">
                      <div>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {t.collectionLabel}:
                        </span>{' '}
                        {t.sahihBukhariCollectionName} (Book {book.bookNumber}, #{inBookHadithNum})
                      </div>
                      <div>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          USC-MSA Ref:
                        </span>{' '}
                        Vol. 1, Book {book.bookNumber}, Hadith {h.hadithNumber}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {t.grading}:
                        </span>{' '}
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          Sahih (Authentic)
                        </span>
                      </div>
                      <a
                        href={directSourceUrl}
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
              );
            })
          )}
        </div>

        {/* Bottom Pagination Bar */}
        {!isLoading && totalPages > 1 && (
          <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-800/50">
            <button
              disabled={page <= 1}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                const scrollContainer = document.querySelector('.overflow-y-auto');
                if (scrollContainer) scrollContainer.scrollTop = 0;
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{t.back || 'Previous'}</span>
            </button>

            <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
              Page {page} of {totalPages} ({hadiths.length} total)
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                const scrollContainer = document.querySelector('.overflow-y-auto');
                if (scrollContainer) scrollContainer.scrollTop = 0;
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
