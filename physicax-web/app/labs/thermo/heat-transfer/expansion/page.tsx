import { ThermalExpansionSim } from '../../../../components/ThermalExpansionSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Thermal Expansion</h2>
        <p>Linear expansion response vs temperature.</p>
      </section>
      <section className="section reveal">
        <ThermalExpansionSim />
      </section>
    </>
  );
}

