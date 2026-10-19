import { AsrSchool, HighLatitudeRule, PrayerTimesRecord } from '../types';

export interface MethodConfig {
  id: number;
  name: string;
  fajrAngle: number;
  maghribAngleOrMinutes?: number; // if > 50, treated as angle; if <= 50, treated as minutes after sunset
  isMaghribAngle: boolean;
  ishaAngleOrMinutes: number; // if > 50, treated as angle; if <= 50, treated as minutes after Maghrib
  isIshaAngle: boolean;
}

export const CALCULATION_METHODS: Record<number, MethodConfig> = {
  1: { id: 1, name: 'University of Islamic Sciences, Karachi', fajrAngle: 18, isMaghribAngle: false, ishaAngleOrMinutes: 18, isIshaAngle: true },
  2: { id: 2, name: 'Islamic Society of North America (ISNA)', fajrAngle: 15, isMaghribAngle: false, ishaAngleOrMinutes: 15, isIshaAngle: true },
  3: { id: 3, name: 'Muslim World League (MWL)', fajrAngle: 18, isMaghribAngle: false, ishaAngleOrMinutes: 17, isIshaAngle: true },
  4: { id: 4, name: 'Umm Al-Qura University, Makkah', fajrAngle: 18.5, isMaghribAngle: false, ishaAngleOrMinutes: 90, isIshaAngle: false },
  5: { id: 5, name: 'Egyptian General Authority of Survey', fajrAngle: 19.5, isMaghribAngle: false, ishaAngleOrMinutes: 17.5, isIshaAngle: true },
  7: { id: 7, name: 'Institute of Geophysics, University of Tehran', fajrAngle: 17.7, maghribAngleOrMinutes: 4.5, isMaghribAngle: true, ishaAngleOrMinutes: 14, isIshaAngle: true },
  8: { id: 8, name: 'Gulf Region', fajrAngle: 19.5, isMaghribAngle: false, ishaAngleOrMinutes: 90, isIshaAngle: false },
  9: { id: 9, name: 'Kuwait', fajrAngle: 18, isMaghribAngle: false, ishaAngleOrMinutes: 17.5, isIshaAngle: true },
  10: { id: 10, name: 'Qatar', fajrAngle: 18, isMaghribAngle: false, ishaAngleOrMinutes: 90, isIshaAngle: false },
  11: { id: 11, name: 'Majlis Ugama Islam Singapura (Singapore)', fajrAngle: 20, isMaghribAngle: false, ishaAngleOrMinutes: 18, isIshaAngle: true },
  12: { id: 12, name: 'Union des Organisations Islamiques de France', fajrAngle: 12, isMaghribAngle: false, ishaAngleOrMinutes: 12, isIshaAngle: true },
  13: { id: 13, name: 'Diyanet İşleri Başkanlığı, Turkey', fajrAngle: 18, isMaghribAngle: false, ishaAngleOrMinutes: 17, isIshaAngle: true },
  14: { id: 14, name: 'Spiritual Administration of Muslims of Russia', fajrAngle: 16, isMaghribAngle: false, ishaAngleOrMinutes: 15, isIshaAngle: true },
};

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180.0;
}

function radToDeg(rad: number): number {
  return (rad * 180.0) / Math.PI;
}

function fixAngle(a: number): number {
  a = a - 360.0 * Math.floor(a / 360.0);
  return a < 0 ? a + 360.0 : a;
}

function fixHour(h: number): number {
  h = h - 24.0 * Math.floor(h / 24.0);
  return h < 0 ? h + 24.0 : h;
}

function julianDay(year: number, month: number, day: number): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

// Compute sun declination and equation of time
function sunPosition(jd: number): { declination: number; equationOfTime: number } {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * Math.sin(degToRad(g)) + 0.02 * Math.sin(degToRad(2 * g)));
  const e = 23.439 - 0.00000036 * D;
  const d = radToDeg(Math.asin(Math.sin(degToRad(e)) * Math.sin(degToRad(L))));
  let RA = radToDeg(Math.atan2(Math.cos(degToRad(e)) * Math.sin(degToRad(L)), Math.cos(degToRad(L)))) / 15;
  RA = fixHour(RA);
  const EqT = q / 15 - RA;
  return { declination: d, equationOfTime: EqT };
}

// Compute sun time for a given angle below horizon
function computeSunAngleTime(angle: number, declination: number, lat: number, isMorning: boolean): number {
  const cosH = (Math.sin(degToRad(-angle)) - Math.sin(degToRad(lat)) * Math.sin(degToRad(declination))) /
    (Math.cos(degToRad(lat)) * Math.cos(degToRad(declination)));
  if (cosH > 1) return isMorning ? 0 : 24; // Sun never reaches angle
  if (cosH < -1) return isMorning ? 12 : 12; // Midnight sun
  const H = radToDeg(Math.acos(cosH)) / 15;
  return isMorning ? -H : H;
}

