import { KinematicsSuiteSim } from "../../../components/KinematicsSuiteSim";

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Kinematics Suite</h2>
        <p>1D motion, interception, launch optimization, relative motion, and parametric paths.</p>
      </section>
      <section className="section reveal">
        <KinematicsSuiteSim />
      </section>
    </>
  );
}
