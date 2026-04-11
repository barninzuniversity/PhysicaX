import { AirflowCFD3D } from "../../../../components/AirflowCFD3D";

export default function Flow3DPage() {
  return (
    <>
      <section className="section reveal">
        <h2>3D Airflow + Moving Body</h2>
        <p>GPU-accelerated airflow visualization with optional CFD backend data.</p>
      </section>
      <section className="section reveal">
        <AirflowCFD3D />
      </section>
    </>
  );
}
