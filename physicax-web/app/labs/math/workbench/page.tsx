import { EquationWorkbench } from "../../../components/EquationWorkbench";
import { LocaleText } from "../../../components/LocaleText";

export default function MathWorkbenchPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathWorkbenchPageTitle" fallback="Equation Workbench" /></h2>
        <p>
          <LocaleText
            id="mathWorkbenchPageIntro"
            fallback="Build and solve custom first- or second-order ODEs with live diagnostics."
          />
        </p>
      </section>
      <EquationWorkbench
        title={<LocaleText id="mathWorkbenchPanelTitle" fallback="Custom Dynamics Workbench" />}
        equation="-k*y - c*v"
        paramDefaults={{ k: 1, c: 0.1 }}
        mode="second"
        yLabel="y(t)"
      />
    </>
  );
}
