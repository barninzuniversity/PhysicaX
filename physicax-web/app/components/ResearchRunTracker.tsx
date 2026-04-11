"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

type ResearchRun = {
  id: string;
  title: string;
  model: string;
  params: Record<string, unknown>;
  results: Record<string, unknown>;
  status: string;
  createdAt?: string;
};

export function ResearchRunTracker() {
  const [runs, setRuns] = useState<ResearchRun[]>([]);
  const [title, setTitle] = useState("Sweep run");
  const [model, setModel] = useState("logistic");
  const [params, setParams] = useState('{"rRange":[2.5,4],"x0":0.2}');
  const [results, setResults] = useState('{"summary":"ready"}');
  const [status, setStatus] = useState<string | null>(null);
  const { t } = useLocale();

  const load = async () => {
    try {
      const res = await fetch("/api/research");
      if (res.ok) {
        const data = await res.json();
        setRuns(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    let paramsObj: Record<string, unknown> = {};
    let resultsObj: Record<string, unknown> = {};
    try {
      paramsObj = JSON.parse(params);
      resultsObj = JSON.parse(results);
    } catch {
      return;
    }
    const res = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, model, params: paramsObj, results: resultsObj })
    });
    if (res.ok) {
      setTitle("Sweep run");
      await load();
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(runs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "physicax-research-runs.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const header = ["title", "model", "status", "createdAt", "params", "results"];
    const rows = runs.map((run) => [
      run.title,
      run.model,
      run.status,
      run.createdAt ?? "",
      JSON.stringify(run.params ?? {}),
      JSON.stringify(run.results ?? {})
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/\"/g, "\"\"")}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "physicax-research-runs.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const sendToNotebook = async (run: ResearchRun) => {
    setStatus(null);
    try {
      const contentText = [
        `Run: ${run.title}`,
        `Model: ${run.model}`,
        `Status: ${run.status}`,
        `Params: ${JSON.stringify(run.params)}`,
        `Results: ${JSON.stringify(run.results)}`
      ].join("\n");
      const res = await fetch("/api/notebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Research Note - ${run.title}`,
          content: contentText
        })
      });
      if (res.ok) {
        setStatus(t("researchRunsNotebookCreated"));
      } else {
        setStatus(t("researchRunsNotebookError"));
      }
    } catch {
      setStatus(t("researchRunsNotebookError"));
    }
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("researchRunsTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("researchRunsTitleLabel")}</span>
          <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("researchRunsModelLabel")}</span>
          <input type="text" value={model} onChange={(event) => setModel(event.target.value)} />
        </label>
      </div>
      <label className="field" style={{ marginTop: "12px" }}>
        <span>{t("researchRunsParamsLabel")}</span>
        <textarea value={params} onChange={(event) => setParams(event.target.value)} rows={3} />
      </label>
      <label className="field" style={{ marginTop: "12px" }}>
        <span>{t("researchRunsResultsLabel")}</span>
        <textarea value={results} onChange={(event) => setResults(event.target.value)} rows={3} />
      </label>
      <div className="control-row" style={{ marginTop: "8px" }}>
        <button type="button" className="control-button" onClick={save}>
          {t("researchRunsSave")}
        </button>
        <button type="button" className="tab" onClick={exportJson}>
          {t("researchRunsExportJson")}
        </button>
        <button type="button" className="tab" onClick={exportCsv}>
          {t("researchRunsExportCsv")}
        </button>
        {status ? <span className="pill">{status}</span> : null}
      </div>
      <div className="saved-runs">
        {runs.length === 0 ? <div className="demo-note">{t("researchRunsEmpty")}</div> : null}
        {runs.map((run) => (
          <div key={run.id} className="result-card">
            <div className="result-title">{run.title}</div>
            <div className="result-summary">{t("researchRunsModelPrefix")} {run.model}</div>
            <div className="result-summary">{t("researchRunsStatusPrefix")} {run.status}</div>
            <div className="result-summary">{t("researchRunsParamsPrefix")} {JSON.stringify(run.params)}</div>
            <div className="result-summary">{t("researchRunsResultsPrefix")} {JSON.stringify(run.results)}</div>
            <div className="result-tags">{run.createdAt ? new Date(run.createdAt).toLocaleString() : ""}</div>
            <div className="control-row" style={{ marginTop: "6px" }}>
              <button type="button" className="tab" onClick={() => sendToNotebook(run)}>
                {t("researchRunsAddToNotebook")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
