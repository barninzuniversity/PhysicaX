"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "./LocaleProvider";

type Challenge = {
  id: string;
  title: string;
  prompt: string;
  difficulty: string;
  answerType: string;
  expected?: string | null;
  hint?: string | null;
  set?: { id: string; title: string } | null;
};

type Progress = {
  id: string;
  attempts: number;
  bestScore?: number | null;
  completed: boolean;
  completedAt?: string | null;
  challenge: Challenge;
};

type Badge = {
  id: string;
  awardedAt: string;
  badge: {
    key: string;
    title: string;
    description?: string | null;
  };
};

const defaultTolerance = 0.05;

const normalize = (value: string) => value.trim().toLowerCase();

const parseNumbers = (value: string) => {
  const matches = value.match(/-?\d+(?:\.\d+)?/g);
  return matches ? matches.map((item) => Number(item)) : [];
};

const parseNumericExpected = (value: string) => {
  const parts = value.split("|");
  const expectedPart = parts[0].trim();
  const nums = parseNumbers(expectedPart);
  const expected = nums.length ? nums[0] : NaN;
  let tolerance = defaultTolerance;
  const tolMatch = value.match(/tol\s*=\s*([0-9.]+)/i);
  if (tolMatch) {
    tolerance = Number(tolMatch[1]);
  } else if (value.includes("+-") || value.includes("±")) {
    const tolNums = parseNumbers(value);
    if (tolNums.length >= 2) {
      tolerance = Math.abs(tolNums[1]);
    }
  }
  return { expected, tolerance };
};

const parseRangeExpected = (value: string) => {
  const nums = parseNumbers(value);
  if (nums.length >= 2) {
    return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
  }
  return { min: NaN, max: NaN };
};

const parseChoiceExpected = (value: string) => {
  const [choicesPart, metaPart] = value.split(";");
  const choices = choicesPart
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
  let correct = "";
  const correctMatch = metaPart?.match(/correct\s*=\s*([A-Za-z0-9]+)/);
  if (correctMatch) {
    correct = correctMatch[1];
  } else {
    const starred = choices.find((item) => item.startsWith("*"));
    if (starred) {
      correct = starred.replace("*", "");
    }
  }
  return { choices: choices.map((item) => item.replace("*", "")), correct };
};

const gradeNumeric = (answer: number, expected: number, tolerance: number) => {
  if (!Number.isFinite(answer) || !Number.isFinite(expected)) return false;
  const diff = Math.abs(answer - expected);
  const tol = Math.max(tolerance, Math.abs(expected) * 0.02);
  return diff <= tol;
};

