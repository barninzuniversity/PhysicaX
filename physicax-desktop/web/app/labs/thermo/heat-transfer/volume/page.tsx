import { HeatTransferVolume3D } from "../../../../components/HeatTransferVolume3D";

export default function HeatTransferVolumePage() {
  return (
    <>
      <section className="section reveal">
        <h2>3D Heat Transfer</h2>
        <p>GPU volume rendering of a diffusing heat pulse in 3D.</p>
      </section>
      <section className="section reveal">
        <HeatTransferVolume3D />
      </section>
    </>
  );
}
