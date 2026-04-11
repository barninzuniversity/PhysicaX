"use client";

import { MathBlock } from "./MathBlock";
import { useLocale } from "./LocaleProvider";
import { LogisticMapDemo } from "./LogisticMapDemo";
import { CobwebSim } from "./CobwebSim";

export function MathConnectionsSim() {
  const { t } = useLocale();

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("mathConnectionsTitle")}</div>
      <p className="demo-lede">{t("mathConnectionsLede")}</p>

      <div className="grid-two" style={{ marginTop: "12px" }}>
        <div className="card">
          <h3>{t("mathConnectionsEquationTitle")}</h3>
          <MathBlock latex={String.raw`x_{n+1}=r\,x_n(1-x_n)`} />
          <p className="demo-note">{t("mathConnectionsEquationNote")}</p>
          <ul className="list">
            <li>{t("mathConnectionsItem1")}</li>
            <li>{t("mathConnectionsItem2")}</li>
            <li>{t("mathConnectionsItem3")}</li>
          </ul>
        </div>
        <div className="card">
          <h3>{t("mathConnectionsBridgeTitle")}</h3>
          <p>{t("mathConnectionsBridgeBody")}</p>
          <div className="pill">{t("mathConnectionsBridgePill")}</div>
        </div>
      </div>

      <div className="demo-stack" style={{ marginTop: "16px" }}>
        <LogisticMapDemo />
        <CobwebSim />
      </div>
    </div>
  );
}
