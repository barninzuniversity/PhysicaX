import { DipoleFieldSim } from "../../../../components/DipoleFieldSim";

export default function DipolePage() {
  return (
    <>
      <section className="section reveal">
        <h2>Dipole Field</h2>
        <p>Electric field along the dipole axis.</p>
      </section>
      <section className="section reveal">
        <DipoleFieldSim />
      </section>
    </>
  );
}
