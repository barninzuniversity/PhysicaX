"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Challenge = {
  id: string;
  title: string;
  prompt: string;
  difficulty: string;
  answerType: string;
  expected?: string | null;
  createdAt?: string;
};

type Assignment = {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  createdAt?: string;
};

type Classroom = {
  id: string;
  name: string;
  description?: string | null;
};

export function ClassroomDashboard() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [className, setClassName] = useState("Physics 101");
  const [classDesc, setClassDesc] = useState("Intro mechanics section");
  const { t } = useLocale();

  const load = async () => {
    try {
      const [cRes, aRes, clRes] = await Promise.all([
        fetch("/api/challenges"),
        fetch("/api/assignments"),
        fetch("/api/classrooms")
      ]);
      if (cRes.ok) setChallenges(await cRes.json());
      if (aRes.ok) setAssignments(await aRes.json());
      if (clRes.ok) setClassrooms(await clRes.json());
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createClassroom = async () => {
    const res = await fetch("/api/classrooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: className, description: classDesc })
    });
    if (res.ok) {
      setClassName("Physics 101");
      setClassDesc("Intro mechanics section");
      await load();
    }
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("classroomDashboardTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("classroomDashboardNew")}</span>
          <input type="text" value={className} onChange={(event) => setClassName(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("classroomDashboardDescription")}</span>
          <input type="text" value={classDesc} onChange={(event) => setClassDesc(event.target.value)} />
        </label>
      </div>
      <div className="control-row">
        <button type="button" className="control-button" onClick={createClassroom}>
          {t("classroomDashboardCreate")}
        </button>
      </div>
      <div className="saved-runs">
        <div className="demo-title">{t("classroomDashboardActive")}</div>
        {classrooms.length === 0 ? <div className="demo-note">{t("classroomDashboardEmpty")}</div> : null}
        {classrooms.map((room) => (
          <div key={room.id} className="result-card">
            <div className="result-title">{room.name}</div>
            <div className="result-summary">{room.description}</div>
          </div>
        ))}
      </div>
      <div className="saved-runs">
        <div className="demo-title">{t("classroomDashboardChallenges")}</div>
        {challenges.length === 0 ? <div className="demo-note">{t("classroomDashboardNoChallenges")}</div> : null}
        {challenges.map((challenge) => (
          <div key={challenge.id} className="result-card">
            <div className="result-title">{challenge.title}</div>
            <div className="result-summary">{challenge.prompt}</div>
            <div className="result-tags">{challenge.difficulty}</div>
          </div>
        ))}
      </div>
      <div className="saved-runs">
        <div className="demo-title">{t("classroomDashboardAssignments")}</div>
        {assignments.length === 0 ? <div className="demo-note">{t("classroomDashboardNoAssignments")}</div> : null}
        {assignments.map((assignment) => (
          <div key={assignment.id} className="result-card">
            <div className="result-title">{assignment.title}</div>
            <div className="result-summary">{assignment.description}</div>
            {assignment.dueDate ? <div className="result-tags">{t("classroomDashboardDue")} {new Date(assignment.dueDate).toLocaleDateString()}</div> : null}
            <div className="result-tags">
              <a href={`/classrooms/assignments/${assignment.id}`}>{t("classroomDashboardOpenAssignment")}</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
