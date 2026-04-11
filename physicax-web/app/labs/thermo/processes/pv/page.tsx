import { PVProcessSim } from '../../../../components/PVProcessSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>P-V Process Explorer</h2>
        <p>Isothermal, isobaric, isochoric, adiabatic, polytropic, and expansion paths.</p>
      </section>
      <section className="section reveal">
        <PVProcessSim />
      </section>
    </>
  );
}

