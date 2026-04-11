import { readDataFile } from "../../lib/readText";
import { FormulaPackFilter } from "../components/FormulaPackFilter";
import { LocaleText } from "../components/LocaleText";

export default function FormulasPage() {
  const formulaText = readDataFile("data/formula_reference_ascii.md");

  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="formulaPackTitle" fallback="Formula Reference Pack" /></h2>
        <p>
          <LocaleText
            id="formulaPackIntro"
            fallback="This pack is the canonical source of truth for every physics model. It includes equations, assumptions, domains, and validation notes. All formulas are in SI units and use the sign convention W = work done by the system."
          />
        </p>
        <div className="callout">
          <LocaleText
            id="formulaPackCallout"
            fallback="Do not duplicate formulas across files. Use this registry everywhere."
          />
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="formulaGovernanceTitle" fallback="Formula Governance" /></h2>
        <div className="columns">
          <div className="column">
            <h3><LocaleText id="formulaGovernanceRules" fallback="Rules" /></h3>
            <ul>
              <li><LocaleText id="formulaGovernanceRule1" fallback="One canonical formula per model." /></li>
              <li><LocaleText id="formulaGovernanceRule2" fallback="Store assumptions and domain constraints." /></li>
              <li><LocaleText id="formulaGovernanceRule3" fallback="Keep formulas in backend, not UI." /></li>
            </ul>
          </div>
          <div className="column">
            <h3><LocaleText id="formulaGovernanceValidation" fallback="Validation" /></h3>
            <ul>
              <li><LocaleText id="formulaGovernanceVal1" fallback="At least 3 validation cases per model." /></li>
              <li><LocaleText id="formulaGovernanceVal2" fallback="Reference cases, limiting cases, invalid cases." /></li>
              <li><LocaleText id="formulaGovernanceVal3" fallback="Energy and entropy constraints where applicable." /></li>
            </ul>
          </div>
        </div>
        <div className="diagram" aria-hidden="true">
          <svg viewBox="0 0 900 200">
            <rect x="20" y="30" width="200" height="60" rx="12" fill="#e8f4f2" />
            <text x="120" y="65" textAnchor="middle" fontSize="13" fill="#101820">
              Formula Registry
            </text>
            <rect x="240" y="30" width="200" height="60" rx="12" fill="#fbeee6" />
            <text x="340" y="65" textAnchor="middle" fontSize="13" fill="#101820">
              Validators
            </text>
            <rect x="460" y="30" width="200" height="60" rx="12" fill="#e8f4f2" />
            <text x="560" y="65" textAnchor="middle" fontSize="13" fill="#101820">
              Tests
            </text>
            <rect x="680" y="30" width="200" height="60" rx="12" fill="#fbeee6" />
            <text x="780" y="65" textAnchor="middle" fontSize="13" fill="#101820">
              UI + API
            </text>
            <line x1="220" y1="60" x2="240" y2="60" stroke="#101820" strokeWidth="2" />
            <line x1="440" y1="60" x2="460" y2="60" stroke="#101820" strokeWidth="2" />
            <line x1="660" y1="60" x2="680" y2="60" stroke="#101820" strokeWidth="2" />
          </svg>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="formulaGlossaryTitle" fallback="Glossary + Context" /></h2>
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="formulaGlossaryCardTitle" fallback="Scientific Glossary" /></h3>
            <p><a href="/formulas/glossary"><LocaleText id="formulaGlossaryCardLink" fallback="Open glossary" /></a></p>
          </div>
          <div className="card">
            <h3><LocaleText id="formulaContextTitle" fallback="Contextual Notes" /></h3>
            <p><LocaleText id="formulaContextBody" fallback="Every formula card includes assumptions and validation cases." /></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="formulaPackFullTitle" fallback="Full Corrected Formula Pack" /></h2>
        <FormulaPackFilter text={formulaText} />
        <details className="details-block" open>
          <summary><LocaleText id="formulaRegistrySummary" fallback="Open formula registry text" /></summary>
          <pre className="ocr">{formulaText}</pre>
        </details>
      </section>
    </>
  );
}
