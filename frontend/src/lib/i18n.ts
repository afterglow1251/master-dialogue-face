import { createI18n } from "vue-i18n";
import uk from "@/locales/uk.json";
import en from "@/locales/en.json";

const savedLocale = localStorage.getItem("settings:locale");

function ukPluralRule(choice: number, choicesLength: number): number {
  const ONE = 0;
  const FEW = 1;
  const MANY = 2;

  if (choicesLength < 3) {
    return choice === 1 ? ONE : FEW;
  }

  const mod10 = choice % 10;
  const mod100 = choice % 100;
  const isTeen = mod100 >= 11 && mod100 <= 19;

  if (mod10 === 1 && !isTeen) return ONE;
  if (mod10 >= 2 && mod10 <= 4 && !isTeen) return FEW;
  return MANY;
}

export type Locale = "uk" | "en";

function isLocale(value: string | null): value is Locale {
  return value === "uk" || value === "en";
}

export const i18n = createI18n({
  legacy: false,
  locale: isLocale(savedLocale) ? savedLocale : "uk",
  fallbackLocale: "en",
  messages: { uk, en },
  pluralRules: { uk: ukPluralRule },
});
