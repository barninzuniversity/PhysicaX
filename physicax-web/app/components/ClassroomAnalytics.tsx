"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Assignment = {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
};

type Submission = {
  id: string;
  assignmentId: string;
  score?: number | null;
  createdAt: string;
};

type Classroom = {
  id: string;
  name: string;
  description?: string | null;
  members?: { id: string }[];
};

export function ClassroomAnalytics() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const { t } = useLocale();

  const load = async () => {
    setStatus(null);
    try {
      const [aRes, sRes, cRes] = await Promise.all([
        fetch("/api/assignments"),
        fetch("/api/submissions"),
        fetch("/api/classrooms")
      ]);
      if (aRes.ok) setAssignments(await aRes.json());
      if (sRes.ok) setSubmissions(await sRes.json());
      if (cRes.ok) setClassrooms(await cRes.json());
    } catch {
      setStatus(t("classroomAnalyticsLoadError"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const scored = submissions.filter((item) => typeof item.score === "number");
  const avgScore = scored.length
    ? scored.reduce((sum, item) => sum + (item.score ?? 0), 0) / scored.length
    : 0;

  const perAssignment = useMemo(() => {
    const map = new Map<string, { count: number; avg: number }>();
    assignments.forEach((assignment) => {
      const subs = submissions.filter((item) => item.assignmentId === assignment.id);
      const scoredSubs = subs.filter((item) => typeof item.score === "number");
      const avg = scoredSubs.length
        ? scoredSubs.reduce((sum, item) => sum + (item.score ?? 0), 0) / scoredSubs.length
        : 0;
      map.set(assignment.id, { count: subs.length, avg });
    });
    return map;
  }, [assignments, submissions]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("classroomAnalyticsTitle")}</div>
      <div className="inline-kv">
        <span className="pill">{t("classroomAnalyticsClassrooms")} {classrooms.length}</span>
        <span className="pill">{t("classroomAnalyticsAssignments")} {assignments.length}</span>
        <span className="pill">{t("classroomAnalyticsSubmissions")} {submissions.length}</span>
        <span className="pill">{t("classroomAnalyticsAvgScore")} {avgScore.toFixed(2)}</span>
        <button type="button" className="tab" onClick={load}>
          {t("classroomAnalyticsRefresh")}
        </button>
        {status ? <span className="pill">{status}</span> : null}
      </div>
      <div className="result-grid" style={{ marginTop: "12px" }}>
        {assignments.length === 0 ? <div className="demo-note">{t("classroomAnalyticsEmpty")}</div> : null}
        {assignments.map((assignment) => {
          const stats = perAssignment.get(assignment.id);
          return (
            <div key={assignment.id} className="result-card">
              <div className="result-title">{assignment.title}</div>
              <div className="result-summary">{assignment.description}</div>
              <div className="result-summary">{t("classroomAnalyticsSubmissionCount")} {stats?.count ?? 0}</div>
              <div className="result-summary">{t("classroomAnalyticsAssignmentAvg")} {(stats?.avg ?? 0).toFixed(2)}</div>
              {assignment.dueDate ? <div className="result-tags">{t("classroomAnalyticsDue")} {new Date(assignment.dueDate).toLocaleDateString()}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
