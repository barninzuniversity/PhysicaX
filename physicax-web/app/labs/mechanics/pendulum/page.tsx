import Link from "next/link";

export default function PendulumPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Pendulum Suite</h2>
        <p>Select a single pendulum or double pendulum simulator.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Single Pendulum</h3>
            <p><Link href="/labs/mechanics/pendulum/single">Open single pendulum</Link></p>
          </div>
          <div className="card">
            <h3>Double Pendulum</h3>
            <p><Link href="/labs/mechanics/pendulum/double">Open double pendulum</Link></p>
          </div>
          <div className="card">
            <h3>Driven Pendulum</h3>
            <p><Link href="/labs/mechanics/pendulum/driven">Open driven pendulum</Link></p>
          </div>
        </div>
      </section>
    </>
  );
}
