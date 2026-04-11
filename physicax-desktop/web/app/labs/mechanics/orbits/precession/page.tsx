import { OrbitPrecessionSim } from "../../../../components/OrbitPrecessionSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Orbit Precession</h2>
        <p>Explore precession from a weak r^-4 correction.</p>
      </section>
      <section className="section reveal">
        <OrbitPrecessionSim />
      </section>
    </>
  );
}
