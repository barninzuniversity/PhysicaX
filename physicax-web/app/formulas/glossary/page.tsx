"use client";

import { useMemo, useState } from "react";
import { glossary } from "../../data/glossary";
import { LocaleText } from "../../components/LocaleText";
import { useLocale } from "../../components/LocaleProvider";

export default function GlossaryPage() {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return glossary;
    return glossary.filter((entry) =>
      [entry.term, entry.definition, entry.category].some((field) =>
        field.toLowerCase().includes(q)
      )
    );
  }, [query]);

  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="glossaryTitle" fallback="Scientific Glossary" /></h2>
        <p><LocaleText id="glossaryIntro" fallback="Key definitions for math and physics across PhysicaX." /></p>
        <input
          className="search-input"
          type="text"
          placeholder={t("glossarySearchPlaceholder")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="search-meta">
          {t("glossaryShowing")} {filtered.length} {t("glossaryOf")} {glossary.length} {t("glossaryEntries")}
        </div>
      </section>
      <section className="section reveal">
        <div className="result-grid">
          {filtered.map((entry) => (
            <div key={entry.term} className="result-card">
              <div className="result-title">{entry.term}</div>
              <div className="result-summary">{entry.definition}</div>
              <div className="result-tags">{entry.category}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
