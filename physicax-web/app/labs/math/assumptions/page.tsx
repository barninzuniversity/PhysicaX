import { SymbolicAssumptionsSim } from "../../../components/SymbolicAssumptionsSim";
import { LocaleText } from "../../../components/LocaleText";

export default function MathAssumptionsPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathSymbolicAssumptions" fallback="Symbolic Assumptions" /></h2>
        <p>
          <LocaleText
            id="mathSymbolicAssumptionsPage"
            fallback="Declare assumptions and see the algebraic simplifications they enable."
          />
        </p>
      </section>
      <SymbolicAssumptionsSim />
    </>
  );
}
