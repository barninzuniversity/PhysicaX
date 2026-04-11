"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExperimentRun, readGallery, writeGallery } from "../lib/experimentStore";
import { useSession } from "next-auth/react";
import { useLocale } from "./LocaleProvider";

export function ExperimentGallery() {
  const [items, setItems] = useState<ExperimentRun[]>(() => readGallery());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "featured" | "trending">("all");
  const [commentOpen, setCommentOpen] = useState<Record<string, boolean>>({});
  const [commentMap, setCommentMap] = useState<Record<string, { id: string; content: string; authorName: string; createdAt: string }[]>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const { data: session } = useSession();
  const { t } = useLocale();
  const isAdmin = session?.user?.role === "admin";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = filter === "featured"
      ? items.filter((item: any) => item.featured)
      : filter === "trending"
        ? items.filter((item: any) => (item.trendingScore ?? 0) > 0 || (item.likesCount ?? 0) > 0 || (item.commentsCount ?? 0) > 0)
        : items;
    if (!q) {
      return base;
    }
    return base.filter((item) => {
      const inTitle = item.title.toLowerCase().includes(q);
      const tags = Array.isArray(item.tags)
        ? item.tags
        : item.tags
          ? item.tags.split(",").map((tag) => tag.trim())
          : [];
      const inTags = tags.some((tag) => tag.toLowerCase().includes(q));
      const inModel = item.model.toLowerCase().includes(q);
      return inTitle || inTags || inModel;
    });
  }, [items, query, filter]);

  const refresh = async () => {
    try {
      const res = await fetch("/api/gallery");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        return;
      }
    } catch {
      // ignore
    }
    setItems(readGallery());
  };

  const clear = () => {
    writeGallery([]);
    setItems([]);
  };

  const toggleLike = async (id: string) => {
    try {
      const res = await fetch(`/api/gallery/${id}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setItems((prev: any[]) =>
          prev.map((item) =>
            item.id === id ? { ...item, likesCount: data.likesCount } : item
          )
        );
      }
    } catch {
      // ignore
    }
  };

  const toggleFeatured = async (id: string) => {
    try {
      const res = await fetch(`/api/gallery/${id}/feature`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setItems((prev: any[]) => prev.map((item) => (item.id === id ? { ...item, featured: data.featured } : item)));
      }
    } catch {
      // ignore
    }
  };

  const boostTrending = async (id: string) => {
    try {
      const res = await fetch(`/api/gallery/${id}/boost`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setItems((prev: any[]) => prev.map((item) => (item.id === id ? { ...item, trendingScore: data.trendingScore } : item)));
      }
    } catch {
      // ignore
    }
  };

  const forkExperiment = async (id: string) => {
    try {
      const res = await fetch(`/api/gallery/${id}/fork`, { method: "POST" });
      if (res.ok) {
        setItems((prev) => prev);
      }
    } catch {
      // ignore
    }
  };

  const toggleComments = async (id: string) => {
    setCommentOpen((prev) => ({ ...prev, [id]: !prev[id] }));
    if (commentMap[id]) {
      return;
    }
    try {
      const res = await fetch(`/api/gallery/${id}/comment`);
      if (res.ok) {
        const data = await res.json();
        setCommentMap((prev) => ({ ...prev, [id]: data }));
      }
    } catch {
      // ignore
    }
  };

  const submitComment = async (id: string) => {
    const content = (commentDraft[id] || "").trim();
    if (!content) return;
    try {
      const res = await fetch(`/api/gallery/${id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        const data = await res.json();
        setCommentMap((prev) => ({
          ...prev,
          [id]: [{ ...data, authorName: data.authorName ?? t("experimentGalleryYou") }, ...(prev[id] || [])]
        }));
        setCommentDraft((prev) => ({ ...prev, [id]: "" }));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/gallery");
        if (res.ok) {
          const data = await res.json();
          setItems(data);
          return;
        }
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("experimentGalleryTitle")}</div>
      <div className="search-controls">
        <input
          className="search-input"
          type="text"
          placeholder={t("experimentGallerySearchPlaceholder")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="search-tabs">
          <button type="button" className="tab tab-active" onClick={refresh}>
            {t("experimentGalleryRefresh")}
          </button>
          <button type="button" className={`tab ${filter === "all" ? "tab-active" : ""}`} onClick={() => setFilter("all")}>
            {t("experimentGalleryAll")}
          </button>
          <button type="button" className={`tab ${filter === "featured" ? "tab-active" : ""}`} onClick={() => setFilter("featured")}>
            {t("experimentGalleryFeatured")}
          </button>
          <button type="button" className={`tab ${filter === "trending" ? "tab-active" : ""}`} onClick={() => setFilter("trending")}>
            {t("experimentGalleryTrending")}
          </button>
          <button type="button" className="tab" onClick={clear}>
            {t("experimentGalleryClear")}
          </button>
        </div>
      </div>
      <div className="result-grid" style={{ marginTop: "16px" }}>
        {filtered.length === 0 ? <div className="demo-note">{t("experimentGalleryEmpty")}</div> : null}
        {filtered.map((item) => (
          <div key={item.id} className="result-card">
            <div className="result-title">{item.title}</div>
            <div className="result-summary">{t("experimentGalleryModelLabel")} {item.model}</div>
            {item.authorName ? (
              <div className="result-summary">
                {t("experimentGalleryAuthorLabel")} {item.authorName}
                {(item as any).authorId ? (
                  <>
                    {" "}
                    <Link href={`/profile/${(item as any).authorId}`}>{t("experimentGalleryViewProfile")}</Link>
                  </>
                ) : null}
              </div>
            ) : null}
            <div className="result-summary">
              {t("experimentGalleryInputsLabel")} {Object.entries(item.inputs).map(([key, value]) => `${key}=${value}`).join(", ")}
            </div>
            <div className="result-summary">
              {t("experimentGalleryOutputsLabel")} {Object.entries(item.outputs).map(([key, value]) => `${key}=${value}`).join(", ")}
            </div>
            {item.tags ? (
              <div className="result-tags">
                {Array.isArray(item.tags) ? item.tags.join(", ") : item.tags}
              </div>
            ) : null}
            <div className="result-tags">{new Date(item.timestamp ?? item.createdAt ?? "").toLocaleString()}</div>
            <div className="result-tags">{t("experimentGalleryIdLabel")} {item.id}</div>
            <div className="result-tags">{t("experimentGalleryTrendingLabel")} {(item as any).trendingScore?.toFixed ? (item as any).trendingScore.toFixed(2) : item.trendingScore ?? 0}</div>
            <div className="result-tags">
              <Link href={`/gallery/${item.id}`}>{t("experimentGalleryShareLink")}</Link>
            </div>
            <div className="control-row" style={{ marginTop: "8px" }}>
              <button type="button" className="tab" onClick={() => toggleLike(item.id)}>
                {t("experimentGalleryLike")} ({(item as any).likesCount ?? 0})
              </button>
              <button type="button" className="tab" onClick={() => toggleComments(item.id)}>
                {t("experimentGalleryComments")} ({(item as any).commentsCount ?? 0})
              </button>
              {session?.user?.email ? (
                <button type="button" className="tab" onClick={() => forkExperiment(item.id)}>
                  {t("experimentGalleryFork")}
                </button>
              ) : null}
              {isAdmin ? (
                <button type="button" className="tab" onClick={() => toggleFeatured(item.id)}>
                  {item.featured ? t("experimentGalleryUnfeature") : t("experimentGalleryFeature")}
                </button>
              ) : null}
              {isAdmin ? (
                <button type="button" className="tab" onClick={() => boostTrending(item.id)}>
                  {t("experimentGalleryBoost")}
                </button>
              ) : null}
            </div>
            {commentOpen[item.id] ? (
              <div className="demo-output" style={{ marginTop: "8px" }}>
                <label className="field">
                  <span>{t("experimentGalleryAddComment")}</span>
                  <input
                    type="text"
                    value={commentDraft[item.id] || ""}
                    onChange={(event) => setCommentDraft((prev) => ({ ...prev, [item.id]: event.target.value }))}
                  />
                </label>
                <button type="button" className="tab tab-active" onClick={() => submitComment(item.id)}>
                  {t("experimentGalleryPost")}
                </button>
                <div className="saved-runs">
                  {(commentMap[item.id] || []).length === 0 ? (
                    <div className="demo-note">{t("experimentGalleryNoComments")}</div>
                  ) : null}
                  {(commentMap[item.id] || []).map((comment) => (
                    <div key={comment.id} className="result-card">
                      <div className="result-summary">{comment.content}</div>
                      <div className="result-tags">{comment.authorName}</div>
                      <div className="result-tags">{new Date(comment.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
