"use client";

import { useEffect, useMemo, useState } from "react";
import { PlotCanvas } from "./PlotCanvas";
import { ExperimentRun, exportRunAsJson, publishRun, readRuns, writeRuns } from "../lib/experimentStore";
import { useSession } from "next-auth/react";
import { useLocale } from "./LocaleProvider";

type ModelKey = "ideal_gas" | "projectile" | "logistic";

type Collection = {
  id: string;
  title: string;
  description?: string | null;
};

type Folder = {
  id: string;
  title: string;
  description?: string | null;
};

export function ExperimentBuilder() {
  const [model, setModel] = useState<ModelKey>("ideal_gas");
  const [inputs, setInputs] = useState<Record<string, string>>({
    n: "1",
    t: "300",
    v: "0.02",
    v0: "40",
    theta: "45",
    g: "9.80665",
    r: "3.7",
    x0: "0.2",
    steps: "30"
  });
  const [runs, setRuns] = useState<ExperimentRun[]>(() => readRuns());
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionId, setCollectionId] = useState<string>("");
  const [newCollection, setNewCollection] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderId, setFolderId] = useState<string>("");
  const [newFolder, setNewFolder] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [title, setTitle] = useState("Untitled experiment");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("thermo, baseline");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const { data: session } = useSession();
  const { t } = useLocale();

  const computed: { inputs: Record<string, number>; outputs: Record<string, number> } = useMemo(() => {
    if (model === "ideal_gas") {
      const n = Number(inputs.n);
      const t = Number(inputs.t);
      const v = Number(inputs.v);
      const p = (n * 8.314462618 * t) / v;
      const inputsOut: Record<string, number> = { n, t, v };
      const outputsOut: Record<string, number> = { p };
      return { outputs: outputsOut, inputs: inputsOut };
    }
    if (model === "projectile") {
      const v0 = Number(inputs.v0);
      const theta = Number(inputs.theta);
      const g = Number(inputs.g);
      const rad = (theta * Math.PI) / 180;
      const range = (v0 * v0 * Math.sin(2 * rad)) / g;
      const time = (2 * v0 * Math.sin(rad)) / g;
      const inputsOut: Record<string, number> = { v0, theta, g };
      const outputsOut: Record<string, number> = { range, time };
      return { outputs: outputsOut, inputs: inputsOut };
    }
    const r = Number(inputs.r);
    const x0 = Number(inputs.x0);
    const steps = Math.max(1, Math.floor(Number(inputs.steps)));
    let x = x0;
    for (let i = 0; i < steps; i += 1) {
      x = r * x * (1 - x);
    }
    const inputsOut: Record<string, number> = { r, x0, steps };
    const outputsOut: Record<string, number> = { x };
    return { outputs: outputsOut, inputs: inputsOut };
  }, [model, inputs]);

  const plotSeries = useMemo(() => {
    if (model === "projectile") {
      const v0 = Number(inputs.v0);
      const theta = Number(inputs.theta);
      const g = Number(inputs.g);
      if (!Number.isFinite(v0) || !Number.isFinite(theta) || !Number.isFinite(g) || g <= 0) {
        return [];
      }
      const rad = (theta * Math.PI) / 180;
      const time = (2 * v0 * Math.sin(rad)) / g;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= 60; i += 1) {
        const t = (time * i) / 60;
        const x = v0 * Math.cos(rad) * t;
        const y = v0 * Math.sin(rad) * t - 0.5 * g * t * t;
        pts.push({ x, y: Math.max(0, y) });
      }
      return [{ id: "traj", points: pts, color: "#1f8a8a" }];
    }
    if (model === "logistic") {
      const r = Number(inputs.r);
      const x0 = Number(inputs.x0);
      const steps = Math.max(1, Math.floor(Number(inputs.steps)));
      let x = x0;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < steps; i += 1) {
        x = r * x * (1 - x);
        pts.push({ x: i + 1, y: x });
      }
      return [{ id: "log", points: pts, color: "#d26a2e" }];
    }
    return [];
  }, [model, inputs]);

  const comparison = useMemo(() => {
    const runA = runs.find((run) => run.id === compareA);
    const runB = runs.find((run) => run.id === compareB);
    if (!runA || !runB) {
      return null;
    }
    const deltas: Record<string, number> = {};
    Object.keys({ ...runA.outputs, ...runB.outputs }).forEach((key) => {
      const aVal = Number(runA.outputs[key]);
      const bVal = Number(runB.outputs[key]);
      if (Number.isFinite(aVal) && Number.isFinite(bVal)) {
        deltas[key] = bVal - aVal;
      }
    });
    return { runA, runB, deltas };
  }, [compareA, compareB, runs]);

  const runRecord = useMemo<ExperimentRun>(() => {
    const parent = parentId ? runs.find((run) => run.id === parentId) : undefined;
    const nextVersion = parent ? (parent.version ?? 1) + 1 : 1;
    return {
      id: `${model}-${Date.now()}`,
      title,
      model,
      inputs: computed.inputs,
      outputs: computed.outputs,
      timestamp: new Date().toISOString(),
      notes,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      visibility,
      collectionId: collectionId || null,
      folderId: folderId || null,
      parentId: parent ? parent.id : null,
      version: nextVersion
    };
  }, [model, computed, title, notes, tags, visibility, collectionId, folderId, parentId, runs]);

  const saveRun = async () => {
    if (session?.user?.email) {
      try {
        const payload = {
          ...runRecord,
          tags: Array.isArray(runRecord.tags) ? runRecord.tags.join(", ") : runRecord.tags
        };
        const res = await fetch("/api/experiments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const saved = await res.json();
          setRuns((prev) => [saved, ...prev].slice(0, 30));
          return;
        }
      } catch {
        // fallback to local
      }
    }
    const next = [runRecord, ...runs].slice(0, 30);
    setRuns(next);
    writeRuns(next);
  };

  const clearRuns = () => {
    setRuns([]);
    writeRuns([]);
  };

  const publishToGallery = async () => {
    if (session?.user?.email) {
      try {
        const payload = {
          ...runRecord,
          visibility: "public",
          tags: Array.isArray(runRecord.tags) ? runRecord.tags.join(", ") : runRecord.tags
        };
        const res = await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          return;
        }
      } catch {
        // fallback
      }
    }
    publishRun({ ...runRecord, visibility: "public" });
  };

  useEffect(() => {
    const load = async () => {
      if (!session?.user?.email) {
        return;
      }
      try {
        const res = await fetch("/api/experiments");
        if (res.ok) {
          const data = await res.json();
          setRuns(data);
        }
      } catch {
        // ignore
      }
    };
    load();
  }, [session?.user?.email]);

  useEffect(() => {
    const loadCollections = async () => {
      if (!session?.user?.email) {
        return;
      }
      try {
        const res = await fetch("/api/collections");
        if (res.ok) {
          const data = await res.json();
          setCollections(data);
          if (data.length && !collectionId) {
            setCollectionId(data[0].id);
          }
        }
      } catch {
        // ignore
      }
    };
    loadCollections();
  }, [session?.user?.email, collectionId]);

  useEffect(() => {
    const loadFolders = async () => {
      if (!session?.user?.email) {
        return;
      }
      try {
        const res = await fetch("/api/folders");
        if (res.ok) {
          const data = await res.json();
          setFolders(data);
          if (data.length && !folderId) {
            setFolderId(data[0].id);
          }
        }
      } catch {
        // ignore
      }
    };
    loadFolders();
  }, [session?.user?.email, folderId]);

  const createCollection = async () => {
    const titleText = newCollection.trim();
    if (!titleText) {
      return;
    }
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleText })
      });
      if (res.ok) {
        const saved = await res.json();
        setCollections((prev) => [saved, ...prev]);
        setCollectionId(saved.id);
        setNewCollection("");
      }
    } catch {
      // ignore
    }
  };

  const createFolder = async () => {
    const titleText = newFolder.trim();
    if (!titleText) {
      return;
    }
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleText })
      });
      if (res.ok) {
        const saved = await res.json();
        setFolders((prev) => [saved, ...prev]);
        setFolderId(saved.id);
        setNewFolder("");
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("experimentBuilderTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("experimentBuilderTitleLabel")}</span>
          <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("experimentBuilderTags")}</span>
          <input type="text" value={tags} onChange={(event) => setTags(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("experimentBuilderVisibility")}</span>
          <select value={visibility} onChange={(event) => setVisibility(event.target.value as "private" | "public")}>
            <option value="private">{t("experimentBuilderVisibilityPrivate")}</option>
            <option value="public">{t("experimentBuilderVisibilityPublic")}</option>
          </select>
        </label>
        <label className="field">
          <span>{t("experimentBuilderCollection")}</span>
          <select value={collectionId} onChange={(event) => setCollectionId(event.target.value)}>
            <option value="">{t("experimentBuilderCollectionUnsorted")}</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t("experimentBuilderFolder")}</span>
          <select value={folderId} onChange={(event) => setFolderId(event.target.value)}>
            <option value="">{t("experimentBuilderFolderNone")}</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t("experimentBuilderModel")}</span>
          <select value={model} onChange={(event) => setModel(event.target.value as ModelKey)}>
            <option value="ideal_gas">{t("experimentBuilderModelIdealGas")}</option>
            <option value="projectile">{t("experimentBuilderModelProjectile")}</option>
            <option value="logistic">{t("experimentBuilderModelLogistic")}</option>
          </select>
        </label>
        <label className="field">
          <span>{t("experimentBuilderBaseRun")}</span>
          <select value={parentId ?? ""} onChange={(event) => setParentId(event.target.value || null)}>
            <option value="">{t("experimentBuilderBaseRunNone")}</option>
            {runs.map((run) => (
              <option key={run.id} value={run.id}>
                {run.title} v{run.version ?? 1}
              </option>
            ))}
          </select>
        </label>
        {model === "ideal_gas" ? (
          <>
            <label className="field">
              <span>n</span>
              <input
                type="number"
                value={inputs.n}
                onChange={(event) => setInputs((prev) => ({ ...prev, n: event.target.value }))}
                step="any"
              />
            </label>
            <label className="field">
              <span>T</span>
              <input
                type="number"
                value={inputs.t}
                onChange={(event) => setInputs((prev) => ({ ...prev, t: event.target.value }))}
                step="any"
              />
            </label>
            <label className="field">
              <span>V</span>
              <input
                type="number"
                value={inputs.v}
                onChange={(event) => setInputs((prev) => ({ ...prev, v: event.target.value }))}
                step="any"
              />
            </label>
          </>
        ) : null}
        {model === "projectile" ? (
          <>
            <label className="field">
              <span>v0</span>
              <input
                type="number"
                value={inputs.v0}
                onChange={(event) => setInputs((prev) => ({ ...prev, v0: event.target.value }))}
                step="any"
              />
            </label>
            <label className="field">
              <span>theta</span>
              <input
                type="number"
                value={inputs.theta}
                onChange={(event) => setInputs((prev) => ({ ...prev, theta: event.target.value }))}
                step="any"
              />
            </label>
            <label className="field">
              <span>g</span>
              <input
                type="number"
                value={inputs.g}
                onChange={(event) => setInputs((prev) => ({ ...prev, g: event.target.value }))}
                step="any"
              />
            </label>
          </>
        ) : null}
        {model === "logistic" ? (
          <>
            <label className="field">
              <span>r</span>
              <input
                type="number"
                value={inputs.r}
                onChange={(event) => setInputs((prev) => ({ ...prev, r: event.target.value }))}
                step="any"
              />
            </label>
            <label className="field">
              <span>x0</span>
              <input
                type="number"
                value={inputs.x0}
                onChange={(event) => setInputs((prev) => ({ ...prev, x0: event.target.value }))}
                step="any"
              />
            </label>
            <label className="field">
              <span>steps</span>
              <input
                type="number"
                value={inputs.steps}
                onChange={(event) => setInputs((prev) => ({ ...prev, steps: event.target.value }))}
                step="1"
              />
            </label>
          </>
        ) : null}
      </div>

      <div className="control-row" style={{ marginTop: "8px" }}>
        <label className="field" style={{ minWidth: "220px" }}>
          <span>{t("experimentBuilderNewCollection")}</span>
          <input type="text" value={newCollection} onChange={(event) => setNewCollection(event.target.value)} />
        </label>
        <button type="button" className="control-button secondary" onClick={createCollection}>
          {t("experimentBuilderCreateCollection")}
        </button>
        <label className="field" style={{ minWidth: "220px" }}>
          <span>{t("experimentBuilderNewFolder")}</span>
          <input type="text" value={newFolder} onChange={(event) => setNewFolder(event.target.value)} />
        </label>
        <button type="button" className="control-button secondary" onClick={createFolder}>
          {t("experimentBuilderCreateFolder")}
        </button>
        {parentId ? <span className="pill">{t("experimentBuilderNextVersion")} v{(runs.find((run) => run.id === parentId)?.version ?? 1) + 1}</span> : null}
      </div>

      <div className="demo-output">
        <div className="inline-kv">
          {Object.entries(computed.outputs).map(([key, value]) => (
            <span key={key} className="pill">
              {key} = {Number.isFinite(value) ? value.toFixed(4) : "--"}
            </span>
          ))}
        </div>
        <div className="inline-kv">
          <button type="button" className="tab tab-active" onClick={saveRun}>
            {t("experimentBuilderSaveRun")}
          </button>
          <button type="button" className="tab" onClick={publishToGallery}>
            {t("experimentBuilderPublish")}
          </button>
          <button type="button" className="tab" onClick={() => exportRunAsJson(runRecord)}>
            {t("experimentBuilderExportJson")}
          </button>
          <button type="button" className="tab" onClick={clearRuns}>
            {t("experimentBuilderClearSaved")}
          </button>
        </div>
      </div>

      <label className="field" style={{ marginTop: "12px" }}>
        <span>{t("experimentBuilderNotes")}</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
        />
      </label>

      {plotSeries.length ? <PlotCanvas series={plotSeries} xLabel="x" yLabel="y" /> : null}

      <div className="saved-runs">
        <div className="demo-title">{t("experimentBuilderSavedRuns")}</div>
        {runs.length === 0 ? <div className="demo-note">{t("experimentBuilderNoRuns")}</div> : null}
        {runs.map((run) => (
          <div key={run.id} className="result-card">
            <div className="result-title">{run.title}</div>
            <div className="result-summary">
              {t("experimentBuilderModelLabel")} {run.model} - {t("experimentBuilderVisibilityLabel")} {run.visibility === "public" ? t("experimentBuilderVisibilityPublic") : t("experimentBuilderVisibilityPrivate")}
            </div>
            <div className="result-summary">{t("experimentBuilderVersionLabel")} v{run.version ?? 1}</div>
            <div className="result-summary">
              {t("experimentBuilderInputsLabel")} {Object.entries(run.inputs).map(([key, value]) => `${key}=${value}`).join(", ")}
            </div>
            <div className="result-summary">
              {t("experimentBuilderOutputsLabel")} {Object.entries(run.outputs).map(([key, value]) => `${key}=${value}`).join(", ")}
            </div>
            {run.tags ? (
              <div className="result-tags">
                {Array.isArray(run.tags) ? run.tags.join(", ") : run.tags}
              </div>
            ) : null}
            <div className="result-tags">{new Date(run.timestamp ?? run.createdAt ?? "").toLocaleString()}</div>
            <div className="control-row">
              <button type="button" className="tab" onClick={() => setParentId(run.id)}>
                {t("experimentBuilderUseAsBase")}
              </button>
              <button type="button" className="tab" onClick={() => setCompareA(run.id)}>
                {t("experimentBuilderCompareA")}
              </button>
              <button type="button" className="tab" onClick={() => setCompareB(run.id)}>
                {t("experimentBuilderCompareB")}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="demo-output" style={{ marginTop: "16px" }}>
        <div className="demo-title">{t("experimentBuilderCompareTitle")}</div>
        <div className="demo-grid">
          <label className="field">
            <span>{t("experimentBuilderRunA")}</span>
            <select value={compareA} onChange={(event) => setCompareA(event.target.value)}>
              <option value="">{t("experimentBuilderSelectRun")}</option>
              {runs.map((run) => (
                <option key={`a-${run.id}`} value={run.id}>
                  {run.title} v{run.version ?? 1}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t("experimentBuilderRunB")}</span>
            <select value={compareB} onChange={(event) => setCompareB(event.target.value)}>
              <option value="">{t("experimentBuilderSelectRun")}</option>
              {runs.map((run) => (
                <option key={`b-${run.id}`} value={run.id}>
                  {run.title} v{run.version ?? 1}
                </option>
              ))}
            </select>
          </label>
        </div>
        {comparison ? (
          <div className="inline-kv">
            {Object.entries(comparison.deltas).map(([key, value]) => (
              <span key={key} className="pill">
                {t("experimentBuilderDelta")} {key} = {value.toFixed(4)}
              </span>
            ))}
          </div>
        ) : (
          <div className="demo-note">{t("experimentBuilderCompareHint")}</div>
        )}
      </div>
    </div>
  );
}

