import { CurrentPrayerStatus, DailyPrayerTimes, LocationProfile, PrayerCalculationSettings, PrayerName, PrayerTimesRecord, SupportedLanguage } from '../types';
import { calculateLocalPrayerTimes } from './astronomical-engine';
import { gregorianToHijri } from './hijri-calendar';
import { getMonthlySchedules, getPrayerSchedule, getSyncMetadata, savePrayerSchedule, savePrayerSchedulesBatch, saveSyncMetadata } from './storage';

export function getNowInTimezone(timezone?: string): Date {
  const now = new Date();
  if (!timezone) return now;
  try {
    const invDateStr = now.toLocaleString('en-US', { timeZone: timezone });
    return new Date(invDateStr);
  } catch (e) {
    return now;
  }
}

export function getTimezoneOffsetHours(timezone?: string): number {
  if (timezone) {
    try {
      const now = new Date();
      const invDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      return (invDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
    } catch (e) {
      // fallback
    }
  }
  return -new Date().getTimezoneOffset() / 60;
}

function parseTimeToTodayDate(timeStr: string, baseDate: Date): Date {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

export async function fetchTodayPrayerTimesFromApi(
  location: LocationProfile,
  settings: PrayerCalculationSettings,
  lang: SupportedLanguage = 'en'
): Promise<DailyPrayerTimes | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const asrParam = settings.asrSchool === 'hanafi' ? 1 : 0;
    const url = `https://api.aladhan.com/v1/timings?latitude=${location.latitude}&longitude=${location.longitude}&method=${settings.methodId}&school=${asrParam}`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.code !== 200 || !data.data?.timings) return null;

    const rawTimings = data.data.timings;
    const cleanTime = (t: string) => t.split(' ')[0].trim();
    const timings: PrayerTimesRecord = {
      Fajr: cleanTime(rawTimings.Fajr),
      Sunrise: cleanTime(rawTimings.Sunrise),
      Dhuhr: cleanTime(rawTimings.Dhuhr),
      Asr: cleanTime(rawTimings.Asr),
      Sunset: cleanTime(rawTimings.Sunset || rawTimings.Maghrib),
      Maghrib: cleanTime(rawTimings.Maghrib),
      Isha: cleanTime(rawTimings.Isha),
      Imsak: cleanTime(rawTimings.Imsak || rawTimings.Fajr),
      Midnight: cleanTime(rawTimings.Midnight),
    };

    const nowInLoc = getNowInTimezone(location.timezone);
    const year = nowInLoc.getFullYear();
    const month = nowInLoc.getMonth() + 1;
    const day = nowInLoc.getDate();
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const hijri = gregorianToHijri(nowInLoc, settings.hijriOffsetDays, lang);

    const schedule: DailyPrayerTimes = {
      compositeId: `${location.id}_${dateStr}`,
      dateString: dateStr,
      gregorianDate: {
        day,
        month,
        year,
        monthName: nowInLoc.toLocaleString('default', { month: 'long' }),
        dayName: nowInLoc.toLocaleString('default', { weekday: 'long' }),
      },
      hijriDate: hijri,
      timings,
      windowEnds: {
        Fajr: timings.Sunrise,
        Dhuhr: timings.Asr,
        Asr: timings.Sunset,
        Maghrib: timings.Isha,
        Isha: timings.Midnight,
      },
      locationId: location.id,
      calculationSource: 'aladhan_api',
      fetchedAt: Date.now(),
    };

    await savePrayerSchedule(schedule);
    return schedule;
  } catch (err) {
    console.info('AlAdhan single-day timings API fetch error', err);
    return null;
  }
}

