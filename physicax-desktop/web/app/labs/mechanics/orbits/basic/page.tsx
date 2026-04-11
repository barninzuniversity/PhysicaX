import { OrbitSimulator } from '../../../../components/OrbitSimulator';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Orbit Simulator</h2>
        <p>Kepler-style orbital motion with energy diagnostics.</p>
      </section>
      <section className="section reveal">
        <OrbitSimulator />
      </section>
    </>
  );
}

