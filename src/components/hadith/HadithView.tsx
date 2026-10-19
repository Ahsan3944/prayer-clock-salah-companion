import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Download,
  Flame,
  Library,
  Search,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BUKHARI_BOOKS_INDEX, findBukhariBookByHadithNumber } from '../../data/bukhari-books-index';
import { VERIFIED_HADITHS } from '../../data/verified-content';
import { BukhariBookSummary, HadithRecord } from '../../types';
import {
  downloadBukhariPack,
  ESSENTIAL_WORSHIP_BOOKS,
} from '../../services/bukhari-service';
import { getCachedBukhariBookNumbers } from '../../services/storage';
import { HadithDetailModal } from './HadithDetailModal';
import { BukhariBookReaderModal } from './BukhariBookReaderModal';

type HadithTabMode = 'bukhari_all' | 'curated' | 'bookmarks';

export const HadithView: React.FC = () => {
  const { language, t, bookmarks, handleToggleBookmark } = useApp();
  const [tabMode, setTabMode] = useState<HadithTabMode>('bukhari_all');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [hadithNumberJump, setHadithNumberJump] = useState('');
  const [selectedCuratedHadith, setSelectedCuratedHadith] = useState<HadithRecord | null>(null);

  // Bukhari Reader state
  const [activeBukhariBook, setActiveBukhariBook] = useState<BukhariBookSummary | null>(null);
  const [jumpHadithTarget, setJumpHadithTarget] = useState<number | undefined>(undefined);

  // Offline caching status
  const [cachedBookNumbers, setCachedBookNumbers] = useState<number[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    getCachedBukhariBookNumbers().then(setCachedBookNumbers).catch(console.warn);
  }, [activeBukhariBook]);

  // Filter Bukhari books by search
  const filteredBukhariBooks = BUKHARI_BOOKS_INDEX.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.titleEn.toLowerCase().includes(q) ||
      b.titleAr.includes(q) ||
      (b.titleBn && b.titleBn.toLowerCase().includes(q)) ||
      (b.titleUr && b.titleUr.includes(q)) ||
      (b.titleHi && b.titleHi.includes(q)) ||
      b.bookNumber.toString() === q
    );
  });

  const handleJumpToHadith = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(hadithNumberJump.trim(), 10);
    if (isNaN(num) || num < 1 || num > 7563) return;

    const book = findBukhariBookByHadithNumber(num);
    if (book) {
      setJumpHadithTarget(num);
      setActiveBukhariBook(book);
    }
  };

  const handleDownloadPack = async (packType: 'essential' | 'full') => {
    const list = packType === 'essential'
      ? ESSENTIAL_WORSHIP_BOOKS
      : BUKHARI_BOOKS_INDEX.map((b) => b.bookNumber);

    setDownloadProgress({ done: 0, total: list.length });

    await downloadBukhariPack(list, (done, total) => {
      setDownloadProgress({ done, total });
    });

    const updated = await getCachedBukhariBookNumbers();
    setCachedBookNumbers(updated);
    setDownloadProgress(null);
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-20">
      {/* Tab Switcher: Complete Sahih al-Bukhari (7,563), Curated, Bookmarks */}
      <div className="flex items-center justify-between gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
        <button
          onClick={() => setTabMode('bukhari_all')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            tabMode === 'bukhari_all'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Library className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Sahih al-Bukhari (7,563)</span>
        </button>

        <button
          onClick={() => setTabMode('curated')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            tabMode === 'curated'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Core Selections</span>
        </button>

        <button
          onClick={() => setTabMode('bookmarks')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            tabMode === 'bookmarks'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>{t.bookmarkedOnly} ({bookmarks.filter(b => b.startsWith('hadith_') || b.startsWith('bukhari_')).length})</span>
        </button>
      </div>

      {/* MODE 1: COMPLETE SAHIH AL-BUKHARI (7,563 HADITHS ACROSS 97 BOOKS) */}
      {tabMode === 'bukhari_all' && (
        <div className="flex flex-col gap-4">
          {/* Direct Hadith # Jump Bar */}
          <form
            onSubmit={handleJumpToHadith}
            className="flex items-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-sm"
          >
            <div className="flex-1">
              <span className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">
                Direct Hadith Lookup
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <input
                  type="number"
                  min="1"
                  max="7563"
                  placeholder="Enter Hadith Number (1–7563)..."
                  value={hadithNumberJump}
                  onChange={(e) => setHadithNumberJump(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/50 focus:outline-none focus:bg-white/20"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-3.5 px-4 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Jump
            </button>
          </form>

          {/* Offline Pack Download Banner */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Offline Hadith Caching</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {cachedBookNumbers.length} of 97 books cached offline in your browser's IndexedDB.
              </p>
            </div>

            {downloadProgress ? (
              <div className="w-full sm:w-48 flex flex-col gap-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Downloading...</span>
                  <span>{downloadProgress.done} / {downloadProgress.total}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full transition-all"
                    style={{ width: `${(downloadProgress.done / downloadProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownloadPack('essential')}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  Download Essential Books (17)
                </button>
                <button
                  onClick={() => handleDownloadPack('full')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Download All 97
                </button>
              </div>
            )}
          </div>

          {/* Search Books input */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 97 Books of Bukhari (e.g. Prayer, Fasting, Tawheed)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* 97 Books Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredBukhariBooks.map((book) => {
              const isCached = cachedBookNumbers.includes(book.bookNumber);
              const titleLocalized =
                (language === 'bn' && book.titleBn) ||
                (language === 'ur' && book.titleUr) ||
                (language === 'hi' && book.titleHi) ||
                (language === 'ar' && book.titleAr) ||
                book.titleEn;

              return (
                <button
                  key={book.bookNumber}
                  onClick={() => {
                    setJumpHadithTarget(undefined);
                    setActiveBukhariBook(book);
                  }}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all text-left flex flex-col justify-between group shadow-xs cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
                        Book {book.bookNumber}
                      </span>
                      {isCached ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Offline</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {book.totalHadiths} Hadiths
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {titleLocalized}
                    </h4>

                    <div
                      dir="rtl"
                      className="text-xs text-slate-500 font-serif font-amiri mt-1 text-right truncate"
                    >
                      {book.titleAr}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono">#{book.startHadithNumber}–#{book.endHadithNumber}</span>
                    <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span>Read</span>
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 2: CURATED TOP SELECTIONS */}
      {tabMode === 'curated' && (
        <div className="flex flex-col gap-3">
          {VERIFIED_HADITHS.map((hadith) => {
            const isBookmarked = bookmarks.includes(hadith.id);
            const collectionName = hadith.collectionName[language] || hadith.collectionName.en;
            const chapter = hadith.chapterTitle[language] || hadith.chapterTitle.en;
            const translation = hadith.translations[language] || hadith.translations.en;

            return (
              <div
                key={hadith.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                        {hadith.grading}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {collectionName} · Hadith #{hadith.hadithNumber}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleBookmark(hadith.id, 'hadith')}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isBookmarked ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title={isBookmarked ? t.bookmarked : t.bookmark}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                    {chapter}
                  </h3>

                  <p
                    dir="rtl"
                    className="mt-2.5 text-base md:text-lg font-serif text-slate-800 dark:text-slate-200 leading-relaxed font-amiri line-clamp-2"
                  >
                    {hadith.arabicText}
                  </p>

                  <p className="mt-2 text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    "{translation}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Graded by: {hadith.grader}
                  </span>
                  <button
                    onClick={() => setSelectedCuratedHadith(hadith)}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {t.readFullHadith}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODE 3: BOOKMARKS */}
      {tabMode === 'bookmarks' && (
        <div className="flex flex-col gap-3">
          {bookmarks.filter(b => b.startsWith('hadith_') || b.startsWith('bukhari_')).length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              No bookmarked Hadiths yet. Click the bookmark icon on any Hadith to save it here for offline reference.
            </div>
          ) : (
            VERIFIED_HADITHS.filter((h) => bookmarks.includes(h.id)).map((hadith) => (
              <div
                key={hadith.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                      {hadith.collectionName[language] || hadith.collectionName.en} · #{hadith.hadithNumber}
                    </span>
                    <button
                      onClick={() => handleToggleBookmark(hadith.id, 'hadith')}
                      className="p-1.5 text-emerald-600 rounded-lg cursor-pointer"
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                    {hadith.chapterTitle[language] || hadith.chapterTitle.en}
                  </h3>
                  <p className="mt-2 text-xs md:text-sm text-slate-600 dark:text-slate-300">
                    "{hadith.translations[language] || hadith.translations.en}"
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCuratedHadith(hadith)}
                  className="mt-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 self-end cursor-pointer"
                >
                  {t.readFullHadith}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      <HadithDetailModal
        hadith={selectedCuratedHadith}
        onClose={() => setSelectedCuratedHadith(null)}
      />

      <BukhariBookReaderModal
        book={activeBukhariBook}
        initialHadithNumber={jumpHadithTarget}
        onClose={() => {
          setActiveBukhariBook(null);
          setJumpHadithTarget(undefined);
        }}
      />
    </div>
  );
};
