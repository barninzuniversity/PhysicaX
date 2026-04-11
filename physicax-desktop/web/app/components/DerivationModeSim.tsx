"use client";

import { useMemo, useState } from "react";
import { MathBlock } from "./MathBlock";
import { useLocale } from "./LocaleProvider";

type DerivationModel = {
  id: string;
  title: string;
  summary: string;
  equations: string[];
  assumptions: string[];
  steps: string[];
  validity: string;
  exact: string;
  boundary: string;
};

export function DerivationModeSim() {
  const { t } = useLocale();
  const models: DerivationModel[] = useMemo(() => ([
    {
      id: "pendulum",
      title: t("derivationPendulumTitle"),
      summary: t("derivationPendulumSummary"),
      equations: [
        String.raw`\ddot{\theta} + \frac{g}{L} \sin\theta = 0`,
        String.raw`\sin\theta \approx \theta \;\Rightarrow\; \ddot{\theta} + \frac{g}{L}\theta = 0`
      ],
      assumptions: [
        t("derivationPendulumAssumption1"),
        t("derivationPendulumAssumption2"),
        t("derivationPendulumAssumption3"),
        t("derivationPendulumAssumption4")
      ],
      steps: [
        t("derivationPendulumStep1"),
        t("derivationPendulumStep2"),
        t("derivationPendulumStep3"),
        t("derivationPendulumStep4")
      ],
      validity: t("derivationPendulumValidity"),
      exact: t("derivationPendulumExact"),
      boundary: t("derivationPendulumBoundary")
    },
    {
      id: "projectile",
      title: t("derivationProjectileTitle"),
      summary: t("derivationProjectileSummary"),
      equations: [
        String.raw`\dot{x} = v_x,\; \dot{y} = v_y`,
        String.raw`\dot{v_x} = -k v v_x,\; \dot{v_y} = -g - k v v_y`
      ],
      assumptions: [
        t("derivationProjectileAssumption1"),
        t("derivationProjectileAssumption2"),
        t("derivationProjectileAssumption3"),
        t("derivationProjectileAssumption4")
      ],
      steps: [
        t("derivationProjectileStep1"),
        t("derivationProjectileStep2"),
        t("derivationProjectileStep3"),
        t("derivationProjectileStep4")
      ],
      validity: t("derivationProjectileValidity"),
      exact: t("derivationProjectileExact"),
      boundary: t("derivationProjectileBoundary")
    },
    {
      id: "ideal-gas",
      title: t("derivationIdealGasTitle"),
      summary: t("derivationIdealGasSummary"),
      equations: [
        String.raw`PV = nRT`,
        String.raw`\left(P + a\frac{n^2}{V^2}\right)(V - nb) = nRT`
      ],
      assumptions: [
        t("derivationIdealGasAssumption1"),
        t("derivationIdealGasAssumption2"),
        t("derivationIdealGasAssumption3")
      ],
      steps: [
        t("derivationIdealGasStep1"),
        t("derivationIdealGasStep2"),
        t("derivationIdealGasStep3"),
        t("derivationIdealGasStep4")
      ],
      validity: t("derivationIdealGasValidity"),
      exact: t("derivationIdealGasExact"),
      boundary: t("derivationIdealGasBoundary")
    }
  ]), [t]);

  const [activeId, setActiveId] = useState("pendulum");
  const active = models.find((model) => model.id === activeId) ?? models[0];

  return (
    <div className="demo-panel derivation-panel">
      <div className="demo-title">{t("derivationTitle")}</div>
      <div className="derivation-grid">
        <div className="derivation-list">
          {models.map((model) => (
            <button
              key={model.id}
              type="button"
              className={`tool-chip ${activeId === model.id ? "active" : ""}`}
              onClick={() => setActiveId(model.id)}
            >
              {model.title}
            </button>
          ))}
          <div className="derivation-note">{t("derivationSelectNote")}</div>
        </div>
        <div className="derivation-main">
          <div className="card">
            <h3>{active.title}</h3>
            <p>{active.summary}</p>
          </div>
          <div className="card">
            <h4>{t("derivationEquations")}</h4>
            <div className="math-stack">
              {active.equations.map((eq) => (
                <MathBlock key={eq} latex={eq} />
              ))}
            </div>
          </div>
          <div className="card">
            <h4>{t("derivationSteps")}</h4>
            <ol className="derivation-steps">
              {active.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <div className="card">
            <h4>{t("derivationAssumptions")}</h4>
            <ul className="derivation-listing">
              {active.assumptions.map((assumption) => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h4>{t("derivationValidity")}</h4>
            <p>{active.validity}</p>
          </div>
          <div className="card">
            <h4>{t("derivationExactLabel")}</h4>
            <p>{active.exact}</p>
          </div>
          <div className="card">
            <h4>{t("derivationBoundaryLabel")}</h4>
            <p>{active.boundary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
