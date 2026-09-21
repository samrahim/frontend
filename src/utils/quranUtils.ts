export interface Verse {
  number: number;
  text: {
    ar: string;
    en: string;
    fr?: string;
  };
}

export interface VerseRangeResult {
  surah: {
    number: number;
    name: string;
  };
  from_verse: number;
  to_verse: number;
  total: number;
  verses: Verse[];
}
const surahLoaders = import.meta.glob("../data/surah_*.json");
const loadFrench = () => import("../data/quran_fr.json");

export const getVerseRange = async (
  surahId: number | string,
  fromVerse: number | string,
  toVerse: number | string,
  lang: string = "ar"
): Promise<VerseRangeResult> => {
  const surahNum = Number(surahId);
  const fromNum = Number(fromVerse);
  const toNum = Number(toVerse);

  if (!surahNum || !fromNum || !toNum) {
    throw new Error("جميع الحقول مطلوبة");
  }

  // 1. Surah data
  const loader = surahLoaders[`../data/surah_${surahNum}.json`];
  if (!loader) {
    throw new Error("السورة غير موجودة");
  }
  const surahData: any = ((await loader()) as { default: unknown }).default;

  // 2. French translation (only when needed)
  let quranFrData: Record<string, Record<string, string>> | null = null;
  if (lang.startsWith("fr")) {
    try {
      quranFrData = (await loadFrench()).default as Record<
        string,
        Record<string, string>
      >;
    } catch (err) {
      console.error("فشل في تحميل ملف quran_fr.json", err);
    }
  }

  // 3. Filter verses (unchanged)
  const filteredVerses = surahData.verses
    .filter((v: any) => v.number >= fromNum && v.number <= toNum)
    .map((v: any) => ({
      ...v,
      text: { ...v.text, fr: quranFrData?.[surahNum]?.[v.number] || "" },
    }));

  return {
    surah: { number: surahData.number, name: surahData.name },
    from_verse: fromNum,
    to_verse: toNum,
    total: filteredVerses.length,
    verses: filteredVerses,
  };
};
