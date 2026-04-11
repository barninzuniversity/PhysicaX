"use client";

import { ReactNode } from "react";
import { useLocale } from "./LocaleProvider";

export function LocaleText({ id, fallback }: { id: string; fallback?: ReactNode }) {
  const { t } = useLocale();
  const text = t(id);
  if (text === id && fallback !== undefined) {
    return <>{fallback}</>;
  }
  return <>{text}</>;
}
