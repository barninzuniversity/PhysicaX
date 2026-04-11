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
  visibility?: string;
  version?: number;
  createdAt?: string;
};

export function ExperimentComparePanel() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const { t } = useLocale();

  const load = async () => {
    setStatus(null);
    try {
      const res = await fetch("/api/experiments");
      if (res.ok) {
        const data = await res.json();
        setExperiments(data);
        if (data.length > 0 && !aId) {
          setAId(data[0].id);
        }
        if (data.length > 1 && !bId) {
          setBId(data[1].id);
        }
      }
    } catch {
      setStatus(t("experimentCompareLoadError"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const runA = experiments.find((item) => item.id === aId) || null;
  const runB = experiments.find((item) => item.id === bId) || null;

  const deltas = useMemo(() => {
    if (!runA || !runB) return [] as { key: string; value: number }[];
    const keys = new Set([...Object.keys(runA.outputs), ...Object.keys(runB.outputs)]);
    const results: { key: string; value: number }[] = [];
    keys.forEach((key) => {
      const aVal = Number(runA.outputs[key]);
      const bVal = Number(runB.outputs[key]);
      if (Number.isFinite(aVal) && Number.isFinite(bVal)) {
        results.push({ key, value: bVal - aVal });
      }
    });
    return results;
  }, [runA, runB]);

  const cloneRun = async (run: Experiment | null) => {
    if (!run) return;
    setStatus(null);
    try {
      const res = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${run.title} (Clone)`,
          model: run.model,
          inputs: run.inputs,
          outputs: run.outputs,
          notes: run.notes ?? null,
          tags: run.tags ?? "",
          visibility: "private",
          parentId: run.id,
          version: (run.version ?? 1) + 1
        })
      });
      if (res.ok) {
        setStatus(t("experimentCompareCloneCreated"));
        await load();
      } else {
        setStatus(t("experimentCompareCloneFailed"));
      }
    } catch {
      setStatus(t("experimentCompareCloneFailed"));
    }
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("experimentCompareTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("experimentCompareRunA")}</span>
          <select value={aId} onChange={(event) => setAId(event.target.value)}>
            <option value="">{t("experimentCompareSelectRun")}</option>
            {experiments.map((run) => (
              <option key={`a-${run.id}`} value={run.id}>
                {run.title} {t("experimentCompareVersionPrefix")}{run.version ?? 1}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t("experimentCompareRunB")}</span>
          <select value={bId} onChange={(event) => setBId(event.target.value)}>
            <option value="">{t("experimentCompareSelectRun")}</option>
            {experiments.map((run) => (
              <option key={`b-${run.id}`} value={run.id}>
                {run.title} {t("experimentCompareVersionPrefix")}{run.version ?? 1}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="control-row" style={{ marginTop: "8px" }}>
        <button type="button" className="tab" onClick={() => cloneRun(runA)}>
          {t("experimentCompareCloneA")}
        </button>
        <button type="button" className="tab" onClick={() => cloneRun(runB)}>
          {t("experimentCompareCloneB")}
        </button>
        {status ? <span className="pill">{status}</span> : null}
      </div>
      <div className="demo-output" style={{ marginTop: "12px" }}>
        {!runA || !runB ? (
          <div className="demo-note">{t("experimentCompareSelectTwo")}</div>
        ) : (
          <div className="inline-kv">
            {deltas.length === 0 ? <span className="pill">{t("experimentCompareNoDeltas")}</span> : null}
            {deltas.map((item) => (
              <span key={item.key} className="pill">
                {t("experimentCompareDelta")} {item.key} = {item.value.toFixed(4)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
