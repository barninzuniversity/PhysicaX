import Link from "next/link";

export default function InterferencePage() {
  return (
    <>
      <section className="section reveal">
        <h2>Interference + Beats</h2>
        <p>Choose an interference or beat model.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Two-Source Interference</h3>
            <p><Link href="/labs/waves/interference/two-source">Open interference model</Link></p>
          </div>
          <div className="card">
            <h3>Beats</h3>
            <p><Link href="/labs/waves/beats">Open beats model</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}