export async function fetchOrComputeMonthSchedule(
  year: number,
  month: number,
  location: LocationProfile,
  settings: PrayerCalculationSettings,
  lang: SupportedLanguage = 'en'
): Promise<DailyPrayerTimes[]> {
  const syncKey = `${location.id}_${year}_${month}_${settings.methodId}_${settings.asrSchool}`;
  const existingSchedules = await getMonthlySchedules(location.id, year, month);
  const daysInMonth = new Date(year, month, 0).getDate();

  // If we already have all days cached for this specific location and month, return them directly
  if (existingSchedules.length >= daysInMonth) {
    return existingSchedules;
  }

  // Check sync throttling
  const syncMeta = await getSyncMetadata(syncKey);
  const now = Date.now();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  let schedules: DailyPrayerTimes[] = [];
  let fetchedFromApi = false;

  if (isOnline && (!syncMeta || now >= syncMeta.nextEligibleSync)) {
    try {
      // Attempt AlAdhan API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const asrParam = settings.asrSchool === 'hanafi' ? 1 : 0; // AlAdhan: 0 = Standard, 1 = Hanafi
      const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${location.latitude}&longitude=${location.longitude}&method=${settings.methodId}&school=${asrParam}`;

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.code === 200 && Array.isArray(data.data)) {
          schedules = data.data.map((dayItem: any) => {
            const rawTimings = dayItem.timings;
            // Clean (strip "(EST)", "(+03)", etc.)
            const cleanTime = (t: string) => t.split(' ')[0].trim();
            const timings: PrayerTimesRecord = {
              Fajr: cleanTime(rawTimings.Fajr),
              Sunrise: cleanTime(rawTimings.Sunrise),
              Dhuhr: cleanTime(rawTimings.Dhuhr),
              Asr: cleanTime(rawTimings.Asr),
              Sunset: cleanTime(rawTimings.Sunset || rawTimings.Maghrib),
              Maghrib: cleanTime(rawTimings.Maghrib),
              Isha: cleanTime(rawTimings.Isha),
              Imsak: cleanTime(rawTimings.Imsak || rawTimings.Fajr),
              Midnight: cleanTime(rawTimings.Midnight),
            };

            const dayNum = parseInt(dayItem.date.gregorian.day, 10);
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
            const gDate = new Date(year, month - 1, dayNum);
            const hijri = gregorianToHijri(gDate, settings.hijriOffsetDays, lang);

            return {
              compositeId: `${location.id}_${dateStr}`,
              dateString: dateStr,
              gregorianDate: {
                day: dayNum,
                month,
                year,
                monthName: gDate.toLocaleString('default', { month: 'long' }),
                dayName: gDate.toLocaleString('default', { weekday: 'long' }),
              },
              hijriDate: hijri,
              timings,
              windowEnds: {
                Fajr: timings.Sunrise,
                Dhuhr: timings.Asr,
                Asr: timings.Sunset,
                Maghrib: timings.Isha,
                Isha: timings.Midnight,
              },
              locationId: location.id,
              calculationSource: 'aladhan_api',
              fetchedAt: now,
            };
          });

          fetchedFromApi = true;
        }
      }
    } catch (apiError) {
      console.info('AlAdhan calendar API unavailable or timed out; activating local astronomical engine', apiError);
    }
  }

  // If API fetch failed or offline, compute via local astronomical engine
  if (!fetchedFromApi || schedules.length === 0) {
    const timezoneOffset = getTimezoneOffsetHours(location.timezone);
    schedules = [];

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const gDate = new Date(year, month - 1, dayNum, 12, 0, 0);
      const timings = calculateLocalPrayerTimes(
        gDate,
        location.latitude,
        location.longitude,
        timezoneOffset,
        settings.methodId,
        settings.asrSchool,
        settings.highLatitudeRule
      );

      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
      const hijri = gregorianToHijri(gDate, settings.hijriOffsetDays, lang);

      schedules.push({
        compositeId: `${location.id}_${dateStr}`,
        dateString: dateStr,
        gregorianDate: {
          day: dayNum,
          month,
          year,
          monthName: gDate.toLocaleString('default', { month: 'long' }),
          dayName: gDate.toLocaleString('default', { weekday: 'long' }),
        },
        hijriDate: hijri,
        timings,
        windowEnds: {
          Fajr: timings.Sunrise,
          Dhuhr: timings.Asr,
          Asr: timings.Sunset,
          Maghrib: timings.Isha,
          Isha: timings.Midnight,
        },
        locationId: location.id,
        calculationSource: 'local_astronomical',
        fetchedAt: now,
      });
    }
  }

  // Save to IndexedDB
  await savePrayerSchedulesBatch(schedules);

  // Update sync metadata with 24-hour throttling rule
  await saveSyncMetadata({
    key: syncKey,
    lastSuccessfulSync: now,
    nextEligibleSync: now + 24 * 60 * 60 * 1000,
    provider: fetchedFromApi ? 'AlAdhan API' : 'Local Astronomical Engine',
    daysCached: schedules.length,
    lastError: null,
  });

  return schedules;
}

export async function getTodayPrayerTimes(
  location: LocationProfile,
  settings: PrayerCalculationSettings,
  lang: SupportedLanguage = 'en',
  forceFresh = false
): Promise<DailyPrayerTimes> {
  const nowInLoc = getNowInTimezone(location.timezone);
  const year = nowInLoc.getFullYear();
  const month = nowInLoc.getMonth() + 1;
  const day = nowInLoc.getDate();
  const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  if (!forceFresh) {
    const cached = await getPrayerSchedule(location.id, dateStr);
    if (cached && cached.locationId === location.id && cached.timings?.Maghrib) {
      return cached;
    }
  }

  // 1. Try fetching directly from AlAdhan API (lightweight, ~100ms)
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (isOnline) {
    const apiSchedule = await fetchTodayPrayerTimesFromApi(location, settings, lang);
    if (apiSchedule) {
      // Trigger monthly schedule in background so calendar view has full month
      fetchOrComputeMonthSchedule(year, month, location, settings, lang).catch(() => {});
      return apiSchedule;
    }
  }

  // 2. Try month schedule
  const monthSchedules = await fetchOrComputeMonthSchedule(year, month, location, settings, lang);
  const todaySchedule = monthSchedules.find((s) => s.dateString === dateStr && s.locationId === location.id);
  if (todaySchedule) return todaySchedule;

  // 3. Fallback: local astronomical calculation using accurate location timezone
  const tzOffset = getTimezoneOffsetHours(location.timezone);
  const timings = calculateLocalPrayerTimes(
    nowInLoc,
    location.latitude,
    location.longitude,
    tzOffset,
    settings.methodId,
    settings.asrSchool,
    settings.highLatitudeRule
  );
  const hijri = gregorianToHijri(nowInLoc, settings.hijriOffsetDays, lang);

  const fallbackSchedule: DailyPrayerTimes = {
    compositeId: `${location.id}_${dateStr}`,
    dateString: dateStr,
    gregorianDate: {
      day,
      month,
      year,
      monthName: nowInLoc.toLocaleString('default', { month: 'long' }),
      dayName: nowInLoc.toLocaleString('default', { weekday: 'long' }),
    },
    hijriDate: hijri,
    timings,
    windowEnds: {
      Fajr: timings.Sunrise,
      Dhuhr: timings.Asr,
      Asr: timings.Sunset,
      Maghrib: timings.Isha,
      Isha: timings.Midnight,
    },
    locationId: location.id,
    calculationSource: 'local_astronomical',
    fetchedAt: Date.now(),
  };

  await savePrayerSchedule(fallbackSchedule);
  return fallbackSchedule;
}

export function computeCurrentPrayerStatus(
  daily: DailyPrayerTimes,
  currentDate: Date = new Date()
): CurrentPrayerStatus {
  const { timings, windowEnds } = daily;

  const fajrStart = parseTimeToTodayDate(timings.Fajr, currentDate);
  const sunrise = parseTimeToTodayDate(timings.Sunrise, currentDate);
  const dhuhrStart = parseTimeToTodayDate(timings.Dhuhr, currentDate);
  const asrStart = parseTimeToTodayDate(timings.Asr, currentDate);
  const maghribStart = parseTimeToTodayDate(timings.Maghrib, currentDate);
  const ishaStart = parseTimeToTodayDate(timings.Isha, currentDate);

  const nowMs = currentDate.getTime();

  // Makruh periods:
  // 1. Sunrise: From sunrise until ~15 minutes after sunrise
  // 2. Solar Zenith (Zawal): ~10 minutes before Dhuhr until Dhuhr
  // 3. Sunset: ~15 minutes before Maghrib until Maghrib
  let isMakruhTime = false;
  let makruhReason = '';

  const sunriseMs = sunrise.getTime();
  if (nowMs >= sunriseMs && nowMs <= sunriseMs + 15 * 60 * 1000) {
    isMakruhTime = true;
    makruhReason = 'During Sunrise (Shuruq) — Prohibited prayer period';
  } else if (nowMs >= dhuhrStart.getTime() - 10 * 60 * 1000 && nowMs < dhuhrStart.getTime()) {
    isMakruhTime = true;
    makruhReason = 'Solar Zenith (Istawa/Zawal) — Disliked prayer period before Dhuhr';
  } else if (nowMs >= maghribStart.getTime() - 15 * 60 * 1000 && nowMs < maghribStart.getTime()) {
    isMakruhTime = true;
    makruhReason = 'During Sunset (Ghurub) — Disliked prayer period except Asr of the day';
  }

  // Determine current active prayer window & next prayer
  if (nowMs < fajrStart.getTime()) {
    // Before Fajr (Tahajjud window)
    return {
      currentPrayer: null,
      currentPrayerEndTime: timings.Fajr,
      currentPrayerTimeRemainingMs: fajrStart.getTime() - nowMs,
      currentPrayerElapsedPercent: 100,
      nextPrayer: 'Fajr',
      nextPrayerStartTime: timings.Fajr,
      nextPrayerTimeRemainingMs: fajrStart.getTime() - nowMs,
      isMakruhTime,
      makruhReason,
    };
  }

  if (nowMs >= fajrStart.getTime() && nowMs < sunrise.getTime()) {
    const totalMs = sunrise.getTime() - fajrStart.getTime();
    const elapsedMs = nowMs - fajrStart.getTime();
    return {
      currentPrayer: 'Fajr',
      currentPrayerEndTime: windowEnds.Fajr,
      currentPrayerTimeRemainingMs: sunrise.getTime() - nowMs,
      currentPrayerElapsedPercent: Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)),
      nextPrayer: 'Sunrise',
      nextPrayerStartTime: timings.Sunrise,
      nextPrayerTimeRemainingMs: sunrise.getTime() - nowMs,
      isMakruhTime,
      makruhReason,
    };
  }

  if (nowMs >= sunrise.getTime() && nowMs < dhuhrStart.getTime()) {
    return {
      currentPrayer: null,
      currentPrayerEndTime: timings.Dhuhr,
      currentPrayerTimeRemainingMs: dhuhrStart.getTime() - nowMs,
      currentPrayerElapsedPercent: 0,
      nextPrayer: 'Dhuhr',
      nextPrayerStartTime: timings.Dhuhr,
      nextPrayerTimeRemainingMs: dhuhrStart.getTime() - nowMs,
      isMakruhTime,
      makruhReason,
    };
  }

  if (nowMs >= dhuhrStart.getTime() && nowMs < asrStart.getTime()) {
    const totalMs = asrStart.getTime() - dhuhrStart.getTime();
    const elapsedMs = nowMs - dhuhrStart.getTime();
    return {
      currentPrayer: 'Dhuhr',
      currentPrayerEndTime: windowEnds.Dhuhr,
      currentPrayerTimeRemainingMs: asrStart.getTime() - nowMs,
      currentPrayerElapsedPercent: Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)),
      nextPrayer: 'Asr',
      nextPrayerStartTime: timings.Asr,
      nextPrayerTimeRemainingMs: asrStart.getTime() - nowMs,
      isMakruhTime,
      makruhReason,
    };
  }

  if (nowMs >= asrStart.getTime() && nowMs < maghribStart.getTime()) {
    const totalMs = maghribStart.getTime() - asrStart.getTime();
    const elapsedMs = nowMs - asrStart.getTime();
    return {
      currentPrayer: 'Asr',
      currentPrayerEndTime: windowEnds.Asr,
      currentPrayerTimeRemainingMs: maghribStart.getTime() - nowMs,
      currentPrayerElapsedPercent: Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)),
      nextPrayer: 'Maghrib',
      nextPrayerStartTime: timings.Maghrib,
      nextPrayerTimeRemainingMs: maghribStart.getTime() - nowMs,
      isMakruhTime,
      makruhReason,
    };
  }

  if (nowMs >= maghribStart.getTime() && nowMs < ishaStart.getTime()) {
    const totalMs = ishaStart.getTime() - maghribStart.getTime();
    const elapsedMs = nowMs - maghribStart.getTime();
    return {
      currentPrayer: 'Maghrib',
      currentPrayerEndTime: windowEnds.Maghrib,
      currentPrayerTimeRemainingMs: ishaStart.getTime() - nowMs,
      currentPrayerElapsedPercent: Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)),
      nextPrayer: 'Isha',
      nextPrayerStartTime: timings.Isha,
      nextPrayerTimeRemainingMs: ishaStart.getTime() - nowMs,
      isMakruhTime,
      makruhReason,
    };
  }

  // Isha window (from Isha start until midnight or next Fajr)
  const tomorrowFajr = new Date(fajrStart);
  tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
  const totalMs = tomorrowFajr.getTime() - ishaStart.getTime();
  const elapsedMs = nowMs - ishaStart.getTime();

  return {
    currentPrayer: 'Isha',
    currentPrayerEndTime: windowEnds.Isha,
    currentPrayerTimeRemainingMs: tomorrowFajr.getTime() - nowMs,
    currentPrayerElapsedPercent: Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)),
    nextPrayer: 'Fajr',
    nextPrayerStartTime: timings.Fajr,
    nextPrayerTimeRemainingMs: tomorrowFajr.getTime() - nowMs,
    isMakruhTime,
    makruhReason,
  };
}

export function formatTimeDisplay(timeStr: string, format: '12h' | '24h'): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);

  if (isNaN(h) || isNaN(m)) return timeStr;

  if (format === '24h') {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m.toString().padStart(2, '0')} ${period}`;
}

export function formatCountdownMs(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}
