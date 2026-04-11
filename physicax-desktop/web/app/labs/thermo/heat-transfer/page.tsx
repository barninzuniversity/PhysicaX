import Link from "next/link";
import { HeatTransferExtrasSim } from "../../../components/HeatTransferExtrasSim";

export default function HeatTransferPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Heat Transfer</h2>
        <p>Choose a heat transfer model.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Conduction</h3>
            <p><Link href="/labs/thermo/heat-transfer/conduction">Open conduction</Link></p>
          </div>
          <div className="card">
            <h3>3D Heat Volume</h3>
            <p><Link href="/labs/thermo/heat-transfer/volume">Open 3D volume</Link></p>
          </div>
          <div className="card">
            <h3>Cooling Curve</h3>
            <p><Link href="/labs/thermo/heat-transfer/cooling">Open cooling curve</Link></p>
          </div>
          <div className="card">
            <h3>Thermal Expansion</h3>
            <p><Link href="/labs/thermo/heat-transfer/expansion">Open thermal expansion</Link></p>
          </div>
        </div>
      </section>
      <section className="section reveal">
        <h2>Advanced Heat Transfer</h2>
        <p>Multi-layer conduction, resistance networks, convection, radiation, and heat exchanger toys.</p>
        <HeatTransferExtrasSim />
      </section>
    </>
  );
}
