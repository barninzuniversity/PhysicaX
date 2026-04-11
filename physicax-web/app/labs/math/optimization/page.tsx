import { OptimizationSim } from "../../../components/OptimizationSim";
import { LocaleText } from "../../../components/LocaleText";

export default function OptimizationPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="optPageTitle" fallback="Optimization Lab" /></h2>
        <p>
          <LocaleText
            id="optPageIntro"
            fallback="Explore gradient descent paths, momentum, and convergence diagnostics."
          />
        </p>
      </section>
      <OptimizationSim />
    </>
  );
}
