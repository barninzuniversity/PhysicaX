"use client";

import { TextFilter } from "./TextFilter";
import { useLocale } from "./LocaleProvider";

export function FormulaPackFilter({ text }: { text: string }) {
  const { t } = useLocale();
  return (
    <TextFilter
      title={t("formulaFinderTitle")}
      text={text}
      placeholder={t("formulaFinderPlaceholder")}
      maxLines={120}
    />
  );
}
