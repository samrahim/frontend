import i18next from "../i18n/i18n";

export interface Juz {
  number: number;
  name: string;
  name_ar: string;
  startsAt: string;
  endsAt: string;
}

export const juzs: Juz[] = [
  {
    number: 1,
    name: "Alif Lam Meem",
    name_ar: "الف لام ميم",
    startsAt: "1. Al-Fatiha Verse 1",
    endsAt: "2. Al-Baqarah Verse 141",
  },
  {
    number: 2,
    name: "Sayaqool",
    name_ar: "سيقول",
    startsAt: "2. Al-Baqarah Verse 142",
    endsAt: "2. Al-Baqarah Verse 252",
  },
  {
    number: 3,
    name: "Tilkal Rusul",
    name_ar: "تلك الرسل",
    startsAt: "2. Al-Baqarah Verse 253",
    endsAt: "3. Al-Imran Verse 92",
  },
  {
    number: 4,
    name: "Lan Tana Loo",
    name_ar: "لن تنالوا",
    startsAt: "3. Al-Imran Verse 93",
    endsAt: "4. An-Nisa Verse 23",
  },
  {
    number: 5,
    name: "Wal Mohsanat",
    name_ar: "والمحصنات",
    startsAt: "4. An-Nisa Verse 24",
    endsAt: "4. An-Nisa Verse 147",
  },
  {
    number: 6,
    name: "La Yuhibbullah",
    name_ar: "لا يحب الله",
    startsAt: "4. An-Nisa Verse 148",
    endsAt: "5. Al-Ma'idah Verse 81",
  },
  {
    number: 7,
    name: "Wa Iza Samiu",
    name_ar: "وإذا سمعوا",
    startsAt: "5. Al-Ma'idah Verse 82",
    endsAt: "6. Al-An'am Verse 110",
  },
  {
    number: 8,
    name: "Wa Lau Annana",
    name_ar: "ولو أننا",
    startsAt: "6. Al-An'am Verse 111",
    endsAt: "7. Al-A'raf Verse 87",
  },
  {
    number: 9,
    name: "Qalal Malao",
    name_ar: "قال الملأ",
    startsAt: "7. Al-A'raf Verse 88",
    endsAt: "8. Al-Anfal Verse 40",
  },
  {
    number: 10,
    name: "Wa A'lamu",
    name_ar: "واعلموا",
    startsAt: "8. Al-Anfal Verse 41",
    endsAt: "9. At-Tawbah Verse 92",
  },
  {
    number: 11,
    name: "Yatazeroon",
    name_ar: "يتاذرون",
    startsAt: "9. At-Tawbah Verse 93",
    endsAt: "11. Hud Verse 5",
  },
  {
    number: 12,
    name: "Wa Mamin Da'abat",
    name_ar: "وما من دابة",
    startsAt: "11. Hud Verse 6",
    endsAt: "12. Yusuf Verse 52",
  },
  {
    number: 13,
    name: "Wa Ma Ubrioo",
    name_ar: "وما أبريء",
    startsAt: "12. Yusuf Verse 53",
    endsAt: "14. Ibrahim Verse 52",
  },
  {
    number: 14,
    name: "Rubama",
    name_ar: "ربما",
    startsAt: "15. Al-Hijr Verse 1",
    endsAt: "16. An-Nahl Verse 128",
  },
  {
    number: 15,
    name: "Subhanallazi",
    name_ar: "سبحان الذي",
    startsAt: "17. Al-Isra Verse 1",
    endsAt: "18. Al-Kahf Verse 74",
  },
  {
    number: 16,
    name: "Qal Alam",
    name_ar: "قال ألم",
    startsAt: "18. Al-Kahf Verse 75",
    endsAt: "20. Ta-Ha Verse 135",
  },
  {
    number: 17,
    name: "Aqtarabo",
    name_ar: "اقترب",
    startsAt: "21. Al-Anbiyaa Verse 1",
    endsAt: "22. Al-Hajj Verse 78",
  },
  {
    number: 18,
    name: "Qadd Alaha",
    name_ar: "قد أفلح",
    startsAt: "23. Al-Muminun Verse 1",
    endsAt: "25. Al-Furqan Verse 20",
  },
  {
    number: 19,
    name: "Wa Qalallazina",
    name_ar: "وقال الذين",
    startsAt: "25. Al-Furqan Verse 21",
    endsAt: "27. An-Naml Verse 55",
  },
  {
    number: 20,
    name: "A'man Khalaq",
    name_ar: "آمن خلق",
    startsAt: "27. An-Naml Verse 56",
    endsAt: "29. Al-Ankabut Verse 45",
  },
  {
    number: 21,
    name: "Utlu Ma Oohi",
    name_ar: "اتل ما أوحي",
    startsAt: "29. Al-Ankabut Verse 46",
    endsAt: "33. Al-Ahzab Verse 30",
  },
  {
    number: 22,
    name: "Wa Manyaqnut",
    name_ar: "ومن يقنت",
    startsAt: "33. Al-Ahzab Verse 31",
    endsAt: "36. Ya-Sin Verse 27",
  },
  {
    number: 23,
    name: "Wa Mali",
    name_ar: "وما لي",
    startsAt: "36. Ya-Sin Verse 28",
    endsAt: "39. Az-Zumar Verse 31",
  },
  {
    number: 24,
    name: "Faman Azlam",
    name_ar: "فمن أظلم",
    startsAt: "39. Az-Zumar Verse 32",
    endsAt: "41. Fussilat Verse 46",
  },
  {
    number: 25,
    name: "Elahe Yuruddo",
    name_ar: "إليه يرد",
    startsAt: "41. Fussilat Verse 47",
    endsAt: "45. Al-Jathiyah Verse 37",
  },
  {
    number: 26,
    name: "Ha'a Meem",
    name_ar: "حم",
    startsAt: "46. Al-Ahqaf Verse 1",
    endsAt: "51. Ad-Dhariyat Verse 30",
  },
  {
    number: 27,
    name: "Qala Fama Khatbukum",
    name_ar: "قال فما خطبكم",
    startsAt: "51. Ad-Dhariyat Verse 31",
    endsAt: "57. Al-Hadid Verse 29",
  },
  {
    number: 28,
    name: "Qadd Samia Allah",
    name_ar: "قد سمع الله",
    startsAt: "58. Al-Mujadilah Verse 1",
    endsAt: "66. At-Tahrim Verse 12",
  },
  {
    number: 29,
    name: "Tabarakallazi",
    name_ar: "تبارك الذي",
    startsAt: "67. Al-Mulk Verse 1",
    endsAt: "77. Al-Mursalat Verse 50",
  },
  {
    number: 30,
    name: "Amma Yatasa'aloon",
    name_ar: "عم يتساءلون",
    startsAt: "78. An-Naba Verse 1",
    endsAt: "114. An-Nas Verse 6",
  },
];

export function getJuzName(juzNumber: number | string): string {
  // Find the matching juz matching the incoming number safely
  const juz = juzs.find((j) => j.number === Number(juzNumber));

  if (!juz) return "";

  // Check if i18next's current resolved language is Arabic
  const isArabic = i18next.language?.startsWith("ar");

  return isArabic ? juz.name_ar : juz.name;
}
