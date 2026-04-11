"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Experiment = {
  id: string;
  title: string;
  model: string;
  inputs: Record<string, number>;
  outputs: Record<string, number>;
  notes?: string | null;
  tags?: string | null;
  visibility: string;
  version?: number;
  createdAt?: string;
  folderId?: string | null;
  folder?: { id: string; title: string } | null;
  forkedFromId?: string | null;
};

type Folder = {
  id: string;
  title: string;
};

type Tag = {
  id: string;
  label: string;
};

type Asset = {
  id: string;
  title: string;
  path: string;
  experimentId?: string | null;
};

export function ExperimentLibrary() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [query, setQuery] = useState("");
  const [folderId, setFolderId] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>({});
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({});
  const [visibilityDrafts, setVisibilityDrafts] = useState<Record<string, string>>({});
  const { t } = useLocale();

  const [assetTitle, setAssetTitle] = useState("Snapshot");
  const [assetPath, setAssetPath] = useState("");
  const [assetExperimentId, setAssetExperimentId] = useState("");

  const load = async () => {
    setStatus(null);
    try {
      const [expRes, folderRes, tagRes, assetRes] = await Promise.all([
        fetch("/api/experiments"),
        fetch("/api/folders"),
        fetch("/api/tags"),
        fetch("/api/assets")
      ]);
      if (expRes.ok) {
        const data = await expRes.json();
        setExperiments(data);
        const drafts: Record<string, string> = {};
        const titleMap: Record<string, string> = {};
        const visibilityMap: Record<string, string> = {};
        data.forEach((item: Experiment) => {
          drafts[item.id] = item.tags || "";
          titleMap[item.id] = item.title;
          visibilityMap[item.id] = item.visibility || "private";
        });
        setTagDrafts(drafts);
        setTitleDrafts(titleMap);
        setVisibilityDrafts(visibilityMap);
      }
      if (folderRes.ok) setFolders(await folderRes.json());
      if (tagRes.ok) setTags(await tagRes.json());
      if (assetRes.ok) setAssets(await assetRes.json());
    } catch {
      setStatus(t("experimentLibraryLoadError"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return experiments.filter((item) => {
      if (folderId && item.folder?.id !== folderId) return false;
      if (tagFilter) {
        const tagList = (item.tags || "").split(",").map((tag) => tag.trim());
        if (!tagList.includes(tagFilter)) return false;
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        (item.tags || "").toLowerCase().includes(q)
      );
    });
  }, [experiments, query, folderId, tagFilter]);

  const updateExperiment = async (id: string, updates: Partial<Experiment>) => {
    setStatus(null);
    try {
      const res = await fetch("/api/experiments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates })
      });
      if (res.ok) {
        const data = await res.json();
        setExperiments((prev) => prev.map((item) => (item.id === id ? data : item)));
      } else {
        setStatus(t("experimentLibraryUpdateError"));
      }
    } catch {
      setStatus(t("experimentLibraryUpdateError"));
    }
  };

  const removeExperiment = async (id: string) => {
    setStatus(null);
    try {
      const res = await fetch(`/api/experiments?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setExperiments((prev) => prev.filter((item) => item.id !== id));
      } else {
        setStatus(t("experimentLibraryDeleteError"));
      }
    } catch {
      setStatus(t("experimentLibraryDeleteError"));
    }
  };

  const duplicateExperiment = async (exp: Experiment) => {
    setStatus(null);
    try {
      const res = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${exp.title} (Duplicate)`,
          model: exp.model,
          inputs: exp.inputs,
          outputs: exp.outputs,
          notes: exp.notes ?? null,
          tags: exp.tags ?? "",
          visibility: exp.visibility ?? "private",
          parentId: exp.id,
          version: (exp.version ?? 1) + 1
        })
      });
      if (res.ok) {
        const data = await res.json();
        setExperiments((prev) => [data, ...prev]);
        setStatus(t("experimentLibraryDuplicated"));
      } else {
        setStatus(t("experimentLibraryDuplicateError"));
      }
    } catch {
      setStatus(t("experimentLibraryDuplicateError"));
    }
  };

  const addAsset = async () => {
    if (!assetPath.trim()) {
      setStatus(t("experimentLibraryAssetPathRequired"));
      return;
    }
    setStatus(null);
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: assetTitle,
          path: assetPath,
          experimentId: assetExperimentId || null
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAssets((prev) => [data, ...prev]);
        setAssetPath("");
      } else {
        setStatus(t("experimentLibraryAssetSaveError"));
      }
    } catch {
      setStatus(t("experimentLibraryAssetSaveError"));
    }
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("experimentLibraryTitle")}</div>
      <div className="search-controls">
        <input
          className="search-input"
          type="text"
          placeholder={t("experimentLibrarySearchPlaceholder")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="search-tabs">
          <button type="button" className="tab" onClick={load}>
            {t("experimentLibraryRefresh")}
          </button>
          <select className="tab" value={folderId} onChange={(event) => setFolderId(event.target.value)}>
            <option value="">{t("experimentLibraryAllFolders")}</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.title}
              </option>
            ))}
          </select>
          <select className="tab" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
            <option value="">{t("experimentLibraryAllTags")}</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.label}>
                {tag.label}
              </option>
            ))}
          </select>
          {status ? <span className="pill">{status}</span> : null}
        </div>
      </div>

      <div className="result-grid" style={{ marginTop: "16px" }}>
        {filtered.length === 0 ? <div className="demo-note">{t("experimentLibraryNoMatches")}</div> : null}
        {filtered.map((item) => (
          <div key={item.id} className="result-card">
            <div className="result-title">{item.title}</div>
            <div className="result-summary">{t("experimentLibraryModelLabel")} {item.model}</div>
            <div className="result-summary">{t("experimentLibraryVisibilityLabel")} {item.visibility === "public" ? t("experimentLibraryVisibilityPublic") : t("experimentLibraryVisibilityPrivate")}</div>
            <div className="result-summary">{t("experimentLibraryVersionLabel")} v{item.version ?? 1}</div>
            {item.folder ? <div className="result-tags">{t("experimentLibraryFolderLabel")} {item.folder.title}</div> : null}
            {item.tags ? <div className="result-tags">{t("experimentLibraryTagsLabel")} {item.tags}</div> : null}
            {item.forkedFromId ? <div className="result-tags">{t("experimentLibraryForkedLabel")} {item.forkedFromId}</div> : null}
            <div className="result-summary">{t("experimentLibraryInputsLabel")} {Object.entries(item.inputs).map(([key, value]) => `${key}=${value}`).join(", ")}</div>
            <div className="result-summary">{t("experimentLibraryOutputsLabel")} {Object.entries(item.outputs).map(([key, value]) => `${key}=${value}`).join(", ")}</div>
            <div className="demo-grid" style={{ marginTop: "8px" }}>
              <label className="field">
                <span>{t("experimentLibraryEditTitle")}</span>
                <input
                  type="text"
                  value={titleDrafts[item.id] ?? item.title}
                  onChange={(event) => setTitleDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))}
                  onBlur={(event) => updateExperiment(item.id, { title: event.target.value })}
                />
              </label>
              <label className="field">
                <span>{t("experimentLibraryEditFolder")}</span>
                <select
                  value={item.folder?.id ?? ""}
                  onChange={(event) => updateExperiment(item.id, { folderId: event.target.value || null })}
                >
                  <option value="">{t("experimentLibraryFolderNone")}</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t("experimentLibraryEditVisibility")}</span>
                <select
                  value={visibilityDrafts[item.id] ?? item.visibility ?? "private"}
                  onChange={(event) => {
                    setVisibilityDrafts((prev) => ({ ...prev, [item.id]: event.target.value }));
                    updateExperiment(item.id, { visibility: event.target.value });
                  }}
                >
                  <option value="private">{t("experimentLibraryVisibilityPrivate")}</option>
                  <option value="public">{t("experimentLibraryVisibilityPublic")}</option>
                </select>
              </label>
              <label className="field">
                <span>{t("experimentLibraryEditTags")}</span>
                <input
                  type="text"
                  value={tagDrafts[item.id] ?? item.tags ?? ""}
                  onChange={(event) =>
                    setTagDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))
                  }
                  onBlur={(event) => updateExperiment(item.id, { tags: event.target.value })}
                />
              </label>
            </div>
            <div className="control-row" style={{ marginTop: "8px" }}>
              <button type="button" className="tab" onClick={() => duplicateExperiment(item)}>
                {t("experimentLibraryDuplicate")}
              </button>
              <button type="button" className="tab" onClick={() => removeExperiment(item.id)}>
                {t("experimentLibraryDelete")}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="demo-output" style={{ marginTop: "16px" }}>
        <div className="demo-title">{t("experimentLibraryAssets")}</div>
        <div className="demo-grid">
          <label className="field">
            <span>{t("experimentLibraryAssetTitle")}</span>
            <input value={assetTitle} onChange={(event) => setAssetTitle(event.target.value)} />
          </label>
          <label className="field">
            <span>{t("experimentLibraryAssetPath")}</span>
            <input value={assetPath} onChange={(event) => setAssetPath(event.target.value)} />
          </label>
          <label className="field">
            <span>{t("experimentLibraryAssetExperiment")}</span>
            <input value={assetExperimentId} onChange={(event) => setAssetExperimentId(event.target.value)} />
          </label>
        </div>
        <div className="control-row">
          <button type="button" className="control-button" onClick={addAsset}>
            {t("experimentLibraryAssetSave")}
          </button>
        </div>
        <div className="saved-runs">
          {assets.length === 0 ? <div className="demo-note">{t("experimentLibraryNoAssets")}</div> : null}
          {assets.map((asset) => (
            <div key={asset.id} className="result-card">
              <div className="result-title">{asset.title}</div>
              <div className="result-summary">{t("experimentLibraryAssetPathLabel")} {asset.path}</div>
              {asset.experimentId ? <div className="result-tags">{t("experimentLibraryAssetExperimentLabel")} {asset.experimentId}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
