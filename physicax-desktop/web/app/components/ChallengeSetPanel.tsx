"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Challenge = {
  id: string;
  title: string;
  difficulty: string;
};

type ChallengeSet = {
  id: string;
  title: string;
  description?: string | null;
  challenges: Challenge[];
};

export function ChallengeSetPanel() {
  const [sets, setSets] = useState<ChallengeSet[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const { t } = useLocale();

  const load = async () => {
    setStatus(null);
    try {
      const res = await fetch("/api/challenge-sets");
      if (res.ok) {
        setSets(await res.json());
      } else {
        setStatus(t("challengeSetsLoadError"));
      }
    } catch {
      setStatus(t("challengeSetsLoadError"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("challengeSetsTitle")}</div>
      <div className="control-row">
        <button type="button" className="control-button" onClick={load}>
          {t("challengeSetsRefresh")}
        </button>
        {status ? <span className="pill">{status}</span> : null}
      </div>
      <div className="result-grid" style={{ marginTop: "12px" }}>
        {sets.length === 0 ? <div className="demo-note">{t("challengeSetsEmpty")}</div> : null}
        {sets.map((set) => (
          <div key={set.id} className="result-card">
            <div className="result-title">{set.title}</div>
            <div className="result-summary">{set.description}</div>
            <div className="result-tags">{t("challengeSetsCount")} {set.challenges.length}</div>
            <div className="saved-runs">
              {set.challenges.map((challenge) => (
                <div key={challenge.id} className="result-card" style={{ marginTop: "6px" }}>
                  <div className="result-summary">{challenge.title}</div>
                  <div className="result-tags">{challenge.difficulty}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
