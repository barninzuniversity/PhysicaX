import { CasLab } from "../../../components/CasLab";
import { LocaleText } from "../../../components/LocaleText";

export default function CasPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="casPageTitle" fallback="Computer Algebra System" /></h2>
        <p>
          <LocaleText
            id="casPageIntro"
            fallback="Full symbolic engine powered by SymPy (local WebAssembly)."
          />
        </p>
      </section>
      <CasLab />
    </>
  );
}