export function ChallengeRunner() {
  const [items, setItems] = useState<Challenge[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [progressNote, setProgressNote] = useState<string | null>(null);
  const [choiceAnswer, setChoiceAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [setFilter, setSetFilter] = useState("");
  const { t } = useLocale();

  const filteredItems = useMemo(() => {
    if (!setFilter) return items;
    return items.filter((item) => item.set?.id === setFilter);
  }, [items, setFilter]);

  const selected = useMemo(
    () => filteredItems.find((item) => item.id === selectedId) ?? filteredItems[0],
    [filteredItems, selectedId]
  );

  const load = async () => {
    setLoading(true);
    try {
      const [res, progressRes, badgeRes] = await Promise.all([
        fetch("/api/challenges"),
        fetch("/api/challenge-progress"),
        fetch("/api/badges")
      ]);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      }
      if (progressRes.ok) {
        setProgress(await progressRes.json());
      }
      if (badgeRes.ok) {
        setBadges(await badgeRes.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setAnswer("");
    setFeedback(null);
    setChoiceAnswer("");
    setShowHint(false);
  }, [selectedId]);

  const check = () => {
    if (!selected) return;
    setProgressNote(null);
    if (!selected.expected) {
      setFeedback(t("challengeRunnerNoReference"));
      return;
    }
    if (selected.answerType === "numeric") {
      const { expected, tolerance } = parseNumericExpected(selected.expected);
      const answerValue = Number(answer);
      if (!Number.isFinite(answerValue)) {
        setFeedback(t("challengeRunnerEnterNumeric"));
        return;
      }
      const isCorrect = gradeNumeric(answerValue, expected, tolerance);
      setFeedback(isCorrect ? t("challengeRunnerCorrectTolerance") : t("challengeRunnerIncorrectNumeric"));
      void recordProgress(isCorrect);
      return;
    }
    if (selected.answerType === "range") {
      const { min, max } = parseRangeExpected(selected.expected);
      const answerValue = Number(answer);
      if (!Number.isFinite(answerValue) || !Number.isFinite(min) || !Number.isFinite(max)) {
        setFeedback(t("challengeRunnerEnterRange"));
        return;
      }
      const isCorrect = answerValue >= min && answerValue <= max;
      setFeedback(isCorrect ? t("challengeRunnerWithinRange") : t("challengeRunnerOutOfRange"));
      void recordProgress(isCorrect);
      return;
    }
    if (selected.answerType === "multiple choice") {
      const { correct } = parseChoiceExpected(selected.expected);
      const candidate = choiceAnswer || answer;
      const isCorrect = normalize(candidate) === normalize(correct);
      setFeedback(isCorrect ? t("challengeRunnerCorrectChoice") : t("challengeRunnerIncorrectChoice"));
      void recordProgress(isCorrect);
      return;
    }
    const correct = normalize(answer) === normalize(selected.expected);
    setFeedback(correct ? t("challengeRunnerCorrect") : t("challengeRunnerTryAgain"));
    void recordProgress(correct);
  };

  const recordProgress = async (correct: boolean) => {
    if (!selected) return;
    try {
      const res = await fetch("/api/challenge-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: selected.id, correct, score: correct ? 1 : 0 })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.progress) {
          setProgress((prev) => {
            const next = prev.filter((item) => item.challenge.id !== selected.id);
            return [{ ...data.progress, challenge: selected }, ...next];
          });
        }
        const badgeRes = await fetch("/api/badges");
        if (badgeRes.ok) {
          setBadges(await badgeRes.json());
        }
        if (data.completedCount !== undefined) {
          setProgressNote(`${t("challengeRunnerCompletedLabel")} ${data.completedCount}`);
        }
      }
    } catch {
      // ignore
    }
  };

  const selectedProgress = useMemo(
    () => progress.find((item) => item.challenge.id === selected?.id),
    [progress, selected]
  );

  const choiceData = useMemo(() => {
    if (!selected || selected.answerType !== "multiple choice" || !selected.expected) {
      return { choices: [], correct: "" };
    }
    return parseChoiceExpected(selected.expected);
  }, [selected]);

  if (loading) {
    return <div className="demo-note">{t("challengeRunnerLoading")}</div>;
  }

  if (items.length === 0) {
    return <div className="demo-note">{t("challengeRunnerEmpty")}</div>;
  }

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("challengeRunnerTitle")}</div>
      <div className="inline-kv" style={{ marginBottom: "8px" }}>
        {badges.length === 0 ? <span className="pill">{t("challengeRunnerNoBadges")}</span> : null}
        {badges.map((badge) => (
          <span key={badge.id} className="pill">
            {badge.badge.title}
          </span>
        ))}
      </div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("challengeRunnerSelect")}</span>
          <select
            value={selected?.id ?? ""}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {filteredItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.difficulty})
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t("challengeRunnerFilterSet")}</span>
          <select value={setFilter} onChange={(event) => setSetFilter(event.target.value)}>
            <option value="">{t("challengeRunnerAllSets")}</option>
            {Array.from(new Set(items.map((item) => item.set?.id).filter(Boolean))).map((id) => {
              const setTitle = items.find((item) => item.set?.id === id)?.set?.title ?? t("challengeRunnerSetFallback");
              return (
                <option key={id as string} value={id as string}>
                  {setTitle}
                </option>
              );
            })}
          </select>
        </label>
        <div className="metric-card">
          <div className="metric-title">{t("challengeRunnerPrompt")}</div>
          <div className="metric-value" style={{ fontSize: "0.95rem" }}>
            {selected?.prompt}
          </div>
          {selected?.set ? <div className="metric-meta">{t("challengeRunnerSetLabel")} {selected.set.title}</div> : null}
        </div>
      </div>
      <div className="demo-grid" style={{ marginTop: "12px" }}>
        {selected?.answerType === "multiple choice" && choiceData.choices.length ? (
          <div className="field">
            <span>{t("challengeRunnerChoiceAnswer")}</span>
            <div className="control-row" style={{ marginTop: "6px", flexWrap: "wrap" }}>
              {choiceData.choices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={`control-chip ${choiceAnswer === choice ? "active" : ""}`}
                  onClick={() => setChoiceAnswer(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <label className="field">
            <span>{t("challengeRunnerAnswer")} ({selected?.answerType})</span>
            <input
              type={selected?.answerType === "numeric" || selected?.answerType === "range" ? "number" : "text"}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
            />
          </label>
        )}
        <div className="metric-card">
          <div className="metric-title">{t("challengeRunnerDifficulty")}</div>
          <div className="metric-value">{selected?.difficulty}</div>
          <div className="metric-meta">{t("challengeRunnerType")} {selected?.answerType}</div>
          {selectedProgress ? (
            <div className="metric-meta">
              {t("challengeRunnerAttempts")} {selectedProgress.attempts} {selectedProgress.completed ? `(${t("challengeRunnerCompleted")})` : ""}
            </div>
          ) : null}
        </div>
      </div>
      <div className="control-row" style={{ marginTop: "12px" }}>
        <button type="button" className="control-button" onClick={check}>
          {t("challengeRunnerCheck")}
        </button>
        {selected?.hint ? (
          <button type="button" className="tab" onClick={() => setShowHint((prev) => !prev)}>
            {showHint ? t("challengeRunnerHideHint") : t("challengeRunnerShowHint")}
          </button>
        ) : null}
        {feedback ? <span className="pill">{feedback}</span> : null}
        {progressNote ? <span className="pill">{progressNote}</span> : null}
      </div>
      {showHint && selected?.hint ? (
        <div className="demo-note" style={{ marginTop: "8px" }}>
          {t("challengeRunnerHint")} {selected.hint}
        </div>
      ) : null}
    </div>
  );
}
