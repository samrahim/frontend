import { Flex, Text } from "theme-ui";
import { Verse } from "../utils/quranUtils";
import React from "react";
import { useTranslation } from "react-i18next";

interface QuranViewerProps {
  verses: Verse[];
}

export const QuranViewer = React.memo(function QuranViewer({
  verses,
}: QuranViewerProps) {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || "ar").substring(0, 2);
  const isArabic = currentLang === "ar";

  const toArabicNumber = (num: number) =>
    num.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

  function VerseMarker({ number }: { number: number }) {
    return (
      <svg
        width="28"
        height="28"
        viewBox="0 0 100 100"
        style={{ verticalAlign: "middle" }}
      >
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="white"
          stroke="currentColor"
          strokeWidth="3"
        />
        <text
          x="50"
          y="57"
          textAnchor="middle"
          fontSize="34"
          fontFamily="'Amiri Quran', serif"
        >
          {toArabicNumber(number)}
        </text>
      </svg>
    );
  }

  const getVerseText = (verse: Verse) => {
    if (isArabic) return verse.text.ar;
    if (currentLang === "fr") return verse.text.fr || verse.text.en;
    return verse.text.en;
  };

  return (
    <>
      {isArabic && (
        <Flex sx={{ justifyContent: "center", mb: 3 }}>
          <Text
            sx={{
              textAlign: "center",
              direction: "rtl",
              fontSize: [4, 5],
              fontFamily: "'Amiri Quran', 'Amiri', serif",
            }}
          >
            بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
          </Text>
        </Flex>
      )}

      <Text
        sx={{
          direction: isArabic ? "rtl" : "ltr",
          textAlign: isArabic ? "justify" : "left",
          lineHeight: [2, 2.5],
          fontSize: [3, 4],
          fontFamily: isArabic ? "'Amiri Quran', 'Amiri', serif" : "body",
        }}
      >
        {verses.map((verse) => (
          <React.Fragment key={verse.number}>
            {isArabic ? (
              <>
                {getVerseText(verse)} <VerseMarker number={verse.number} />{" "}
              </>
            ) : (
              <>
                {getVerseText(verse)} ({verse.number}){" "}
              </>
            )}
          </React.Fragment>
        ))}
      </Text>
    </>
  );
});
