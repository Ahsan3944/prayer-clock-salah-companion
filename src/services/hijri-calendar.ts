import { HistoricalEvent, SupportedLanguage } from '../types';

export interface HijriDateInfo {
  day: number;
  month: number;
  year: number;
  monthNameEn: string;
  monthNameAr: string;
  monthNameLocalized: string;
  designation: string;
}

export const HIJRI_MONTH_NAMES: Record<number, Record<SupportedLanguage, string>> = {
  1: { en: 'Muharram', bn: 'মুহররম', hi: 'मुहर्रम', ur: 'محرم', ar: 'مُحَرَّم' },
  2: { en: 'Safar', bn: 'সফর', hi: 'सफ़र', ur: 'صفر', ar: 'صَفَر' },
  3: { en: "Rabi' al-Awwal", bn: 'রবিউল আউয়াল', hi: 'रबी अल-अव्वल', ur: 'ربیع الاول', ar: 'رَبِيع الأَوَّل' },
  4: { en: "Rabi' al-Thani", bn: 'রবিউস সানি', hi: 'रबी अल-थानी', ur: 'ربیع الثانی', ar: 'رَبِيع الآخِر' },
  5: { en: 'Jumada al-Awwal', bn: 'জমাদিউল আউয়াল', hi: 'जुमादा अल-अव्वल', ur: 'جمادی الاول', ar: 'جُمَادَى الأُولَى' },
  6: { en: 'Jumada al-Thani', bn: 'জমাদিউস সানি', hi: 'जुमादा अल-थानी', ur: 'جمادی الثانی', ar: 'جُمَادَى الآخِرَة' },
  7: { en: 'Rajab', bn: 'রজব', hi: 'रजब', ur: 'رجب', ar: 'رَجَب' },
  8: { en: "Sha'ban", bn: 'শাবান', hi: 'शाबान', ur: 'شعبان', ar: 'شَعْبَان' },
  9: { en: 'Ramadan', bn: 'রমজান', hi: 'रमज़ान', ur: 'رمضان', ar: 'رَمَضَان' },
  10: { en: 'Shawwal', bn: 'শাওয়াল', hi: 'शव्वाल', ur: 'شوال', ar: 'شَوَّال' },
  11: { en: "Dhu al-Qi'dah", bn: 'জিলকদ', hi: 'ज़ु अल-क़ादा', ur: 'ذی القعدہ', ar: 'ذُو القَعْدَة' },
  12: { en: 'Dhu al-Hijjah', bn: 'জিলহজ্জ', hi: 'ज़ु अल-हज्जा', ur: 'ذی الحجہ', ar: 'ذُو الحِجَّة' },
};

export function gregorianToHijri(gregorianDate: Date, offsetDays: number = 0, lang: SupportedLanguage = 'en'): HijriDateInfo {
  // Apply moon-sighting adjustment offset
  const adjustedDate = new Date(gregorianDate.getTime() + offsetDays * 86400000);
  
  const y = adjustedDate.getFullYear();
  const m = adjustedDate.getMonth() + 1;
  const d = adjustedDate.getDate();

  // Umm al-Qura standard arithmetic algorithm
  let jd: number;
  if (m <= 2) {
    const y2 = y - 1;
    const m2 = m + 12;
    const a = Math.floor(y2 / 100);
    const b = 2 - a + Math.floor(a / 4);
    jd = Math.floor(365.25 * (y2 + 4716)) + Math.floor(30.6001 * (m2 + 1)) + d + b - 1524.5;
  } else {
    const a = Math.floor(y / 100);
    const b = 2 - a + Math.floor(a / 4);
    jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
  }

  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = (Math.floor((10985 - l2) / 5316)) * (Math.floor((50 * l2) / 17719)) + (Math.floor(l2 / 5670)) * (Math.floor((43 * l2) / 15238));
  const l3 = l2 - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  const hijriMonth = Math.floor((24 * l3) / 709);
  const hijriDay = l3 - Math.floor((709 * hijriMonth) / 24);
  const hijriYear = 30 * n + j - 30;

  const monthNames = HIJRI_MONTH_NAMES[hijriMonth] || HIJRI_MONTH_NAMES[1];

  return {
    day: hijriDay,
    month: hijriMonth,
    year: hijriYear,
    monthNameEn: monthNames.en,
    monthNameAr: monthNames.ar,
    monthNameLocalized: monthNames[lang] || monthNames.en,
    designation: 'AH',
  };
}

