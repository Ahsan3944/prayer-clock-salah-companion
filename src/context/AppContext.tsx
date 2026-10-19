import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  CurrentPrayerStatus,
  DailyPrayerTimes,
  DuaAmalRecord,
  LocationProfile,
  PrayerCalculationSettings,
  SupportedLanguage,
} from '../types';
import { PRESET_CITIES, presetCityToLocationProfile } from '../services/preset-cities';
import { computeCurrentPrayerStatus, getTodayPrayerTimes } from '../services/prayer-service';
import { clearCache, getBookmarks, purgeAllData, toggleBookmark } from '../services/storage';
import { TRANSLATIONS, Translations } from '../localization';

export type ActiveTab = 'home' | 'calendar' | 'hadith' | 'dua-amal' | 'settings';

interface AppContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  isRTL: boolean;
  t: Translations;
  activeLocation: LocationProfile;
  setActiveLocation: (loc: LocationProfile) => void;
  prayerSettings: PrayerCalculationSettings;
  updatePrayerSettings: (settings: Partial<PrayerCalculationSettings>) => void;
  todayPrayerTimes: DailyPrayerTimes | null;
  currentPrayerStatus: CurrentPrayerStatus | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOnline: boolean;
  bookmarks: string[];
  handleToggleBookmark: (id: string, type: 'hadith' | 'dua') => Promise<void>;
  activeTasbihItem: DuaAmalRecord | null;
  startTasbihSession: (item: DuaAmalRecord) => void;
  closeTasbihSession: () => void;
  refreshSchedule: () => Promise<void>;
  handleClearCache: () => Promise<void>;
  handlePurgeAllData: () => Promise<void>;
  currentTime: Date;
}

const defaultLocation = presetCityToLocationProfile(PRESET_CITIES[0]); // Makkah default

const defaultSettings: PrayerCalculationSettings = {
  methodId: 4, // Umm Al-Qura default for Makkah
  methodName: 'Umm Al-Qura University, Makkah',
  asrSchool: 'standard',
  highLatitudeRule: 'angle_based',
  hijriOffsetDays: 0,
  timeFormat: '12h',
  showSeconds: true,
  vibrationEnabled: true,
  audioAdhanEnabled: true,
};

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('salah_language') as SupportedLanguage;
      if (['en', 'bn', 'hi', 'ur', 'ar'].includes(saved)) return saved;
    }
    return 'en';
  });

  const [activeLocation, setActiveLocationState] = useState<LocationProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('salah_location');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return defaultLocation;
  });

  const [prayerSettings, setPrayerSettingsState] = useState<PrayerCalculationSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('salah_settings');
      if (saved) {
        try {
          return { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) {}
      }
    }
    return defaultSettings;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [todayPrayerTimes, setTodayPrayerTimes] = useState<DailyPrayerTimes | null>(null);
  const [currentPrayerStatus, setCurrentPrayerStatus] = useState<CurrentPrayerStatus | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [activeTasbihItem, setActiveTasbihItem] = useState<DuaAmalRecord | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const isRTL = language === 'ar' || language === 'ur';
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Sync HTML dir and lang attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', language);
    }
  }, [language, isRTL]);

  // Online / Offline monitor
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Clock tick every second (local memory tick)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      if (todayPrayerTimes) {
        const status = computeCurrentPrayerStatus(todayPrayerTimes, now);
        setCurrentPrayerStatus(status);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [todayPrayerTimes]);

  // Load Bookmarks on mount
  useEffect(() => {
    getBookmarks().then(setBookmarks).catch(console.warn);
  }, []);

  // Load or compute Today's prayer times whenever location or settings change
  const loadSchedule = async () => {
    try {
      const schedule = await getTodayPrayerTimes(activeLocation, prayerSettings, language);
      setTodayPrayerTimes(schedule);
      const status = computeCurrentPrayerStatus(schedule, new Date());
      setCurrentPrayerStatus(status);
    } catch (e) {
      console.warn('Failed to compute today prayer schedule', e);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [activeLocation, prayerSettings, language]);

  const setLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('salah_language', newLang);
    }
  };

  const setActiveLocation = (loc: LocationProfile) => {
    setActiveLocationState(loc);
    if (typeof window !== 'undefined') {
      localStorage.setItem('salah_location', JSON.stringify(loc));
    }
  };

  const updatePrayerSettings = (newSettings: Partial<PrayerCalculationSettings>) => {
    setPrayerSettingsState((prev) => {
      const merged = { ...prev, ...newSettings };
      if (typeof window !== 'undefined') {
        localStorage.setItem('salah_settings', JSON.stringify(merged));
      }
      return merged;
    });
  };

  const handleToggleBookmark = async (id: string, type: 'hadith' | 'dua') => {
    await toggleBookmark(id, type);
    const updated = await getBookmarks();
    setBookmarks(updated);
  };

  const startTasbihSession = (item: DuaAmalRecord) => {
    setActiveTasbihItem(item);
  };

  const closeTasbihSession = () => {
    setActiveTasbihItem(null);
  };

  const refreshSchedule = async () => {
    await clearCache();
    await loadSchedule();
  };

  const handleClearCache = async () => {
    await clearCache();
    await loadSchedule();
  };

  const handlePurgeAllData = async () => {
    await purgeAllData();
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        isRTL,
        t,
        activeLocation,
        setActiveLocation,
        prayerSettings,
        updatePrayerSettings,
        todayPrayerTimes,
        currentPrayerStatus,
        activeTab,
        setActiveTab,
        isOnline,
        bookmarks,
        handleToggleBookmark,
        activeTasbihItem,
        startTasbihSession,
        closeTasbihSession,
        refreshSchedule,
        handleClearCache,
        handlePurgeAllData,
        currentTime,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
