"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Submission = {
  id: string;
  payload: string;
  score?: number | null;
  createdAt: string;
  assignment?: { title: string; rubric?: string | null } | null;
  user?: { name?: string | null; email?: string | null } | null;
};

export function SubmissionBoard() {
  const [items, setItems] = useState<Submission[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({});
  const { t } = useLocale();

  const load = async () => {
    setStatus(null);
    try {
      const res = await fetch("/api/submissions");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        const nextDrafts: Record<string, string> = {};
        data.forEach((item: Submission) => {
          nextDrafts[item.id] = typeof item.score === "number" ? String(item.score) : "";
        });
        setScoreDrafts(nextDrafts);
      } else {
        setStatus(t("submissionBoardLoadError"));
      }
    } catch {
      setStatus(t("submissionBoardLoadError"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateScore = async (id: string) => {
    const raw = scoreDrafts[id];
    const score = raw === "" ? null : Number(raw);
    if (raw !== "" && !Number.isFinite(score)) {
      setStatus(t("submissionBoardScoreNumeric"));
      return;
    }
    setStatus(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, score })
      });
      if (res.ok) {
        const updated = await res.json();
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, score: updated.score } : item)));
        setStatus(t("submissionBoardScoreSaved"));
      } else {
        setStatus(t("submissionBoardScoreSaveError"));
      }
    } catch {
      setStatus(t("submissionBoardScoreSaveError"));
    }
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("submissionTrackerTitle")}</div>
      <div className="control-row">
        <button type="button" className="control-button" onClick={load}>
          {t("submissionBoardRefresh")}
        </button>
        {status ? <span className="pill">{status}</span> : null}
      </div>
      <div className="saved-runs">
        {items.length === 0 ? <div className="demo-note">{t("submissionBoardEmpty")}</div> : null}
        {items.map((item) => (
          <div key={item.id} className="result-card">
            <div className="result-title">{item.assignment?.title ?? t("submissionBoardAssignmentFallback")}</div>
            <div className="result-summary">
              {t("submissionBoardSubmittedBy")} {item.user?.name ?? item.user?.email ?? t("submissionBoardStudentFallback")}
            </div>
            <div className="result-summary">{t("submissionBoardPayload")} {item.payload}</div>
            {item.assignment?.rubric ? <div className="result-summary">{t("submissionBoardRubric")} {item.assignment.rubric}</div> : null}
            {typeof item.score === "number" ? <div className="result-tags">{t("submissionBoardScore")} {item.score}</div> : null}
            <div className="result-tags">{new Date(item.createdAt).toLocaleString()}</div>
            <div className="demo-grid" style={{ marginTop: "8px" }}>
              <label className="field">
                <span>{t("submissionBoardScoreLabel")}</span>
                <input
                  type="number"
                  value={scoreDrafts[item.id] ?? ""}
                  onChange={(event) => setScoreDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))}
                />
              </label>
              <button type="button" className="control-button" onClick={() => updateScore(item.id)}>
                {t("submissionBoardSaveScore")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