export const VERIFIED_HISTORICAL_EVENTS: HistoricalEvent[] = [
  {
    id: 'islamic_new_year',
    hijriMonth: 1,
    hijriDay: 1,
    title: {
      en: 'Islamic New Year (Hijri 1st Muharram)',
      bn: 'হিজরি নববর্ষ (১লা মুহররম)',
      hi: 'इस्लामी नया साल (१ मुहर्रम)',
      ur: 'اسلامی نیا سال (یکم محرم)',
      ar: 'رأس السنة الهجرية (الأول من محرم)',
    },
    description: {
      en: 'Marks the beginning of the Islamic lunar calendar year, commemorating the historic migration (Hijrah) of the Prophet Muhammad (ﷺ) from Mecca to Medina.',
      bn: 'হিজরি সনের প্রথম দিন, যা নবী মুহাম্মদ (সা.)-এর মক্কা থেকে মদিনায় ঐতিহাসিক হিজরতকে স্মরণ করিয়ে দেয়।',
      hi: 'इस्लामी चंद्र कैलेंडर का पहला दिन, जो पैगंबर मुहम्मद (स.) की मक्का से मदीना हिजरत की याद दिलाता है।',
      ur: 'اسلامی سال کا پہلا دن جو نبی کریم ﷺ کی مکہ سے مدینہ ہجرت کی یاد تازہ کرتا ہے۔',
      ar: 'بداية السنة الهجرية القمرية تخليداً للهجرة النبوية المباركة من مكة المكرمة إلى المدينة المنورة.',
    },
    sourceReferences: ['Tarikh at-Tabari, Vol. 2', 'Al-Bidayah wan-Nihayah, Ibn Kathir'],
    confidence: 'Confirmed',
    historicalYearHijri: 1,
    historicalYearGregorian: 622,
  },
  {
    id: 'day_of_ashura',
    hijriMonth: 1,
    hijriDay: 10,
    title: {
      en: 'Day of Ashura (10th Muharram)',
      bn: 'আশুরা দিবস (১০ই মুহররম)',
      hi: 'आशूरा का दिन (१० मुहर्रम)',
      ur: 'یوم عاشوراء (۱۰ محرم)',
      ar: 'يوم عاشوراء (العاشر من محرم)',
    },
    description: {
      en: 'The day Allah saved Prophet Musa (Moses) and the Children of Israel from Pharaoh. Recommended day of voluntary fasting (along with the 9th or 11th).',
      bn: 'যে দিন আল্লাহ তাআলা মূসা (আ.) ও বনী ইসরাঈলকে ফেরাউনের কবল থেকে রক্ষা করেছিলেন। এই দিনে রোজা রাখা অত্যন্ত ফজিলতপূর্ণ সুন্নত।',
      hi: 'वह दिन जब अल्लाह ने हज़रत मूसा (अ.) और बनी इसराईल को फिरौन से नजात दी। इस दिन रोज़ा रखना सुन्नत है।',
      ur: 'وہ مبارک دن جب اللہ تعالیٰ نے حضرت موسیٰ علیہ السلام اور بنی اسرائیل کو فرعون سے نجات عطا فرمائی۔ اس دن کا روزہ سنت ہے۔',
      ar: 'اليوم الذي نجى الله فيه نبيه موسى عليه السلام وبني إسرائيل من فرعون وجنوده، وصيامه سنة مؤكدة تكفر سنة ماضية.',
    },
    sourceReferences: ['Sahih al-Bukhari (Book 30, Hadith 116)', 'Sahih Muslim (Hadith 1130)'],
    confidence: 'Confirmed',
  },
  {
    id: 'battle_of_badr',
    hijriMonth: 9,
    hijriDay: 17,
    title: {
      en: 'The Battle of Badr (Ghazwat Badr)',
      bn: 'ঐতিহাসিক বদর যুদ্ধ (১৭ই রমজান)',
      hi: 'जंगे बद्र (१७ रमज़ान)',
      ur: 'غزوہ بدر (۱۷ رمضان)',
      ar: 'غزوة بدر الكبرى (١٧ رمضان)',
    },
    description: {
      en: 'The decisive first major military confrontation between the Muslims of Medina and the Quraysh of Mecca, resulting in a momentous victory for truth (Yawm al-Furqan).',
      bn: 'ইসলামের ইতিহাসের প্রথম চূড়ান্ত সামরিক বিজয়, যেখানে মুসলিমরা মক্কার কুরাইশদের বিরুদ্ধে বিজয় অর্জন করেন। পবিত্র কোরআনে একে "ইয়াওমুল ফুরকান" বলা হয়েছে।',
      hi: 'इस्लाम का पहला निर्णायक युद्ध जिसमें मुसलमानों को मक्का के मुशरिकीन पर ऐतिहासिक फतह हासिल हुई। इसे कुरआन में यौम अल-फुरकान कहा गया है।',
      ur: 'اسلام اور کفر کے درمیان پہلا فیصلہ کن معرکہ جس میں مسلمانوں کو فتح مبین نصیب ہوئی۔ قرآن مجید میں اسے یوم الفرقان کہا گیا ہے۔',
      ar: 'أول معركة فاصلة في تاريخ الإسلام بين المسلمين وقريش، ونصر الله فيها المؤمنين، وسماها القرآن الكريم يوم الفرقان.',
    },
    sourceReferences: ['Surah Al-Anfal (8:41)', 'Sahih al-Bukhari (Book 64, Hadith 1)'],
    confidence: 'Confirmed',
    historicalYearHijri: 2,
    historicalYearGregorian: 624,
  },
  {
    id: 'conquest_of_makkah',
    hijriMonth: 9,
    hijriDay: 20,
    title: {
      en: 'The Conquest of Mecca (Fath Makkah)',
      bn: 'মক্কা বিজয় (২০শে রমজান)',
      hi: 'फतह मक्का (२० रमज़ान)',
      ur: 'فتح مکہ (۲۰ رمضان)',
      ar: 'فتح مكة المكرمة (٢٠ رمضان)',
    },
    description: {
      en: 'Prophet Muhammad (ﷺ) and 10,000 companions entered Mecca peacefully, cleansed the Kaaba of idols, and declared general amnesty for the people of Mecca.',
      bn: 'রাসূলুল্লাহ (সা.) শান্তিপূর্ণভাবে মক্কায় প্রবেশ করেন, কাবা শরীফকে মূর্তিমুক্ত করেন এবং মক্কাবাসীর জন্য ঐতিহাসিক সাধারণ ক্ষমা ঘোষণা করেন।',
      hi: 'हज़रत मुहम्मद (स.) ने अमन और सलामती के साथ मक्का में दाखिला लिया, काबे को बुतों से पाक किया और आम माफी का ऐलान किया।',
      ur: 'رسول اکرم ﷺ نے دس ہزار صحابہ کے ساتھ مکہ مکرمہ فتح کیا، کعبۃ اللہ کو بتوں سے پاک کیا اور عام معافی کا اعلان فرمایا۔',
      ar: 'دخول النبي ﷺ مكة المكرمة فاتحاً سلماً، وتطهير الكعبة المشرفة من الأصنام، وإعلان العفو العام عن أهل مكة.',
    },
    sourceReferences: ['Surah An-Nasr (110:1-3)', 'Sahih al-Bukhari (Hadith 4288)'],
    confidence: 'Confirmed',
    historicalYearHijri: 8,
    historicalYearGregorian: 630,
  },
  {
    id: 'laylat_al_qadr',
    hijriMonth: 9,
    hijriDay: 27,
    title: {
      en: 'Laylat al-Qadr (Night of Decree - 27th Ramadan)',
      bn: 'লাইলাতুল কদর (মহিমান্বিত রজনী - ২৭শে রমজান)',
      hi: 'शब-ए-क़द्र (२७ रमज़ान)',
      ur: 'شب قدر (۲۷ رمضان)',
      ar: 'ليلة القدر (٢٧ رمضان)',
    },
    description: {
      en: 'The blessed night in which the Noble Quran was first revealed, better than a thousand months. Observed especially in the odd nights of the last ten days of Ramadan.',
      bn: 'কোরআন নাযিলের বরকতময় রাত, যা হাজার মাসের চেয়েও শ্রেষ্ঠ। রমজানের শেষ দশকের বেজোড় রাতসমূহে এটি অনুসন্ধান করার নির্দেশ রয়েছে।',
      hi: 'वह बरकत वाली रात जिसमें कुरआन मजीद नाज़िल हुआ, जो हज़ार महीनों से बेहतर है। रमज़ान के आखिरी अशरे की ताक रातों में इसकी तलाश की जाती है।',
      ur: 'قرآن مجید کے نزول کی بابرکت رات جو ہزار مہینوں سے افضل ہے۔ رمضان کے آخری عشرے کی طاق راتوں میں اس کی فضیلت تلاش کی جاتی ہے۔',
      ar: 'الليلة المباركة التي أُنزل فيها القرآن الكريم، خير من ألف شهر، ويُتحرى التماسها في الليالي الوتر من العشر الأواخر من رمضان.',
    },
    sourceReferences: ['Surah Al-Qadr (97:1-5)', 'Sahih al-Bukhari (Hadith 2017)'],
    confidence: 'Approximate',
  },
  {
    id: 'eid_al_fitr',
    hijriMonth: 10,
    hijriDay: 1,
    title: {
      en: 'Eid al-Fitr (Festival of Fast-Breaking)',
      bn: 'ঈদুল ফিতর (পবিত্র ঈদুল ফিতর)',
      hi: 'ईद उल-फ़ित्र',
      ur: 'عید الفطر المبارک',
      ar: 'عيد الفطر المبارك',
    },
    description: {
      en: 'Celebration marking the conclusion of the holy month of fasting, Ramadan. Begins with the special Eid prayer and distribution of Zakat al-Fitr.',
      bn: 'রমজানের পবিত্র সিয়াম সাধনা শেষে মুসলিম উম্মাহর প্রধান আনন্দোৎসব। সদকাতুল ফিতর আদায় ও ঈদের বিশেষ জামাত এর মূল বৈশিষ্ট্য।',
      hi: 'रमज़ान के मुबारक महीने के रोज़ों के बाद का इस्लामी त्यौहार। ज़कात उल-फ़ित्र की अदायगी और ईद की नमाज़ इसकी खास बातें हैं।',
      ur: 'ماہ صیام کے اختتام پر شکرانے کا عظیم تہوار۔ صدقۃ الفطر کی ادائیگی اور عید کی نماز اس دن کا بنیادی فریضہ ہے۔',
      ar: 'يوم الجائزة والفرح بإتمام صيام شهر رمضان المبارك، وتؤدى فيه صلاة العيد وتُخرج زكاة الفطر طهرة للصائم وطعمة للمساكين.',
    },
    sourceReferences: ['Sahih al-Bukhari (Book 13, Hadith 98)', 'Sunan Abi Dawud (Hadith 1134)'],
    confidence: 'Confirmed',
  },
  {
    id: 'day_of_arafah',
    hijriMonth: 12,
    hijriDay: 9,
    title: {
      en: 'Day of Arafah (Yawm Arafah)',
      bn: 'আরাফাহ দিবস (৯ই জিলহজ্জ)',
      hi: 'यौम-ए-अराफ़ा (९ ज़ु अल-हज्जा)',
      ur: 'یوم عرفہ (۹ ذی الحجہ)',
      ar: 'يوم عرفة (التاسع من ذي الحجة)',
    },
    description: {
      en: 'The pinnacle of the Hajj pilgrimage where pilgrims stand on Mount Arafat. Fasting on this day for non-pilgrims expiates the sins of the previous and coming year.',
      bn: 'পবিত্র হজের মূল রুকন এবং বছরের শ্রেষ্ঠতম দিন। এ দিন রোজা রাখা অতীতের এক বছর এবং ভবিষ্যতের এক বছরের গুনাহ মাফের কারণ।',
      hi: 'हज का सबसे अहम दिन जब हाजी मैदान-ए-अराफ़ात में ठहरते हैं। गैर-हाजियों के लिए इस दिन का रोज़ा दो साल के गुनाहों की माफी का सबब है।',
      ur: 'حج کا عظیم ترین رکن جب حجاج میدان عرفات میں وقوف کرتے ہیں۔ غیر حجاج کے لیے اس دن کا روزہ گذشتہ اور آئندہ سال کے گناہوں کا کفارہ ہے۔',
      ar: 'أعظم أيام السنة وركن الحج الأكبر، وصيامه لغير الحاج يكفر ذنوب سنة ماضية وسنة باقية كما صح في الحديث النبوي.',
    },
    sourceReferences: ['Sahih Muslim (Book 6, Hadith 2603)', 'Sunan an-Nasa\'i (Hadith 3004)'],
    confidence: 'Confirmed',
  },
  {
    id: 'eid_al_adha',
    hijriMonth: 12,
    hijriDay: 10,
    title: {
      en: 'Eid al-Adha (Feast of the Sacrifice)',
      bn: 'ঈদুল আজহা (কোরবানির ঈদ)',
      hi: 'ईद उल-अज़हा (बक़रईद)',
      ur: 'عید الاضحیٰ المبارک',
      ar: 'عيد الأضحى المبارك',
    },
    description: {
      en: 'Commemorates the profound devotion of Prophet Ibrahim (Abraham) and Prophet Ismail (Ishmael), accompanied by the Eid prayer and sacrifice of livestock (Qurbani).',
      bn: 'হযরত ইব্রাহিম (আ.) ও ইসমাইল (আ.)-এর মহান আত্মত্যাগের স্মরণে উদযাপিত কোরবানির ঈদ। এ দিনে পশু কোরবানি ও তাকবীরে তাশরিক পাঠ করা হয়।',
      hi: 'हज़रत इब्राहीम (अ.) और हज़रत इस्माईल (अ.) की अज़ीम कुरबानी की याद में मनाया जाने वाला पर्व। इसमें नमाज़ और कुर्बानी की जाती है।',
      ur: 'حضرت ابراہیم علیہ السلام اور حضرت اسماعیل علیہ السلام کی عظیم اطاعت و قربانی کی یادگار۔ عید کی نماز اور قربانی کا اہتمام کیا جاتا ہے۔',
      ar: 'عيد النحر الأكبر تخليداً لطاعة واستسلام الخليل إبراهيم وإسماعيل عليهما السلام، وتشرع فيه الأضاحي وصلاة العيد والتكبير.',
    },
    sourceReferences: ['Surah As-Saffat (37:102-107)', 'Sahih al-Bukhari (Book 73, Hadith 1)'],
    confidence: 'Confirmed',
  },
];
