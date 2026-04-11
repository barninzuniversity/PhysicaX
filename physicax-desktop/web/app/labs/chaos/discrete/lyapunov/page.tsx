import { LyapunovSim } from '../../../../components/LyapunovSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Lyapunov Exponent</h2>
        <p>Sensitivity diagnostics for discrete maps.</p>
      </section>
      <section className="section reveal">
        <LyapunovSim />
      </section>
    </>
  );
}

