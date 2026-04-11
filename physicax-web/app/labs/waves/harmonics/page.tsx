import Link from "next/link";

export default function HarmonicsPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Harmonics</h2>
        <p>Choose a harmonic model.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>String Harmonics</h3>
            <p><Link href="/labs/waves/harmonics/string">Open string harmonics</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}
