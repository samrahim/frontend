import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getVerseRange, VerseRangeResult } from "../utils/quranUtils";

interface UseVerseRangeReturn {
  data: VerseRangeResult | null;
  loading: boolean;
  error: string | null;
}

export const useVerseRange = (
  surahId: number | string | null | undefined,
  fromVerse: number | string | null | undefined,
  toVerse: number | string | null | undefined
): UseVerseRangeReturn => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "ar";

  const [data, setData] = useState<VerseRangeResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!surahId || !fromVerse || !toVerse) {
      setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getVerseRange(surahId, fromVerse, toVerse, currentLang)
      .then((result) => {
        if (isMounted) setData(result);
      })
      .catch((err: Error) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [surahId, fromVerse, toVerse, currentLang]);

  return { data, loading, error };
};
