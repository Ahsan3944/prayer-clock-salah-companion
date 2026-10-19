import { BukhariHadithItem, SupportedLanguage } from '../types';
import { BUKHARI_BOOKS_INDEX, findBukhariBookByHadithNumber } from '../data/bukhari-books-index';
import {
  getBukhariHadithByNumber,
  getBukhariHadithsByBook,
  getCachedBukhariBookNumbers,
  isBukhariBookCached,
  saveBukhariHadithsBatch,
} from './storage';

const CDN_BASE_PRIMARY = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';
const CDN_BASE_BACKUP = 'https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions';

async function fetchJsonWithFallback(path: string): Promise<any | null> {
  const primaryUrl = `${CDN_BASE_PRIMARY}/${path}`;
  const backupUrl = `${CDN_BASE_BACKUP}/${path}`;

  try {
    const res = await fetch(primaryUrl);
    if (res.ok) return await res.json();
  } catch (e) {
    // try backup
  }

  try {
    const res = await fetch(backupUrl);
    if (res.ok) return await res.json();
  } catch (e) {
    // failed both
  }

  return null;
}

export async function fetchAndCacheBukhariBook(
  bookNumber: number,
  preferredLang: SupportedLanguage = 'en'
): Promise<BukhariHadithItem[]> {
  const bookMeta = BUKHARI_BOOKS_INDEX.find((b) => b.bookNumber === bookNumber);
  if (!bookMeta) return [];

  // 1. Check local IndexedDB cache first
  const cached = await getBukhariHadithsByBook(bookNumber);
  if (cached && cached.length > 0) {
    // Verify if preferred language is present in cached items
    const hasBengali = cached.some((h) => !!h.bengaliText);
    const hasUrdu = cached.some((h) => !!h.urduText);

    let needsUpdate = false;

    // If user prefers Bengali but cached records don't have it, fetch and merge
    if (preferredLang === 'bn' && !hasBengali) {
      const benData = await fetchJsonWithFallback(`ben-bukhari/sections/${bookNumber}.json`);
      if (benData?.hadiths && benData.hadiths.length > 0) {
        const benMap = new Map<number, string>();
        for (const bh of benData.hadiths) {
          if (bh.hadithnumber && bh.text) benMap.set(bh.hadithnumber, bh.text);
        }
        for (const item of cached) {
          const text = benMap.get(item.hadithNumber);
          if (text) {
            item.bengaliText = text;
            needsUpdate = true;
          }
        }
      }
    }

    // If user prefers Urdu but cached records don't have it, fetch and merge
    if (preferredLang === 'ur' && !hasUrdu) {
      const urdData = await fetchJsonWithFallback(`urd-bukhari/sections/${bookNumber}.json`);
      if (urdData?.hadiths && urdData.hadiths.length > 0) {
        const urdMap = new Map<number, string>();
        for (const uh of urdData.hadiths) {
          if (uh.hadithnumber && uh.text) urdMap.set(uh.hadithnumber, uh.text);
        }
        for (const item of cached) {
          const text = urdMap.get(item.hadithNumber);
          if (text) {
            item.urduText = text;
            needsUpdate = true;
          }
        }
      }
    }

    if (needsUpdate) {
      await saveBukhariHadithsBatch(cached, bookNumber);
    }

    return cached;
  }

  // 2. Fetch Arabic, English, Bengali, and Urdu sections in parallel from verified sources
  const [araData, engData, benData, urdData] = await Promise.all([
    fetchJsonWithFallback(`ara-bukhari/sections/${bookNumber}.json`),
    fetchJsonWithFallback(`eng-bukhari/sections/${bookNumber}.json`),
    fetchJsonWithFallback(`ben-bukhari/sections/${bookNumber}.json`),
    fetchJsonWithFallback(`urd-bukhari/sections/${bookNumber}.json`),
  ]);

  if (!araData && !engData) {
    // If completely offline and nothing in cache, return empty list (do not invent translations)
    return [];
  }

  const araHadiths: any[] = araData?.hadiths || [];
  const engHadiths: any[] = engData?.hadiths || [];
  const benHadiths: any[] = benData?.hadiths || [];
  const urdHadiths: any[] = urdData?.hadiths || [];

  const hadithMap = new Map<number, BukhariHadithItem>();

  // Map English hadiths with references
  for (const item of engHadiths) {
    const num = item.hadithnumber;
    hadithMap.set(num, {
      hadithNumber: num,
      arabicNumber: item.arabicnumber,
      bookNumber,
      arabicText: '',
      englishText: item.text || '',
      chapterTitleEn: bookMeta.titleEn,
      chapterTitleAr: bookMeta.titleAr,
      chapterTitleBn: bookMeta.titleBn,
      chapterTitleUr: bookMeta.titleUr,
      chapterTitleHi: bookMeta.titleHi,
      grading: 'Sahih',
      inBookReference: item.reference ? { book: item.reference.book, hadith: item.reference.hadith } : undefined,
    });
  }

  // Merge Arabic vocalized text
  for (const item of araHadiths) {
    const num = item.hadithnumber;
    const existing = hadithMap.get(num);
    if (existing) {
      existing.arabicText = item.text || '';
      if (!existing.arabicNumber && item.arabicnumber) {
        existing.arabicNumber = item.arabicnumber;
      }
    } else {
      hadithMap.set(num, {
        hadithNumber: num,
        arabicNumber: item.arabicnumber,
        bookNumber,
        arabicText: item.text || '',
        englishText: '',
        chapterTitleEn: bookMeta.titleEn,
        chapterTitleAr: bookMeta.titleAr,
        chapterTitleBn: bookMeta.titleBn,
        chapterTitleUr: bookMeta.titleUr,
        chapterTitleHi: bookMeta.titleHi,
        grading: 'Sahih',
        inBookReference: item.reference ? { book: item.reference.book, hadith: item.reference.hadith } : undefined,
      });
    }
  }

  // Merge Bengali authentic translation
  for (const item of benHadiths) {
    const num = item.hadithnumber;
    const existing = hadithMap.get(num);
    if (existing && item.text) {
      existing.bengaliText = item.text;
    }
  }

  // Merge Urdu authentic translation
  for (const item of urdHadiths) {
    const num = item.hadithnumber;
    const existing = hadithMap.get(num);
    if (existing && item.text) {
      existing.urduText = item.text;
    }
  }

  const mergedList = Array.from(hadithMap.values());
  mergedList.sort((a, b) => a.hadithNumber - b.hadithNumber);

  // Save to IndexedDB for offline durability
  if (mergedList.length > 0) {
    await saveBukhariHadithsBatch(mergedList, bookNumber);
  }

  return mergedList;
}

