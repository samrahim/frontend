import { useTranslation } from "react-i18next";
import "./LanguageSwitcher.css";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("i18nLanguage", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  };

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${i18n.language === "en" ? "active" : ""}`}
        onClick={() => handleLanguageChange("en")}
        title="English"
      >
        🇬🇧 EN
      </button>
      <button
        className={`lang-btn ${i18n.language === "fr" ? "active" : ""}`}
        onClick={() => handleLanguageChange("fr")}
        title="Français"
      >
        🇫🇷 FR
      </button>
      <button
        className={`lang-btn ${i18n.language === "ar" ? "active" : ""}`}
        onClick={() => handleLanguageChange("ar")}
        title="Arabic"
      >
        🇸🇦 AR
      </button>
    </div>
  );
}
