import { LocationProfile } from '../types';

export interface PresetCity {
  id: string;
  name: string;
  nameAr?: string;
  nameBn?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  recommendedMethodId: number;
}

export const PRESET_CITIES: PresetCity[] = [
  // Holy Sanctuaries
  { id: 'makkah', name: 'Makkah', nameAr: 'مكة المكرمة', nameBn: 'মক্কা', country: 'Saudi Arabia', latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh', recommendedMethodId: 4 },
  { id: 'madinah', name: 'Madinah', nameAr: 'المدينة المنورة', nameBn: 'মদিনা', country: 'Saudi Arabia', latitude: 24.4672, longitude: 39.6111, timezone: 'Asia/Riyadh', recommendedMethodId: 4 },
  { id: 'jerusalem', name: 'Jerusalem (Al-Quds)', nameAr: 'القدس الشريف', nameBn: 'জেরুজালেম', country: 'Palestine', latitude: 31.7683, longitude: 35.2137, timezone: 'Asia/Jerusalem', recommendedMethodId: 3 },
  { id: 'riyadh', name: 'Riyadh', nameAr: 'الرياض', nameBn: 'রিয়াদ', country: 'Saudi Arabia', latitude: 24.7136, longitude: 46.6753, timezone: 'Asia/Riyadh', recommendedMethodId: 4 },
  { id: 'jeddah', name: 'Jeddah', nameAr: 'جدة', nameBn: 'জেদ্দা', country: 'Saudi Arabia', latitude: 21.4858, longitude: 39.1925, timezone: 'Asia/Riyadh', recommendedMethodId: 4 },

  // South Asia - Bangladesh
  { id: 'dhaka', name: 'Dhaka', nameBn: 'ঢাকা', country: 'Bangladesh', latitude: 23.8103, longitude: 90.4125, timezone: 'Asia/Dhaka', recommendedMethodId: 1 },
  { id: 'chittagong', name: 'Chittagong', nameBn: 'চট্টগ্রাম', country: 'Bangladesh', latitude: 22.3569, longitude: 91.7832, timezone: 'Asia/Dhaka', recommendedMethodId: 1 },
  { id: 'sylhet', name: 'Sylhet', nameBn: 'সিলেট', country: 'Bangladesh', latitude: 24.8949, longitude: 91.8687, timezone: 'Asia/Dhaka', recommendedMethodId: 1 },
  { id: 'rajshahi', name: 'Rajshahi', nameBn: 'রাজশাহী', country: 'Bangladesh', latitude: 24.3745, longitude: 88.6042, timezone: 'Asia/Dhaka', recommendedMethodId: 1 },
  { id: 'khulna', name: 'Khulna', nameBn: 'খুলনা', country: 'Bangladesh', latitude: 22.8456, longitude: 89.5403, timezone: 'Asia/Dhaka', recommendedMethodId: 1 },
  { id: 'barisal', name: 'Barisal', nameBn: 'বরিশাল', country: 'Bangladesh', latitude: 22.7010, longitude: 90.3535, timezone: 'Asia/Dhaka', recommendedMethodId: 1 },

  // South Asia - Pakistan & India
  { id: 'karachi', name: 'Karachi', nameAr: 'كراتشي', country: 'Pakistan', latitude: 24.8607, longitude: 67.0011, timezone: 'Asia/Karachi', recommendedMethodId: 1 },
  { id: 'lahore', name: 'Lahore', nameAr: 'لاهور', country: 'Pakistan', latitude: 31.5204, longitude: 74.3587, timezone: 'Asia/Karachi', recommendedMethodId: 1 },
  { id: 'islamabad', name: 'Islamabad', country: 'Pakistan', latitude: 33.6844, longitude: 73.0479, timezone: 'Asia/Karachi', recommendedMethodId: 1 },
  { id: 'delhi', name: 'Delhi / New Delhi', nameBn: 'দিল্লি', country: 'India', latitude: 28.6139, longitude: 77.2090, timezone: 'Asia/Kolkata', recommendedMethodId: 1 },
  { id: 'mumbai', name: 'Mumbai', nameBn: 'মুম্বাই', country: 'India', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata', recommendedMethodId: 1 },
  { id: 'kolkata', name: 'Kolkata', nameBn: 'কলকাতা', country: 'India', latitude: 22.5726, longitude: 88.3639, timezone: 'Asia/Kolkata', recommendedMethodId: 1 },
  { id: 'hyderabad_in', name: 'Hyderabad', country: 'India', latitude: 17.3850, longitude: 78.4867, timezone: 'Asia/Kolkata', recommendedMethodId: 1 },
  { id: 'bengaluru', name: 'Bengaluru', country: 'India', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata', recommendedMethodId: 1 },

  // Middle East & North Africa
  { id: 'cairo', name: 'Cairo', nameAr: 'القاهرة', nameBn: 'কায়রো', country: 'Egypt', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo', recommendedMethodId: 5 },
  { id: 'alexandria', name: 'Alexandria', nameAr: 'الإسكندرية', country: 'Egypt', latitude: 31.2001, longitude: 29.9187, timezone: 'Africa/Cairo', recommendedMethodId: 5 },
  { id: 'dubai', name: 'Dubai', nameAr: 'دبي', nameBn: 'দুবাই', country: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai', recommendedMethodId: 8 },
  { id: 'abu_dhabi', name: 'Abu Dhabi', nameAr: 'أبو ظبي', country: 'United Arab Emirates', latitude: 24.4539, longitude: 54.3773, timezone: 'Asia/Dubai', recommendedMethodId: 8 },
  { id: 'doha', name: 'Doha', nameAr: 'الدوحة', country: 'Qatar', latitude: 25.2854, longitude: 51.5310, timezone: 'Asia/Qatar', recommendedMethodId: 10 },
  { id: 'kuwait_city', name: 'Kuwait City', nameAr: 'مدينة الكويت', country: 'Kuwait', latitude: 29.3759, longitude: 47.9774, timezone: 'Asia/Kuwait', recommendedMethodId: 9 },
  { id: 'muscat', name: 'Muscat', nameAr: 'مسقط', country: 'Oman', latitude: 23.5880, longitude: 58.3829, timezone: 'Asia/Muscat', recommendedMethodId: 8 },
  { id: 'manama', name: 'Manama', nameAr: 'المنامة', country: 'Bahrain', latitude: 26.2285, longitude: 50.5860, timezone: 'Asia/Bahrain', recommendedMethodId: 8 },
  { id: 'amman', name: 'Amman', nameAr: 'عمان', country: 'Jordan', latitude: 31.9454, longitude: 35.9284, timezone: 'Asia/Amman', recommendedMethodId: 3 },
  { id: 'beirut', name: 'Beirut', nameAr: 'بيروت', country: 'Lebanon', latitude: 33.8938, longitude: 35.5018, timezone: 'Asia/Beirut', recommendedMethodId: 3 },
  { id: 'damascus', name: 'Damascus', nameAr: 'دمشق', country: 'Syria', latitude: 33.5138, longitude: 36.2765, timezone: 'Asia/Damascus', recommendedMethodId: 3 },
  { id: 'baghdad', name: 'Baghdad', nameAr: 'بغداد', country: 'Iraq', latitude: 33.3152, longitude: 44.3661, timezone: 'Asia/Baghdad', recommendedMethodId: 3 },
  { id: 'casablanca', name: 'Casablanca', nameAr: 'الدار البيضاء', country: 'Morocco', latitude: 33.5731, longitude: -7.5898, timezone: 'Africa/Casablanca', recommendedMethodId: 3 },
  { id: 'rabat', name: 'Rabat', nameAr: 'الرباط', country: 'Morocco', latitude: 34.0209, longitude: -6.8416, timezone: 'Africa/Casablanca', recommendedMethodId: 3 },
  { id: 'algiers', name: 'Algiers', nameAr: 'الجزائر', country: 'Algeria', latitude: 36.7538, longitude: 3.0588, timezone: 'Africa/Algiers', recommendedMethodId: 3 },
  { id: 'tunis', name: 'Tunis', nameAr: 'تونس', country: 'Tunisia', latitude: 36.8065, longitude: 10.1815, timezone: 'Africa/Tunis', recommendedMethodId: 3 },
  { id: 'tripoli', name: 'Tripoli', nameAr: 'طرابلس', country: 'Libya', latitude: 32.8872, longitude: 13.1913, timezone: 'Africa/Tripoli', recommendedMethodId: 3 },

  // Southeast & East Asia
  { id: 'jakarta', name: 'Jakarta', nameBn: 'জাকার্তা', country: 'Indonesia', latitude: -6.2088, longitude: 106.8456, timezone: 'Asia/Jakarta', recommendedMethodId: 3 },
  { id: 'surabaya', name: 'Surabaya', country: 'Indonesia', latitude: -7.2575, longitude: 112.7521, timezone: 'Asia/Jakarta', recommendedMethodId: 3 },
  { id: 'bandung', name: 'Bandung', country: 'Indonesia', latitude: -6.9175, longitude: 107.6191, timezone: 'Asia/Jakarta', recommendedMethodId: 3 },
  { id: 'kuala_lumpur', name: 'Kuala Lumpur', nameBn: 'কুয়ালালামপুর', country: 'Malaysia', latitude: 3.1390, longitude: 101.6869, timezone: 'Asia/Kuala_Lumpur', recommendedMethodId: 3 },
  { id: 'penang', name: 'Penang', country: 'Malaysia', latitude: 5.4164, longitude: 100.3327, timezone: 'Asia/Kuala_Lumpur', recommendedMethodId: 3 },
  { id: 'singapore', name: 'Singapore', nameBn: 'সিঙ্গাপুর', country: 'Singapore', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore', recommendedMethodId: 11 },
  { id: 'bandar_seri_begawan', name: 'Bandar Seri Begawan', country: 'Brunei', latitude: 4.9031, longitude: 114.9398, timezone: 'Asia/Brunei', recommendedMethodId: 3 },
  { id: 'tokyo', name: 'Tokyo', nameBn: 'টোকিও', country: 'Japan', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo', recommendedMethodId: 3 },
  { id: 'seoul', name: 'Seoul', country: 'South Korea', latitude: 37.5665, longitude: 126.9780, timezone: 'Asia/Seoul', recommendedMethodId: 3 },
  { id: 'beijing', name: 'Beijing', country: 'China', latitude: 39.9042, longitude: 116.4074, timezone: 'Asia/Shanghai', recommendedMethodId: 3 },

  // Turkey & Central Asia
  { id: 'istanbul', name: 'Istanbul', nameAr: 'إسطنبول', nameBn: 'ইস্তাম্বুল', country: 'Turkey', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul', recommendedMethodId: 13 },
  { id: 'ankara', name: 'Ankara', country: 'Turkey', latitude: 39.9334, longitude: 32.8597, timezone: 'Europe/Istanbul', recommendedMethodId: 13 },
  { id: 'tashkent', name: 'Tashkent', country: 'Uzbekistan', latitude: 41.2995, longitude: 69.2401, timezone: 'Asia/Tashkent', recommendedMethodId: 1 },
  { id: 'samarkand', name: 'Samarkand', country: 'Uzbekistan', latitude: 39.6270, longitude: 66.9750, timezone: 'Asia/Tashkent', recommendedMethodId: 1 },
  { id: 'baku', name: 'Baku', country: 'Azerbaijan', latitude: 40.4093, longitude: 49.8671, timezone: 'Asia/Baku', recommendedMethodId: 3 },
  { id: 'almaty', name: 'Almaty', country: 'Kazakhstan', latitude: 43.2220, longitude: 76.8512, timezone: 'Asia/Almaty', recommendedMethodId: 1 },

  // Europe & UK
  { id: 'london', name: 'London', nameBn: 'লন্ডন', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London', recommendedMethodId: 3 },
  { id: 'birmingham', name: 'Birmingham', country: 'United Kingdom', latitude: 52.4862, longitude: -1.8904, timezone: 'Europe/London', recommendedMethodId: 3 },
  { id: 'manchester', name: 'Manchester', country: 'United Kingdom', latitude: 53.4808, longitude: -2.2426, timezone: 'Europe/London', recommendedMethodId: 3 },
  { id: 'paris', name: 'Paris', nameBn: 'প্যারিস', country: 'France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris', recommendedMethodId: 12 },
  { id: 'berlin', name: 'Berlin', country: 'Germany', latitude: 52.5200, longitude: 13.4050, timezone: 'Europe/Berlin', recommendedMethodId: 3 },
  { id: 'frankfurt', name: 'Frankfurt', country: 'Germany', latitude: 50.1109, longitude: 8.6821, timezone: 'Europe/Berlin', recommendedMethodId: 3 },
  { id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', latitude: 52.3676, longitude: 4.9041, timezone: 'Europe/Amsterdam', recommendedMethodId: 3 },
  { id: 'brussels', name: 'Brussels', country: 'Belgium', latitude: 50.8503, longitude: 4.3517, timezone: 'Europe/Brussels', recommendedMethodId: 3 },
  { id: 'madrid', name: 'Madrid', country: 'Spain', latitude: 40.4168, longitude: -3.7038, timezone: 'Europe/Madrid', recommendedMethodId: 3 },
  { id: 'rome', name: 'Rome', country: 'Italy', latitude: 41.9028, longitude: 12.4964, timezone: 'Europe/Rome', recommendedMethodId: 3 },
  { id: 'moscow', name: 'Moscow', country: 'Russia', latitude: 55.7558, longitude: 37.6173, timezone: 'Europe/Moscow', recommendedMethodId: 14 },

  // Americas
  { id: 'new_york', name: 'New York', nameBn: 'নিউইয়র্ক', country: 'United States', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York', recommendedMethodId: 2 },
  { id: 'chicago', name: 'Chicago', country: 'United States', latitude: 41.8781, longitude: -87.6298, timezone: 'America/Chicago', recommendedMethodId: 2 },
  { id: 'los_angeles', name: 'Los Angeles', country: 'United States', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles', recommendedMethodId: 2 },
  { id: 'houston', name: 'Houston', country: 'United States', latitude: 29.7604, longitude: -95.3698, timezone: 'America/Chicago', recommendedMethodId: 2 },
  { id: 'toronto', name: 'Toronto', nameBn: 'টরন্টো', country: 'Canada', latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto', recommendedMethodId: 2 },
  { id: 'montreal', name: 'Montreal', country: 'Canada', latitude: 45.5017, longitude: -73.5673, timezone: 'America/Toronto', recommendedMethodId: 2 },

  // Oceania & Africa
  { id: 'sydney', name: 'Sydney', nameBn: 'সিডনি', country: 'Australia', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney', recommendedMethodId: 3 },
  { id: 'melbourne', name: 'Melbourne', country: 'Australia', latitude: -37.8136, longitude: 144.9631, timezone: 'Australia/Melbourne', recommendedMethodId: 3 },
  { id: 'auckland', name: 'Auckland', country: 'New Zealand', latitude: -36.8485, longitude: 174.7633, timezone: 'Pacific/Auckland', recommendedMethodId: 3 },
  { id: 'johannesburg', name: 'Johannesburg', country: 'South Africa', latitude: -26.2041, longitude: 28.0473, timezone: 'Africa/Johannesburg', recommendedMethodId: 3 },
  { id: 'cape_town', name: 'Cape Town', country: 'South Africa', latitude: -33.9249, longitude: 18.4241, timezone: 'Africa/Johannesburg', recommendedMethodId: 3 },
  { id: 'nairobi', name: 'Nairobi', country: 'Kenya', latitude: -1.2921, longitude: 36.8219, timezone: 'Africa/Nairobi', recommendedMethodId: 3 },
];

export function presetCityToLocationProfile(city: PresetCity): LocationProfile {
  return {
    id: city.id,
    name: city.name,
    country: city.country,
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone,
    isAutomatic: false,
    lastUpdated: Date.now(),
  };
}
