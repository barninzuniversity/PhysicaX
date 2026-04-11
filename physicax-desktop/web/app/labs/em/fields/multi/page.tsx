import { MultiChargeFieldSim } from "../../../../components/MultiChargeFieldSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Multi-Charge Field Map</h2>
        <p>Potential and field influence from multiple point charges.</p>
      </section>
      <section className="section reveal">
        <MultiChargeFieldSim />
      </section>
    </>
  );
}
