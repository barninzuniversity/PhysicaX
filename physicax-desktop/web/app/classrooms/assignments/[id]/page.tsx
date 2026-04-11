"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "../../../components/LocaleProvider";

type Submission = {
  id: string;
  payload: string;
  score?: number | null;
  createdAt: string;
  user?: { name?: string | null; email?: string | null } | null;
};

type Assignment = {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  submissions: Submission[];
};

export default function AssignmentDetailPage() {
  const { t } = useLocale();
  const params = useParams();
  const assignmentId = useMemo(() => {
    const raw = params?.id;
    if (!raw) return "";
    return Array.isArray(raw) ? raw[0] ?? "" : String(raw);
  }, [params]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({});

  const load = async (id: string) => {
    setStatus(null);
    try {
      const res = await fetch(`/api/assignments/${id}`);
      if (!res.ok) {
        setStatus(t("assignmentLoadError"));
        return;
      }
      const data = await res.json();
      setAssignment(data);
      const drafts: Record<string, string> = {};
      (data.submissions || []).forEach((item: Submission) => {
        drafts[item.id] = typeof item.score === "number" ? String(item.score) : "";
      });
      setScoreDrafts(drafts);
    } catch {
      setStatus(t("assignmentLoadError"));
    }
  };

  useEffect(() => {
    if (!assignmentId) return;
    load(assignmentId);
  }, [assignmentId]);

  const updateScore = async (id: string) => {
    const raw = scoreDrafts[id];
    const score = raw === "" ? null : Number(raw);
    if (raw !== "" && !Number.isFinite(score)) {
      setStatus(t("assignmentScoreNumeric"));
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
        setAssignment((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            submissions: prev.submissions.map((item) => (item.id === id ? { ...item, score: updated.score } : item))
          };
        });
        setStatus(t("assignmentScoreSaved"));
      } else {
        setStatus(t("assignmentScoreError"));
      }
    } catch {
      setStatus(t("assignmentScoreError"));
    }
  };

  return (
    <>
      <section className="section reveal">
        <h2>{t("assignmentDetailTitle")}</h2>
        <p>
          {t("assignmentDetailIntro")}{" "}
          <Link href="/classrooms">{t("assignmentDetailBack")}</Link>
        </p>
      </section>
      <section className="section reveal">
        {status ? <div className="pill">{status}</div> : null}
        {!assignment ? <div className="demo-note">{t("assignmentLoading")}</div> : null}
        {assignment ? (
          <div className="demo-panel">
            <div className="demo-title">{assignment.title}</div>
            <div className="result-summary">{assignment.description}</div>
            {assignment.dueDate ? (
              <div className="result-tags">
                {t("assignmentDue")} {new Date(assignment.dueDate).toLocaleDateString()}
              </div>
            ) : null}
            <div className="saved-runs">
              {assignment.submissions.length === 0 ? <div className="demo-note">{t("assignmentNoSubmissions")}</div> : null}
              {assignment.submissions.map((submission) => (
                <div key={submission.id} className="result-card">
                  <div className="result-title">{t("assignmentSubmissionTitle")}</div>
                  <div className="result-summary">
                    {t("assignmentStudent")} {submission.user?.name ?? submission.user?.email ?? t("assignmentStudentFallback")}
                  </div>
                  <div className="result-summary">{t("assignmentPayload")} {submission.payload}</div>
                  <div className="result-tags">{new Date(submission.createdAt).toLocaleString()}</div>
                  <div className="demo-grid" style={{ marginTop: "8px" }}>
                    <label className="field">
                      <span>{t("assignmentScore")}</span>
                      <input
                        type="number"
                        value={scoreDrafts[submission.id] ?? ""}
                        onChange={(event) =>
                          setScoreDrafts((prev) => ({ ...prev, [submission.id]: event.target.value }))
                        }
                      />
                    </label>
                    <button type="button" className="control-button" onClick={() => updateScore(submission.id)}>
                      {t("assignmentScoreSave")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
