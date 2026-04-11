import { HeatEquationSim } from '../../../../components/HeatEquationSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Heat Equation (1D)</h2>
        <p>Time evolution of temperature distribution.</p>
      </section>
      <section className="section reveal">
        <HeatEquationSim />
      </section>
    </>
  );
}

