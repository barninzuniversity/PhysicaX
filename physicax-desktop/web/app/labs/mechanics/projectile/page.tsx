import { ProjectileDemo } from "../../../components/ProjectileDemo";

export default function ProjectilePage() {
  return (
    <>
      <section className="section reveal">
        <h2>Projectile Motion Studio</h2>
        <p>Live trajectory animation with parameter control and computed range, time, and height.</p>
      </section>
      <section className="section reveal">
        <ProjectileDemo />
      </section>
    </>
  );
}
