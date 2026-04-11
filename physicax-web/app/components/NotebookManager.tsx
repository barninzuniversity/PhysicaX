"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { MathBlock } from "./MathBlock";

type Notebook = {
  id: string;
  title: string;
  content: string;
  links?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Experiment = {
  id: string;
  title: string;
  model: string;
};

export function NotebookManager() {
  const [title, setTitle] = useState("New Research Note");
  const [content, setContent] = useState("Summary, equations, and observations...");
  const [equation, setEquation] = useState("\\nabla \\cdot \\vec{u} = 0");
  const [linkedIds, setLinkedIds] = useState<string[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const { t } = useLocale();

  const load = async () => {
    try {
      const [noteRes, expRes] = await Promise.all([
        fetch("/api/notebooks"),
        fetch("/api/experiments")
      ]);
      if (noteRes.ok) {
        const data = await noteRes.json();
        setNotebooks(data);
      }
      if (expRes.ok) {
        setExperiments(await expRes.json());
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setStatus(null);
    const finalContent = equation.trim() ? `${content}\n\nEquation:\n${equation}` : content;
    try {
      const res = await fetch("/api/notebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: finalContent, links: linkedIds })
      });
      if (res.ok) {
        const saved = await res.json();
        setNotebooks((prev) => [saved, ...prev]);
        setLinkedIds([]);
        setStatus(t("notebookManagerSaved"));
        return;
      }
    } catch {
      // ignore
    }
    setStatus(t("notebookManagerSaveError"));
  };

  const toggleLink = (id: string) => {
    setLinkedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("notebookManagerTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("notebookManagerTitleLabel")}</span>
          <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("notebookManagerContentLabel")}</span>
          <textarea rows={4} value={content} onChange={(event) => setContent(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("notebookManagerEquationLabel")}</span>
          <input type="text" value={equation} onChange={(event) => setEquation(event.target.value)} />
        </label>
      </div>
      {equation.trim() ? (
        <div className="demo-output">
          <div className="demo-note">{t("notebookManagerEquationPreview")}</div>
          <MathBlock latex={equation} />
        </div>
      ) : null}
      <div className="demo-output" style={{ marginTop: "12px" }}>
        <div className="demo-title">{t("notebookManagerLinkExperiments")}</div>
        {experiments.length === 0 ? <div className="demo-note">{t("notebookManagerNoExperiments")}</div> : null}
        <div className="result-grid">
          {experiments.map((exp) => (
            <button
              key={exp.id}
              type="button"
              className={`control-chip ${linkedIds.includes(exp.id) ? "active" : ""}`}
              onClick={() => toggleLink(exp.id)}
            >
              {exp.title} ({exp.model})
            </button>
          ))}
        </div>
        {linkedIds.length ? (
          <div className="inline-kv" style={{ marginTop: "8px" }}>
            <span className="pill">{t("notebookManagerLinkedCount")} {linkedIds.length}</span>
            <span className="pill">{t("notebookManagerLinkedIds")} {linkedIds.join(", ")}</span>
          </div>
        ) : null}
      </div>
      <div className="control-row" style={{ marginTop: "10px" }}>
        <button type="button" className="control-button" onClick={save}>
          {t("notebookManagerSave")}
        </button>
        {status ? <span className="pill">{status}</span> : null}
      </div>
      <div className="saved-runs" style={{ marginTop: "16px" }}>
        <div className="demo-title">{t("notebookManagerSavedNotes")}</div>
        {notebooks.length === 0 ? <div className="demo-note">{t("notebookManagerEmpty")}</div> : null}
        {notebooks.map((note) => (
          <div key={note.id} className="result-card">
            <div className="result-title">{note.title}</div>
            <div className="result-summary">{note.content.slice(0, 140)}{note.content.length > 140 ? "..." : ""}</div>
            {note.links ? <div className="result-tags">{t("notebookManagerLinks")} {note.links}</div> : null}
            <div className="result-tags">{t("notebookManagerUpdated")} {new Date(note.updatedAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
