import { Button } from "antd";
import { useLang } from "../hooks/useLang";

export function LanguageToggle() {
  const { lang, toggle } = useLang();
  return (
    <Button
      type="text"
      onClick={toggle}
      style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}
      title={lang === "en" ? "Switch to Bangla" : "Switch to English"}
    >
      {lang === "en" ? "বাংলা" : "English"}
    </Button>
  );
}
