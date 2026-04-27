import { createI18n } from "vue-i18n";
import uk from "@/locales/uk.json";
import en from "@/locales/en.json";

const savedLocale = localStorage.getItem("settings:locale");

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale ?? "uk",
  fallbackLocale: "en",
  messages: { uk, en },
});
