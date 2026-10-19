export type SupportedLanguage = 'en' | 'bn' | 'hi' | 'ur' | 'ar';

export type AsrSchool = 'standard' | 'hanafi'; // standard = Shafi'i/Maliki/Hanbali (1x shadow), hanafi = 2x shadow

export type HighLatitudeRule = 'middle_of_the_night' | 'one_seventh' | 'angle_based';

export type TimeFormat = '12h' | '24h';

export interface LocationProfile {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isAutomatic: boolean;
  lastUpdated: number;
}

export interface PrayerCalculationSettings {
  methodId: number;
  methodName: string;
  asrSchool: AsrSchool;
  highLatitudeRule: HighLatitudeRule;
  hijriOffsetDays: number; // -2 to +2
  timeFormat: TimeFormat;
  showSeconds: boolean;
  vibrationEnabled: boolean;
  audioAdhanEnabled: boolean;
}

export type PrayerName = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export interface PrayerTimesRecord {
  Fajr: string; // HH:mm format
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

export interface DailyPrayerTimes {
  compositeId?: string; // ${locationId}_${dateString}
  dateString: string; // YYYY-MM-DD
  gregorianDate: {
    day: number;
    month: number;
    year: number;
    monthName: string;
    dayName: string;
  };
  hijriDate: {
    day: number;
    month: number;
    year: number;
    monthNameEn: string;
    monthNameAr: string;
    monthNameLocalized: string;
    designation: string;
  };
  timings: PrayerTimesRecord;
  windowEnds: {
    Fajr: string; // Sunrise
    Dhuhr: string; // Asr start
    Asr: string; // Sunset / Maghrib
    Maghrib: string; // Isha start
    Isha: string; // Midnight / Fajr
  };
  locationId: string;
  calculationSource: 'aladhan_api' | 'local_astronomical';
  fetchedAt: number;
}

export interface CurrentPrayerStatus {
  currentPrayer: PrayerName | null;
  currentPrayerEndTime: string | null;
  currentPrayerTimeRemainingMs: number;
  currentPrayerElapsedPercent: number;
  nextPrayer: PrayerName;
  nextPrayerStartTime: string;
  nextPrayerTimeRemainingMs: number;
  isMakruhTime: boolean;
  makruhReason?: string;
}

export interface HistoricalEvent {
  id: string;
  hijriMonth: number;
  hijriDay: number;
  title: Record<SupportedLanguage, string>;
  description: Record<SupportedLanguage, string>;
  sourceReferences: string[];
  confidence: 'Confirmed' | 'Approximate' | 'Disputed';
  historicalYearHijri?: number;
  historicalYearGregorian?: number;
}

export interface HadithRecord {
  id: string;
  collection: 'bukhari' | 'muslim' | 'abudawud' | 'tirmidhi' | 'nasai' | 'ibnmajah';
  collectionName: Record<SupportedLanguage, string>;
  hadithNumber: string;
  bookNumber?: string;
  chapterTitle: Record<SupportedLanguage, string>;
  arabicText: string;
  translations: Record<SupportedLanguage, string>;
  grading: 'Sahih' | 'Hasan';
  grader: string;
  topics: string[];
  reference: string;
  verified: boolean;
}

export interface DuaAmalRecord {
  id: string;
  title: Record<SupportedLanguage, string>;
  category: 'morning' | 'evening' | 'post_prayer' | 'daily' | 'protection';
  arabicText: string;
  transliteration: string;
  translations: Record<SupportedLanguage, string>;
  meaning: Record<SupportedLanguage, string>;
  sourceReference: string;
  prescribedCount: number | null; // null if open/unspecified
  sunnahVirtue?: Record<SupportedLanguage, string>;
  verified: boolean;
}

export interface TasbihSessionItem {
  duaId: string;
  title: string;
  arabicText: string;
  transliteration: string;
  translation: string;
  sourceReference: string;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
}

export interface TasbihSession {
  sessionId: string;
  sessionType: 'today_amal' | 'custom';
  items: TasbihSessionItem[];
  currentItemIndex: number;
  status: 'in_progress' | 'completed';
  createdAt: number;
  lastUpdatedAt: number;
}

export interface BukhariBookSummary {
  bookNumber: number;
  titleEn: string;
  titleAr: string;
  titleBn?: string;
  titleUr?: string;
  titleHi?: string;
  startHadithNumber: number;
  endHadithNumber: number;
  totalHadiths: number;
}

export interface BukhariHadithItem {
  hadithNumber: number;
  arabicNumber?: number;
  bookNumber: number;
  arabicText: string;
  englishText: string;
  bengaliText?: string;
  urduText?: string;
  hindiText?: string;
  chapterTitleEn?: string;
  chapterTitleAr?: string;
  chapterTitleBn?: string;
  chapterTitleUr?: string;
  chapterTitleHi?: string;
  grading: 'Sahih';
  inBookReference?: {
    book: number;
    hadith: number;
  };
}

export interface SyncMetadata {
  key: string;
  lastSuccessfulSync: number;
  nextEligibleSync: number;
  provider: string;
  daysCached: number;
  lastError: string | null;
}
