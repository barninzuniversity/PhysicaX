"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { searchIndex, SearchCategory, SearchEntry } from "../data/searchIndex";
import { useLocale } from "./LocaleProvider";

function matches(entry: SearchEntry, query: string) {
  const q = query.toLowerCase();
  return (
    entry.title.toLowerCase().includes(q) ||
    entry.summary.toLowerCase().includes(q) ||
    entry.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}

export function GlobalSearch() {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<"all" | SearchCategory>("all");
  const [dynamic, setDynamic] = useState<SearchEntry[]>([]);

  const categories: Array<{ id: "all" | SearchCategory; label: string }> = [
    { id: "all", label: t("searchAll") },
    { id: "page", label: t("searchPages") },
    { id: "lab", label: t("searchLabs") },
    { id: "model", label: t("searchModels") },
    { id: "feature", label: t("searchFeatures") },
    { id: "experiment", label: t("searchExperiments") },
    { id: "publication", label: t("searchGallery") },
    { id: "challenge", label: t("searchChallenges") },
    { id: "classroom", label: t("searchClassrooms") },
    { id: "assignment", label: t("searchAssignments") },
    { id: "notebook", label: t("searchNotebooks") }
  ];

  useEffect(() => {
    if (!query) {
      setDynamic([]);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        if (!res.ok) {
          setDynamic([]);
          return;
        }
        const data = await res.json();
        const mapped = (Array.isArray(data) ? data : []).map((item) => ({
          title: String(item.title || "Untitled"),
          href: String(item.href || "/"),
          category: item.category as SearchCategory,
          summary: String(item.summary || ""),
          tags: ["dynamic"]
        }));
        setDynamic(mapped);
      } catch {
        // ignore
      }
    };
    load();
    return () => controller.abort();
  }, [query]);

  const results = useMemo(() => {
    const base = query
      ? searchIndex.filter((entry) => matches(entry, query))
      : searchIndex.slice(0, 24);
    const merged = query ? [...dynamic, ...base] : base;
    return active === "all" ? merged : merged.filter((entry) => entry.category === active);
  }, [query, active, dynamic]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("searchTitle")}</div>
      <div className="search-controls">
        <input
          className="search-input"
          type="text"
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="search-tabs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`tab ${active === cat.id ? "tab-active" : ""}`}
              onClick={() => setActive(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      <div className="search-meta">
        {t("searchShowing")} {results.length} {results.length === 1 ? t("searchResult") : t("searchResults")}.
      </div>
      <div className="search-results">
        {results.map((entry) => (
          <Link key={`${entry.category}-${entry.title}`} href={entry.href} className="result-card">
            <div className="result-title">{entry.title}</div>
            <div className="result-summary">{entry.summary}</div>
            <div className="result-tags">{entry.tags.slice(0, 3).join(", ")}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
