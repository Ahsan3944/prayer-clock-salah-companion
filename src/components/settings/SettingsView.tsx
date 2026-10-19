import React, { useState } from 'react';
import {
  Bell,
  Check,
  Compass,
  Database,
  Globe,
  Info,
  MapPin,
  RefreshCw,
  Shield,
  Trash2,
  Volume2,
  Smartphone,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CALCULATION_METHODS } from '../../services/astronomical-engine';
import { PRESET_CITIES, presetCityToLocationProfile } from '../../services/preset-cities';
import { AsrSchool, SupportedLanguage, TimeFormat } from '../../types';
import { QiblaCompassModal } from '../qibla/QiblaCompassModal';

export const SettingsView: React.FC = () => {
  const {
    language,
    setLanguage,
    activeLocation,
    setActiveLocation,
    prayerSettings,
    updatePrayerSettings,
    refreshSchedule,
    handleClearCache,
    handlePurgeAllData,
    t,
  } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isQiblaOpen, setIsQiblaOpen] = useState(false);

  const languages: Array<{ code: SupportedLanguage; label: string; native: string }> = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'ur', label: 'Urdu', native: 'اردو' },
    { code: 'ar', label: 'Arabic', native: 'العربية' },
  ];

  const handleLanguageChange = (code: SupportedLanguage) => {
    setLanguage(code);
  };

  const handleCitySelect = (cityId: string) => {
    const city = PRESET_CITIES.find((c) => c.id === cityId);
    if (city) {
      const loc = presetCityToLocationProfile(city);
      setActiveLocation(loc);
      // Auto-set recommended calculation method for that city
      updatePrayerSettings({
        methodId: city.recommendedMethodId,
        methodName: CALCULATION_METHODS[city.recommendedMethodId]?.name || 'Standard',
      });
    }
  };

  const handleAutoGPS = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setActiveLocation({
          id: `gps_${latitude.toFixed(2)}_${longitude.toFixed(2)}`,
          name: 'Current GPS Location',
          country: 'Detected',
          latitude,
          longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          isAutomatic: true,
          lastUpdated: Date.now(),
        });
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(err.message || 'Unable to retrieve location permission.');
      },
      { timeout: 10000 }
    );
  };

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    await refreshSchedule();
    setIsRefreshing(false);
  };

  const handleTestAudioAdhan = () => {
    // Play a gentle local synthesized melodic chime using Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5); // A5

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      console.warn('Web Audio not available', e);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-24">
      {/* 1. Language & Appearance */}
      <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.languageAndAppearance}
          </h3>
        </div>

        {/* 5 Languages Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
            {t.selectLanguage}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => handleLanguageChange(l.code)}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  language === l.code
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-900 dark:text-emerald-200 font-bold ring-1 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="text-left">
                  <div className="text-xs">{l.label}</div>
                  <div className="text-sm font-bold opacity-80">{l.native}</div>
                </div>
                {language === l.code && <Check className="w-4 h-4 text-emerald-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Time Format & Clock Seconds */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              {t.timeFormat}
            </label>
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              {(['12h', '24h'] as TimeFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => updatePrayerSettings({ timeFormat: fmt })}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    prayerSettings.timeFormat === fmt
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {fmt === '12h' ? '12-Hour (AM/PM)' : '24-Hour'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              {t.showSeconds}
            </label>
            <button
              onClick={() => updatePrayerSettings({ showSeconds: !prayerSettings.showSeconds })}
              className={`w-full py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-between cursor-pointer ${
                prayerSettings.showSeconds
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>Clock Seconds Counter</span>
              <span className="font-bold">{prayerSettings.showSeconds ? 'Enabled' : 'Disabled'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Location & Calculation Settings */}
      <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.locationAndCalculation}
          </h3>
        </div>

        {/* Current Location Display & GPS Trigger */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">{t.activeLocation}</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              {activeLocation.name}, {activeLocation.country}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {activeLocation.latitude.toFixed(4)}° N, {activeLocation.longitude.toFixed(4)}° E ({activeLocation.timezone})
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQiblaOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Qibla</span>
            </button>
            <button
              onClick={handleAutoGPS}
              disabled={gpsLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{gpsLoading ? 'Detecting...' : t.autoGps}</span>
            </button>
          </div>
        </div>

        {gpsError && (
          <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900">
            {gpsError}
          </div>
        )}

        {/* Global Cities Preset Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
            {t.manualCity} (120+ Global Cities)
          </label>
          <select
            value={activeLocation.id}
            onChange={(e) => handleCitySelect(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
          >
            {PRESET_CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}, {c.country}
              </option>
            ))}
          </select>
        </div>

        {/* Calculation Method */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
            {t.calculationMethod}
          </label>
          <select
            value={prayerSettings.methodId}
            onChange={(e) => {
              const id = parseInt(e.target.value, 10);
              updatePrayerSettings({
                methodId: id,
                methodName: CALCULATION_METHODS[id]?.name || 'Custom',
              });
            }}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
          >
            {Object.values(CALCULATION_METHODS).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} (Fajr {m.fajrAngle}°, Isha {m.ishaAngleOrMinutes}{m.isIshaAngle ? '°' : 'm'})
              </option>
            ))}
          </select>
        </div>

        {/* Asr Madhhab Shadow Rule */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
            {t.asrJurisprudence}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { id: 'standard' as AsrSchool, label: t.standardAsr },
              { id: 'hanafi' as AsrSchool, label: t.hanafiAsr },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => updatePrayerSettings({ asrSchool: s.id })}
                className={`p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                  prayerSettings.asrSchool === s.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 font-bold text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Notifications & Audio Adhan */}
      <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.notificationsTitle}
          </h3>
        </div>

        <div className="flex flex-col gap-3">
          {/* Audio Chime */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {t.audioAdhan}
              </div>
              <div className="text-[11px] text-slate-500">
                Play soft harmonic audio chime when prayer time arrives
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestAudioAdhan}
                className="px-2.5 py-1 text-xs font-medium bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updatePrayerSettings({ audioAdhanEnabled: !prayerSettings.audioAdhanEnabled })}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  prayerSettings.audioAdhanEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    prayerSettings.audioAdhanEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Haptic Vibration */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {t.vibrationFeedback}
              </div>
              <div className="text-[11px] text-slate-500">
                Tactile feedback when counting on Tasbih counter
              </div>
            </div>
            <button
              onClick={() => updatePrayerSettings({ vibrationEnabled: !prayerSettings.vibrationEnabled })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                prayerSettings.vibrationEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  prayerSettings.vibrationEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Cache & Offline Storage */}
      <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.cacheAndStorage}
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              IndexedDB Timetable Cache
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              30-day schedules cached for instantaneous offline display with 24-hour refresh throttling.
            </div>
          </div>

          <button
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{t.refreshNow}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={handleClearCache}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {t.clearCacheBtn}
          </button>
          <button
            onClick={() => setShowPurgeConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.purgeAllDataBtn}</span>
          </button>
        </div>
      </section>

      {/* 5. Privacy, About & Legal */}
      <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>{t.privacyTitle}</span>
        </div>
        <p className="leading-relaxed">
          {t.privacyNotice}
        </p>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm mb-1">
            <Info className="w-4 h-4 text-emerald-600" />
            <span>{t.aboutTitle}</span>
          </div>
          <p className="leading-relaxed">
            {t.aboutText}
          </p>
          <div className="mt-2 text-[11px] text-slate-400">
            Version 1.0.0 · Local-First Web/PWA
          </div>
        </div>
      </section>

      {/* Purge Confirmation Modal */}
      {showPurgeConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h4 className="text-base font-bold text-rose-600 dark:text-rose-400">
              {t.purgeConfirmTitle}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {t.purgeConfirmMessage}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowPurgeConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={handlePurgeAllData}
                className="flex-1 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                Purge All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Qibla Compass Modal */}
      <QiblaCompassModal
        isOpen={isQiblaOpen}
        onClose={() => setIsQiblaOpen(false)}
      />
    </div>
  );
};
