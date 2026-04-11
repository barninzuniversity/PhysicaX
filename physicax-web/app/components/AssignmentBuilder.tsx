"use client";

import { useState } from "react";
import { useLocale } from "./LocaleProvider";

export function AssignmentBuilder() {
  const [title, setTitle] = useState("Projectile Motion Lab");
  const [due, setDue] = useState("2026-04-01");
  const [description, setDescription] = useState("Model a projectile with drag and compare range vs angle.");
  const [rubric, setRubric] = useState("Correct setup (40%), plot clarity (30%), interpretation (30%).");
  const [requirePlot, setRequirePlot] = useState(true);
  const [requireNotes, setRequireNotes] = useState(true);
  const [requireAnswer, setRequireAnswer] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const { t } = useLocale();

  const save = async () => {
    setStatus(null);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: `${description} (requirements: ${[
            requirePlot ? "plot" : "",
            requireNotes ? "notes" : "",
            requireAnswer ? "answer" : ""
          ]
            .filter(Boolean)
            .join(", ")})`,
          rubric,
          dueDate: due
        })
      });
      if (res.ok) {
        setStatus(t("assignmentBuilderSaved"));
      } else {
        setStatus(t("assignmentBuilderSaveError"));
      }
    } catch {
      setStatus(t("assignmentBuilderSaveError"));
    }
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("assignmentBuilderTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("assignmentBuilderTitleLabel")}</span>
          <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("assignmentBuilderDueDateLabel")}</span>
          <input type="date" value={due} onChange={(event) => setDue(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("assignmentBuilderDescriptionLabel")}</span>
          <input type="text" value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("assignmentBuilderRubricLabel")}</span>
          <input type="text" value={rubric} onChange={(event) => setRubric(event.target.value)} />
        </label>
      </div>
      <div className="control-row">
        <button type="button" className={`control-chip ${requirePlot ? "active" : ""}`} onClick={() => setRequirePlot((prev) => !prev)}>
          {t("assignmentBuilderRequirePlot")}
        </button>
        <button type="button" className={`control-chip ${requireNotes ? "active" : ""}`} onClick={() => setRequireNotes((prev) => !prev)}>
          {t("assignmentBuilderRequireNotes")}
        </button>
        <button type="button" className={`control-chip ${requireAnswer ? "active" : ""}`} onClick={() => setRequireAnswer((prev) => !prev)}>
          {t("assignmentBuilderRequireAnswer")}
        </button>
      </div>
      <div className="demo-output">
        <div className="metric-card">
          <strong>{title}</strong>
          <div>{t("assignmentBuilderDuePrefix")} {due}</div>
          <div>
            {t("assignmentBuilderIncludes")}
            {requirePlot ? ` ${t("assignmentBuilderIncludePlot")}` : ""}
            {requireNotes ? ` ${t("assignmentBuilderIncludeNotes")}` : ""}
            {requireAnswer ? ` ${t("assignmentBuilderIncludeAnswer")}` : ""}
          </div>
          <div>{t("assignmentBuilderRubricPrefix")} {rubric}</div>
        </div>
        <div className="control-row" style={{ marginTop: "8px" }}>
          <button type="button" className="control-button" onClick={save}>
            {t("assignmentBuilderSave")}
          </button>
          {status ? <span className="pill">{status}</span> : null}
        </div>
      </div>
    </div>
  );
}