export async function getBukhariHadithDirect(
  hadithNumber: number,
  preferredLang: SupportedLanguage = 'en'
): Promise<BukhariHadithItem | null> {
  const bookMeta = findBukhariBookByHadithNumber(hadithNumber);
  if (!bookMeta) return null;

  // Check local cache
  const cached = await getBukhariHadithByNumber(hadithNumber);
  if (cached) {
    // If the cached hadith needs Bengali or Urdu and doesn't have it, fetch the book to populate
    if (preferredLang === 'bn' && !cached.bengaliText) {
      const bookItems = await fetchAndCacheBukhariBook(bookMeta.bookNumber, preferredLang);
      return bookItems.find((h) => h.hadithNumber === hadithNumber) || cached;
    }
    if (preferredLang === 'ur' && !cached.urduText) {
      const bookItems = await fetchAndCacheBukhariBook(bookMeta.bookNumber, preferredLang);
      return bookItems.find((h) => h.hadithNumber === hadithNumber) || cached;
    }
    return cached;
  }

  const bookItems = await fetchAndCacheBukhariBook(bookMeta.bookNumber, preferredLang);
  return bookItems.find((h) => h.hadithNumber === hadithNumber) || null;
}

export async function downloadBukhariPack(
  bookNumbers: number[],
  onProgress: (done: number, total: number) => void
): Promise<void> {
  let done = 0;
  const total = bookNumbers.length;

  for (const bookNum of bookNumbers) {
    const already = await isBukhariBookCached(bookNum);
    if (!already) {
      await fetchAndCacheBukhariBook(bookNum);
    }
    done++;
    onProgress(done, total);
  }
}

export const ESSENTIAL_WORSHIP_BOOKS = [
  1, // Revelation (1-7)
  2, // Belief (8-58)
  3, // Knowledge (59-134)
  4, // Wudu (135-247)
  8, // Prayers (349-520)
  9, // Times of Prayer (522-602)
  10, // Adhan (603-875)
  11, // Friday Prayer (876-941)
  13, // Eids (948-989)
  19, // Tahajjud (1120-1187)
  24, // Zakat (1395-1512)
  25, // Hajj (1513-1772)
  30, // Fasting (1891-2007)
  66, // Virtues of Quran (4979-5062)
  78, // Good Manners / Adab (5970-6226)
  80, // Invocations / Da'awat (6304-6411)
  81, // Riqaq (6412-6593)
  97, // Tawheed (7371-7563)
];
