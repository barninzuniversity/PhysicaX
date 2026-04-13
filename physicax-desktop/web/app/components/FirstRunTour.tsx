"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "./LocaleProvider";

type TourStep = {
  title: string;
  body: string;
};

export function FirstRunTour() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("tour") === "off" || params.get("docs") === "1") {
      window.localStorage.setItem("physicaxTourDone", "true");
      setOpen(false);
      return;
    }
    const done = window.localStorage.getItem("physicaxTourDone");
    if (done !== "true") {
      setOpen(true);
    }
  }, []);

  const steps = useMemo<TourStep[]>(
    () => [
      { title: t("tourStep1Title"), body: t("tourStep1Body") },
      { title: t("tourStep2Title"), body: t("tourStep2Body") },
      { title: t("tourStep3Title"), body: t("tourStep3Body") },
      { title: t("tourStep4Title"), body: t("tourStep4Body") }
    ],
    [t]
  );

  const closeTour = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("physicaxTourDone", "true");
    }
    setOpen(false);
  };

  if (!open) {
    return null;
  }

  const current = steps[step];

  return (
    <div className="tour-overlay">
      <div className="tour-card">
        <div className="tour-step">
          {t("tourStep")} {step + 1}/{steps.length}
        </div>
        <h2>{current.title}</h2>
        <p>{current.body}</p>
        <div className="tour-actions">
          <button type="button" className="control-chip" onClick={closeTour}>
            {t("tourSkip")}
          </button>
          {step > 0 ? (
            <button type="button" className="control-chip" onClick={() => setStep((prev) => prev - 1)}>
              {t("tourBack")}
            </button>
          ) : null}
          {step < steps.length - 1 ? (
            <button type="button" className="control-button" onClick={() => setStep((prev) => prev + 1)}>
              {t("tourNext")}
            </button>
          ) : (
            <button type="button" className="control-button" onClick={closeTour}>
              {t("tourFinish")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
