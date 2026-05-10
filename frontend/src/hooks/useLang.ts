import { useTranslation } from "react-i18next";
import { useCallback } from "react";

export type Lang = "en" | "bn";

export function useLang() {
  const { i18n } = useTranslation();

  const lang = (i18n.language === "bn" ? "bn" : "en") as Lang;

  const toggle = useCallback(() => {
    const next: Lang = lang === "en" ? "bn" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  }, [lang, i18n]);

  const setLang = useCallback(
    (l: Lang) => {
      i18n.changeLanguage(l);
      localStorage.setItem("lang", l);
    },
    [i18n],
  );

  return { lang, toggle, setLang };
}
