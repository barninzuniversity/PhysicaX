"use client";

import { useMemo, useState } from "react";
import { useLocale } from "./LocaleProvider";

type TextFilterProps = {
  title: React.ReactNode;
  text: string;
  placeholder: string;
  maxLines?: number;
};

export function TextFilter({ title, text, placeholder, maxLines = 120 }: TextFilterProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const lines = useMemo(() => text.split(/\r?\n/), [text]);

  const filtered = useMemo(() => {
    if (!query) {
      return lines.slice(0, maxLines);
    }
    const q = query.toLowerCase();
    return lines.filter((line) => line.toLowerCase().includes(q)).slice(0, maxLines);
  }, [lines, query, maxLines]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{title}</div>
      <input
        className="search-input"
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="search-meta">
        {t("textFilterShowing")} {filtered.length} {t("textFilterOf")} {lines.length} {t("textFilterLines")}
      </div>
      <div className="code-block">
        <pre><code>{filtered.join("\n")}</code></pre>
      </div>
    </div>
  );
}
