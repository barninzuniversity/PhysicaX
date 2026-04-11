import { MathBlock } from "../../../components/MathBlock";

export default function ChaosConnectionsPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Math Connections</h2>
        <p>Connect discrete maps to physical systems and interpret chaos diagnostics.</p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3>Logistic Map</h3>
            <p>Models population growth with nonlinear feedback.</p>
            <MathBlock latex={String.raw`x_{n+1}=r x_n(1-x_n)`} />
          </div>
          <div className="card">
            <h3>Driven Pendulum</h3>
            <p>Nonlinear forcing creates chaos and strange attractors.</p>
            <MathBlock latex={String.raw`\theta''+\gamma\theta'+\sin\theta=A\cos(\omega t)`} />
          </div>
          <div className="card">
            <h3>Fluid Vortices</h3>
            <p>Vortex shedding connects to Strouhal and Reynolds numbers.</p>
            <MathBlock latex={String.raw`St=\frac{fL}{U},\quad Re=\frac{\rho U L}{\mu}`} />
          </div>
        </div>
      </section>
    </>
  );
}
