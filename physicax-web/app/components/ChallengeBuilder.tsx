"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

export function ChallengeBuilder() {
  const [lab, setLab] = useState("ThermoLab");
  const [model, setModel] = useState("Ideal Gas");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [prompt, setPrompt] = useState("Predict the pressure when volume doubles at constant temperature.");
  const [answerType, setAnswerType] = useState("Numeric");
  const [title, setTitle] = useState("Ideal Gas Prediction");
  const [expected, setExpected] = useState("2");
  const [tolerance, setTolerance] = useState("0.05");
  const [rangeMin, setRangeMin] = useState("1.9");
  const [rangeMax, setRangeMax] = useState("2.1");
  const [choices, setChoices] = useState("A|B|C|D");
  const [correctChoice, setCorrectChoice] = useState("B");
  const [hint, setHint] = useState("Use PV = nRT with constant temperature.");
  const [sets, setSets] = useState<{ id: string; title: string }[]>([]);
  const [setId, setSetId] = useState("");
  const [newSetTitle, setNewSetTitle] = useState("");
  const [newSetDesc, setNewSetDesc] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const { t } = useLocale();

  const expectedPayload = () => {
    const type = answerType.toLowerCase();
    if (type === "numeric") {
      return `${expected}|tol=${tolerance}`;
    }
    if (type === "range") {
      return `${rangeMin},${rangeMax}`;
    }
    if (type === "multiple choice") {
      return `${choices};correct=${correctChoice}`;
    }
    return expected;
  };

  useEffect(() => {
    const loadSets = async () => {
      try {
        const res = await fetch("/api/challenge-sets");
        if (res.ok) {
          const data = await res.json();
          setSets(data);
          if (data.length && !setId) {
            setSetId(data[0].id);
          }
        }
      } catch {
        // ignore
      }
    };
    loadSets();
  }, [setId]);

  const createSet = async () => {
    const titleText = newSetTitle.trim();
    if (!titleText) return;
    try {
      const res = await fetch("/api/challenge-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleText, description: newSetDesc })
      });
      if (res.ok) {
        const saved = await res.json();
        setSets((prev) => [saved, ...prev]);
        setSetId(saved.id);
        setNewSetTitle("");
        setNewSetDesc("");
      }
    } catch {
      // ignore
    }
  };

  const save = async () => {
    setStatus(null);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          prompt: `${lab} - ${model}: ${prompt}`,
          difficulty: difficulty.toLowerCase(),
          answerType: answerType.toLowerCase(),
          expected: expectedPayload(),
          hint,
          setId: setId || null
        })
      });
      if (res.ok) {
        setStatus(t("challengeBuilderSaved"));
      } else {
        setStatus(t("challengeBuilderSaveError"));
      }
    } catch {
      setStatus(t("challengeBuilderSaveError"));
    }
  };

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("challengeBuilderTitle")}</div>
      <div className="demo-grid">
        <label className="field">
          <span>{t("challengeBuilderTitleLabel")}</span>
          <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("challengeBuilderLab")}</span>
          <input type="text" value={lab} onChange={(event) => setLab(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("challengeBuilderModel")}</span>
          <input type="text" value={model} onChange={(event) => setModel(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("challengeBuilderDifficulty")}</span>
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option>{t("challengeBuilderBeginner")}</option>
            <option>{t("challengeBuilderIntermediate")}</option>
            <option>{t("challengeBuilderAdvanced")}</option>
          </select>
        </label>
        <label className="field">
          <span>{t("challengeBuilderAnswerType")}</span>
          <select value={answerType} onChange={(event) => setAnswerType(event.target.value)}>
            <option>{t("challengeBuilderNumeric")}</option>
            <option>{t("challengeBuilderRange")}</option>
            <option>{t("challengeBuilderMultipleChoice")}</option>
            <option>{t("challengeBuilderFreeText")}</option>
          </select>
        </label>
        <label className="field">
          <span>{t("challengeBuilderPrompt")}</span>
          <input type="text" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("challengeBuilderHint")}</span>
          <input type="text" value={hint} onChange={(event) => setHint(event.target.value)} />
        </label>
        {answerType === "Numeric" ? (
          <>
            <label className="field">
              <span>{t("challengeBuilderExpectedValue")}</span>
              <input type="text" value={expected} onChange={(event) => setExpected(event.target.value)} />
            </label>
            <label className="field">
              <span>{t("challengeBuilderTolerance")}</span>
              <input type="text" value={tolerance} onChange={(event) => setTolerance(event.target.value)} />
            </label>
          </>
        ) : null}
        {answerType === "Range" ? (
          <>
            <label className="field">
              <span>{t("challengeBuilderRangeMin")}</span>
              <input type="text" value={rangeMin} onChange={(event) => setRangeMin(event.target.value)} />
            </label>
            <label className="field">
              <span>{t("challengeBuilderRangeMax")}</span>
              <input type="text" value={rangeMax} onChange={(event) => setRangeMax(event.target.value)} />
            </label>
          </>
        ) : null}
        {answerType === "Multiple Choice" ? (
          <>
            <label className="field">
              <span>{t("challengeBuilderChoices")}</span>
              <input type="text" value={choices} onChange={(event) => setChoices(event.target.value)} />
            </label>
            <label className="field">
              <span>{t("challengeBuilderCorrectChoice")}</span>
              <input type="text" value={correctChoice} onChange={(event) => setCorrectChoice(event.target.value)} />
            </label>
          </>
        ) : null}
        {answerType === "Free Text" ? (
          <label className="field">
            <span>{t("challengeBuilderExpectedAnswer")}</span>
            <input type="text" value={expected} onChange={(event) => setExpected(event.target.value)} />
          </label>
        ) : null}
        <label className="field">
          <span>{t("challengeBuilderSet")}</span>
          <select value={setId} onChange={(event) => setSetId(event.target.value)}>
            <option value="">{t("challengeBuilderUnassigned")}</option>
            {sets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="control-row" style={{ marginTop: "8px" }}>
        <label className="field" style={{ minWidth: "220px" }}>
          <span>{t("challengeBuilderNewSetTitle")}</span>
          <input type="text" value={newSetTitle} onChange={(event) => setNewSetTitle(event.target.value)} />
        </label>
        <label className="field" style={{ minWidth: "260px" }}>
          <span>{t("challengeBuilderSetDescription")}</span>
          <input type="text" value={newSetDesc} onChange={(event) => setNewSetDesc(event.target.value)} />
        </label>
        <button type="button" className="control-button secondary" onClick={createSet}>
          {t("challengeBuilderCreateSet")}
        </button>
      </div>

      <div className="demo-output">
        <div className="demo-note">{t("challengeBuilderPreview")}</div>
        <div className="metric-card">
          <strong>{lab}</strong> - {model} - {difficulty} - {answerType}
          <div>{prompt}</div>
          <div>{t("challengeBuilderExpectedLabel")} {expectedPayload()}</div>
        </div>
        <div className="control-row" style={{ marginTop: "8px" }}>
          <button type="button" className="control-button" onClick={save}>
            {t("challengeBuilderSaveChallenge")}
          </button>
          {status ? <span className="pill">{status}</span> : null}
        </div>
      </div>
    </div>
  );
}
