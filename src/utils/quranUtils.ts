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

  // 1. جلب بيانات السورة الأساسية (تتضمن العربية والإنجليزية)
  const surahResponse = await fetch(`/surah_${surahNum}.json`);
  if (!surahResponse.ok) {
    throw new Error("السورة غير موجودة");
  }
  const surahData = await surahResponse.json();

  let quranFrData: Record<string, Record<string, string>> | null = null;

  // 2. إذا كانت اللغة فرنسية، نقوم بجلب ملف quran_fr.json
  if (lang.startsWith("fr")) {
    try {
      const frResponse = await fetch("/quran_fr.json");
      if (frResponse.ok) {
        quranFrData = await frResponse.json();
      }
    } catch (err) {
      console.error("فشل في تحميل ملف quran_fr.json", err);
    }
  }

  // 3. تصفية الآيات حسب النطاق وإرفاق النص الفرنسي عند الحاجة
  const filteredVerses = surahData.verses
    .filter((v: any) => v.number >= fromNum && v.number <= toNum)
    .map((v: any) => {
      const frenchText = quranFrData?.[surahNum]?.[v.number] || "";
      return {
        ...v,
        text: {
          ...v.text,
          fr: frenchText,
        },
      };
    });

  return {
    surah: {
      number: surahData.number,
      name: surahData.name,
    },
    from_verse: fromNum,
    to_verse: toNum,
    total: filteredVerses.length,
    verses: filteredVerses,
  };
};
