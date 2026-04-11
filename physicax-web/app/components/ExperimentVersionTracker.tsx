"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Experiment = {
  id: string;
  title: string;
  model: string;
  version?: number;
  parentId?: string | null;
  createdAt?: string;
  visibility?: string;
  inputs?: Record<string, number>;
  outputs?: Record<string, number>;
  notes?: string | null;
  tags?: string | null;
};

type Lineage = {
  rootId: string;
  rootTitle: string;
  runs: Experiment[];
};

const getRoot = (run: Experiment, map: Map<string, Experiment>): Experiment => {
  let current = run;
  const seen = new Set<string>();
  while (current.parentId && map.has(current.parentId) && !seen.has(current.parentId)) {
    seen.add(current.parentId);
    current = map.get(current.parentId) as Experiment;
  }
  return current;
};

export function ExperimentVersionTracker() {
  const [runs, setRuns] = useState<Experiment[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const { t } = useLocale();

  const load = async () => {
    setStatus(null);
    try {
      const res = await fetch("/api/experiments");
      if (res.ok) {
        setRuns(await res.json());
      } else {
        setStatus(t("experimentVersionLoadError"));
      }
    } catch {
      setStatus(t("experimentVersionLoadError"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cloneVersion = async (run: Experiment) => {
    setStatus(null);
    try {
      const res = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Clone of ${run.title}`,
          model: run.model,
          inputs: run.inputs ?? {},
          outputs: run.outputs ?? {},
          notes: run.notes ?? null,
          tags: run.tags ?? "",
          visibility: "private",
          parentId: run.id,
          version: (run.version ?? 1) + 1
        })
      });
      if (res.ok) {
        await load();
        setStatus(t("experimentVersionCloneCreated"));
      } else {
        setStatus(t("experimentVersionCloneFailed"));
      }
    } catch {
      setStatus(t("experimentVersionCloneFailed"));
    }
  };

  const lineages = useMemo<Lineage[]>(() => {
    const map = new Map<string, Experiment>();
    runs.forEach((run) => map.set(run.id, run));
    const groups = new Map<string, Lineage>();
    runs.forEach((run) => {
      const root = getRoot(run, map);
      if (!groups.has(root.id)) {
        groups.set(root.id, { rootId: root.id, rootTitle: root.title, runs: [] });
      }
      groups.get(root.id)?.runs.push(run);
    });
    return Array.from(groups.values()).map((group) => ({
      ...group,
      runs: group.runs.sort((a, b) => (a.version ?? 1) - (b.version ?? 1))
    }));
  }, [runs]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("experimentVersionTitle")}</div>
      <div className="control-row">
        <button type="button" className="control-button" onClick={load}>
          {t("experimentVersionRefresh")}
        </button>
        {status ? <span className="pill">{status}</span> : null}
      </div>
      <div className="result-grid" style={{ marginTop: "12px" }}>
        {lineages.length === 0 ? <div className="demo-note">{t("experimentVersionEmpty")}</div> : null}
        {lineages.map((group) => (
          <div key={group.rootId} className="result-card">
            <div className="result-title">{group.rootTitle}</div>
            <div className="result-summary">{t("experimentVersionCount")} {group.runs.length}</div>
            <div className="result-tags">{t("experimentVersionRoot")} {group.rootId}</div>
            <div className="saved-runs">
              {group.runs.map((run) => (
                <div key={run.id} className="result-card" style={{ marginTop: "8px" }}>
                  <div className="result-summary">{t("experimentVersionPrefix")}{run.version ?? 1} - {run.title}</div>
                  <div className="result-tags">{run.createdAt ? new Date(run.createdAt).toLocaleString() : ""}</div>
                  <div className="control-row" style={{ marginTop: "6px" }}>
                    <button type="button" className="tab" onClick={() => cloneVersion(run)}>
                      {t("experimentVersionClone")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
