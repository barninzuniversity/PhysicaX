"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Classroom = {
  id: string;
  name: string;
  description?: string | null;
  members?: { id: string; role: string }[];
};

export function ClassroomRoster() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [joinId, setJoinId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const { t } = useLocale();

  const load = async () => {
    try {
      const res = await fetch("/api/classrooms");
      if (res.ok) {
        const data = await res.json();
        setClassrooms(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
  }, []);

  const join = async () => {
    if (!joinId) return;
    setStatus(null);
    try {
      const res = await fetch("/api/classrooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classroomId: joinId })
      });
      if (res.ok) {
        setStatus(t("classroomRosterJoined"));
        setJoinId("");
        await load();
      } else {
        setStatus(t("classroomRosterJoinError"));
      }
    } catch {
      setStatus(t("classroomRosterJoinError"));
    }
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("classroomRosterTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("classroomRosterId")}</span>
          <input type="text" value={joinId} onChange={(event) => setJoinId(event.target.value)} />
        </label>
      </div>
      <div className="control-row">
        <button type="button" className="control-button" onClick={join}>
          {t("classroomRosterJoin")}
        </button>
        {status ? <span className="pill">{status}</span> : null}
      </div>
      <div className="saved-runs">
        <div className="demo-title">{t("classroomRosterAvailable")}</div>
        {classrooms.length === 0 ? <div className="demo-note">{t("classroomRosterEmpty")}</div> : null}
        {classrooms.map((room) => (
          <div key={room.id} className="result-card">
            <div className="result-title">{room.name}</div>
            <div className="result-summary">{room.description}</div>
            <div className="result-tags">{t("classroomRosterIdLabel")} {room.id}</div>
            <div className="result-tags">{t("classroomRosterMembers")} {room.members?.length ?? 0}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
