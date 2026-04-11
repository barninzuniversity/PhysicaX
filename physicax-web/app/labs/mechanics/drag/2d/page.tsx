import { DragSimulator } from "../../../../components/DragSimulator";

export default function Drag2DPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Projectile Drag (2D)</h2>
        <p>Compare no-drag, linear, and quadratic drag with live airflow streamlines.</p>
      </section>
      <section className="section reveal">
        <DragSimulator />
      </section>
    </>
  );
}
