import { QuantumSuiteSim } from "../../components/QuantumSuiteSim";

export default function QuantumLabPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Quantum Intuition Lab</h2>
        <p>Particle in a box, tunneling, wavepackets, and superposition demos.</p>
      </section>
      <section className="section reveal">
        <QuantumSuiteSim />
      </section>
    </>
  );
}
