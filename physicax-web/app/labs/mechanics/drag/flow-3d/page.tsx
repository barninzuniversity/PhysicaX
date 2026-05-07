import { AirflowCFD3DLazy } from "../../../../components/AirflowCFD3DLazy";

export default function Flow3DPage() {
  return (
    <>
      <section className="section reveal">
        <h2>3D Airflow + Moving Body</h2>
        <p>
          GPU-accelerated airflow visualization with optional CFD backend data. The heavy 3D stage now loads after the
          page shell so the route reaches a readable state faster before the biggest renderer work begins.
        </p>
      </section>
      <section className="section reveal">
        <AirflowCFD3DLazy />
      </section>
    </>
  );
}