// Compute Asr shadow time
function computeAsrTime(shadowMultiplier: number, declination: number, lat: number): number {
  const d = Math.abs(lat - declination);
  const alt = radToDeg(Math.atan(1 / (shadowMultiplier + Math.tan(degToRad(d)))));
  const cosH = (Math.sin(degToRad(alt)) - Math.sin(degToRad(lat)) * Math.sin(degToRad(declination))) /
    (Math.cos(degToRad(lat)) * Math.cos(degToRad(declination)));
  if (cosH > 1 || cosH < -1) return 12;
  return radToDeg(Math.acos(cosH)) / 15;
}

function formatHoursToTimeString(decimalHours: number): string {
  const fixed = fixHour(decimalHours);
  const hours = Math.floor(fixed);
  const minutes = Math.floor((fixed - hours) * 60 + 0.5);
  const correctedHours = (hours + Math.floor(minutes / 60)) % 24;
  const correctedMinutes = minutes % 60;
  return `${correctedHours.toString().padStart(2, '0')}:${correctedMinutes.toString().padStart(2, '0')}`;
}

export function calculateLocalPrayerTimes(
  date: Date,
  latitude: number,
  longitude: number,
  timezoneOffsetHours: number,
  methodId: number = 3,
  asrSchool: AsrSchool = 'standard',
  highLatitudeRule: HighLatitudeRule = 'angle_based'
): PrayerTimesRecord {
  const method = CALCULATION_METHODS[methodId] || CALCULATION_METHODS[3];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const jd = julianDay(year, month, day);
  const { declination, equationOfTime } = sunPosition(jd);

  // Solar noon in local time
  const solarNoon = fixHour(12 - equationOfTime + timezoneOffsetHours - longitude / 15);

  // Sunrise and Sunset (approx 0.833 degrees for solar disc + refraction)
  const sunRadiusRefractionAngle = 0.833;
  const sunriseOffset = computeSunAngleTime(sunRadiusRefractionAngle, declination, latitude, true);
  const sunsetOffset = computeSunAngleTime(sunRadiusRefractionAngle, declination, latitude, false);

  const sunrise = solarNoon + sunriseOffset;
  const sunset = solarNoon + sunsetOffset;

  // Fajr
  let fajrOffset = computeSunAngleTime(method.fajrAngle, declination, latitude, true);
  // High-latitude adjustment for Fajr if needed
  if (Math.abs(latitude) > 48) {
    const nightPortion = highLatitudeRule === 'one_seventh' ? (1 / 7) : (1 / 2);
    const nightLength = sunrise - (sunset - 24);
    const maxFajrOffset = -nightLength * nightPortion;
    if (fajrOffset < maxFajrOffset) {
      fajrOffset = maxFajrOffset;
    }
  }
  const fajr = solarNoon + fajrOffset;

  // Dhuhr (Solar noon + 2 min safety buffer)
  const dhuhr = solarNoon + (2 / 60);

  // Asr
  const shadowMultiplier = asrSchool === 'hanafi' ? 2 : 1;
  const asrOffset = computeAsrTime(shadowMultiplier, declination, latitude);
  const asr = solarNoon + asrOffset;

  // Maghrib
  let maghrib: number;
  if (method.isMaghribAngle && method.maghribAngleOrMinutes) {
    maghrib = solarNoon + computeSunAngleTime(method.maghribAngleOrMinutes, declination, latitude, false);
  } else {
    // 3 minutes after sunset safety buffer
    maghrib = sunset + (3 / 60);
  }

  // Isha
  let isha: number;
  if (!method.isIshaAngle) {
    // Fixed minutes after Maghrib (e.g. Makkah is 90 mins)
    isha = maghrib + (method.ishaAngleOrMinutes / 60);
  } else {
    let ishaOffset = computeSunAngleTime(method.ishaAngleOrMinutes, declination, latitude, false);
    if (Math.abs(latitude) > 48) {
      const nightPortion = highLatitudeRule === 'one_seventh' ? (1 / 7) : (1 / 2);
      const nightLength = (sunrise + 24) - sunset;
      const maxIshaOffset = nightLength * nightPortion;
      if (ishaOffset > maxIshaOffset) {
        ishaOffset = maxIshaOffset;
      }
    }
    isha = solarNoon + ishaOffset;
  }

  // Imsak (10 minutes before Fajr)
  const imsak = fajr - (10 / 60);

  // Midnight (halfway between sunset and next sunrise)
  const nextSunrise = sunrise + 24;
  const midnight = sunset + (nextSunrise - sunset) / 2;

  return {
    Fajr: formatHoursToTimeString(fajr),
    Sunrise: formatHoursToTimeString(sunrise),
    Dhuhr: formatHoursToTimeString(dhuhr),
    Asr: formatHoursToTimeString(asr),
    Sunset: formatHoursToTimeString(sunset),
    Maghrib: formatHoursToTimeString(maghrib),
    Isha: formatHoursToTimeString(isha),
    Imsak: formatHoursToTimeString(imsak),
    Midnight: formatHoursToTimeString(midnight),
  };
}
