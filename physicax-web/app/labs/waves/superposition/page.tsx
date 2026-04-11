import Link from "next/link";

export default function WaveSuperpositionIndex() {
  return (
    <>
      <section className="section reveal">
        <h2>Wave Superposition</h2>
        <p>Select a specific superposition model.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Basic Superposition</h3>
            <p><Link href="/labs/waves/superposition/basic">Open superposition model</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}
