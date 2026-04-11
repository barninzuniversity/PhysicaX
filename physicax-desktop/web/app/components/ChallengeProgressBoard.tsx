"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Challenge = {
  id: string;
  title: string;
  difficulty: string;
  answerType: string;
};

type Progress = {
  id: string;
  attempts: number;
  bestScore?: number | null;
  completed: boolean;
  completedAt?: string | null;
  updatedAt?: string;
  challenge: Challenge;
};

export function ChallengeProgressBoard() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const { t } = useLocale();

  const load = async () => {
    setStatus(null);
    try {
      const [challengeRes, progressRes] = await Promise.all([
        fetch("/api/challenges"),
        fetch("/api/challenge-progress")
      ]);
      if (challengeRes.ok) {
        setChallenges(await challengeRes.json());
      }
      if (progressRes.ok) {
        setProgress(await progressRes.json());
      }
    } catch {
      setStatus(t("challengeProgressLoadError"));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const progressMap = useMemo(() => {
    const map = new Map<string, Progress>();
    progress.forEach((item) => map.set(item.challenge.id, item));
    return map;
  }, [progress]);

  const completedCount = progress.filter((item) => item.completed).length;
  const totalCount = challenges.length;
  const completionRate = totalCount ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("challengeProgressTitle")}</div>
      <div className="inline-kv">
        <span className="pill">{t("challengeProgressTotal")} {totalCount}</span>
        <span className="pill">{t("challengeProgressCompleted")} {completedCount}</span>
        <span className="pill">{t("challengeProgressRate")} {completionRate.toFixed(1)}%</span>
        <button type="button" className="tab" onClick={load}>
          {t("challengeProgressRefresh")}
        </button>
        {status ? <span className="pill">{status}</span> : null}
      </div>
      <div className="result-grid" style={{ marginTop: "12px" }}>
        {challenges.length === 0 ? <div className="demo-note">{t("challengeProgressEmpty")}</div> : null}
        {challenges.map((challenge) => {
          const entry = progressMap.get(challenge.id);
          return (
            <div key={challenge.id} className="result-card">
              <div className="result-title">{challenge.title}</div>
              <div className="result-summary">{t("challengeProgressDifficulty")} {challenge.difficulty}</div>
              <div className="result-summary">{t("challengeProgressAnswerType")} {challenge.answerType}</div>
              <div className="result-summary">
                {t("challengeProgressAttempts")} {entry ? entry.attempts : 0} | {t("challengeProgressCompletedLabel")} {entry?.completed ? t("challengeProgressYes") : t("challengeProgressNo")}
              </div>
              {typeof entry?.bestScore === "number" ? (
                <div className="result-tags">{t("challengeProgressBestScore")} {entry.bestScore}</div>
              ) : null}
              {entry?.completedAt ? (
                <div className="result-tags">{t("challengeProgressCompletedAt")} {new Date(entry.completedAt).toLocaleString()}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
