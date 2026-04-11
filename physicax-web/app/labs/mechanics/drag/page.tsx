export default function DragPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Drag + Airflow</h2>
        <p>Choose the drag visualization you want to explore.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Projectile Drag (2D)</h3>
            <p><a href="/labs/mechanics/drag/2d">Open 2D drag</a></p>
          </div>
          <div className="card">
            <h3>3D Airflow + Moving Body</h3>
            <p><a href="/labs/mechanics/drag/flow-3d">Open 3D airflow</a></p>
          </div>
        </div>
      </section>
    </>
  );
}
