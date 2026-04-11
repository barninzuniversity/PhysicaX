import { SymbolicWorkbenchSim } from "../../../components/SymbolicWorkbenchSim";
import { LocaleText } from "../../../components/LocaleText";

export default function SymbolicWorkbenchPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathSymbolicPageTitle" fallback="Symbolic Workbench" /></h2>
        <p>
          <LocaleText
            id="mathSymbolicPageIntro"
            fallback="Simplify expressions, compute derivatives, and approximate integrals."
          />
        </p>
      </section>
      <SymbolicWorkbenchSim />
    </>
  );
}
