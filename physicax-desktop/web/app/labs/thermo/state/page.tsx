import { IdealGasDemo } from "../../../components/IdealGasDemo";

export default function ThermoStatePage() {
  return (
    <>
      <section className="section reveal">
        <h2>State Variable Solver</h2>
        <p>Ideal gas law solver with LaTeX-driven formula clarity.</p>
      </section>
      <section className="section reveal">
        <IdealGasDemo />
      </section>
    </>
  );
}
