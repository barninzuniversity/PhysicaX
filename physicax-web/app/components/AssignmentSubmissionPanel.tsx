"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Assignment = {
  id: string;
  title: string;
  description?: string | null;
  rubric?: string | null;
  dueDate?: string | null;
};

export function AssignmentSubmissionPanel() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [answer, setAnswer] = useState("");
  const [notes, setNotes] = useState("");
  const [experimentId, setExperimentId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const { t } = useLocale();

  const load = async () => {
    try {
      const res = await fetch("/api/assignments");
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selected = assignments.find((item) => item.id === selectedId) ?? null;

  const submit = async () => {
    if (!selectedId) return;
    setStatus(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: selectedId,
          payload: {
            answer,
            notes,
            experimentId
          }
        })
      });
      if (res.ok) {
        setStatus(t("assignmentSubmissionSubmitted"));
        setAnswer("");
        setNotes("");
        setExperimentId("");
      } else {
        setStatus(t("assignmentSubmissionFailed"));
      }
    } catch {
      setStatus(t("assignmentSubmissionFailed"));
    }
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("assignmentSubmissionTitle")}</div>
      {assignments.length === 0 ? <div className="demo-note">{t("assignmentSubmissionEmpty")}</div> : null}
      {selected ? (
        <div className="demo-output">
          <div className="result-title">{selected.title}</div>
          {selected.description ? <div className="result-summary">{selected.description}</div> : null}
          {selected.rubric ? <div className="result-summary">{t("assignmentSubmissionRubric")} {selected.rubric}</div> : null}
          {selected.dueDate ? <div className="result-tags">{t("assignmentSubmissionDue")} {new Date(selected.dueDate).toLocaleDateString()}</div> : null}
        </div>
      ) : null}
      <div className="demo-grid">
        <label className="field">
          <span>{t("assignmentSubmissionAssignment")}</span>
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {assignments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t("assignmentSubmissionAnswer")}</span>
          <input type="text" value={answer} onChange={(event) => setAnswer(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("assignmentSubmissionExperiment")}</span>
          <input type="text" value={experimentId} onChange={(event) => setExperimentId(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("assignmentSubmissionNotes")}</span>
          <input type="text" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
      </div>
      <div className="control-row">
        <button type="button" className="control-button" onClick={submit}>
          {t("assignmentSubmissionSubmit")}
        </button>
        {status ? <span className="pill">{status}</span> : null}
      </div>
    </div>
  );
}
