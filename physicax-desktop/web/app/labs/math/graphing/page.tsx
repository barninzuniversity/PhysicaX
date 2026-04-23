import Link from "next/link";
import { GraphingCalculatorSim } from "../../../components/GraphingCalculatorSim";

const graphSignals = [
  {
    value: "Visual-first",
    label: "experience",
    note: "Turn equations into plots quickly enough that users keep experimenting."
  },
  {
    value: "Geometry-aware",
    label: "tools",
    note: "Lightweight construction and graphing behavior inspired by interactive classroom tools."
  },
  {
    value: "Connected",
    label: "studio",
    note: "Move from graphing into CAS, calculus, and fitting without leaving the math section."
  }
];

export default function GraphingCalculatorPage() {
  return (
    <>
      <section className="section reveal">
        <div className="hero math-studio-hero">
          <div>
            <div className="hero-kicker">Math Studio / Graphing</div>
            <h1>A graphing surface for functions, intuition, and presentation-ready visuals.</h1>
            <p className="hero-lede">
              This page should feel like the fast visual side of the studio: plot first, learn from the shape, then
              move into calculus, fitting, or symbolic cleanup if the question gets deeper.
            </p>
            <div className="hero-badges">
              <span>Function plotting</span>
              <span>Geometry-friendly workflow</span>
              <span>Fast visual feedback</span>
              <span>Ideal for demos and classrooms</span>
            </div>
            <div className="hero-actions">
              <Link className="control-button" href="#graphing-workspace">
                Open graphing workspace
              </Link>
              <Link className="control-chip" href="/labs/math/cas">
                Simplify in CAS
              </Link>
              <Link className="control-chip" href="/labs/math/calculus">
                Open calculus tools
              </Link>
            </div>
            <div className="hero-signal-grid">
              {graphSignals.map((item) => (
                <div className="signal-card" key={item.label}>
                  <div className="signal-value">{item.value}</div>
                  <div className="signal-label">{item.label}</div>
                  <div className="signal-note">{item.note}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-panel math-studio-panel">
            <div className="math-console">
              <div className="math-console-bar">
                <span className="math-console-dot" />
                <span className="math-console-dot" />
                <span className="math-console-dot" />
                <span className="math-console-title">Plot sketch</span>
              </div>
              <div className="math-console-body">
                <div className="math-console-line">
                  <span className="math-console-prompt">fx&gt;</span>
                  <span>plot(sin(x), x = -2*pi..2*pi)</span>
                </div>
                <div className="math-console-line">
                  <span className="math-console-prompt">fx&gt;</span>
                  <span>overlay(0.3*x, "guide line")</span>
                </div>
                <div className="math-console-line math-console-output">insight: crossing points and slope changes become obvious</div>
              </div>
            </div>
            <div className="panel-card">
              <h3>Best uses</h3>
              <ul className="feature-list">
                <li>Turn a new equation into a visual in seconds.</li>
                <li>Support lectures, demos, and intuition-building workflows.</li>
                <li>Bridge quickly into fitting, calculus, or symbolic cleanup.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section reveal" id="graphing-workspace">
        <div className="section-header">
          <p className="section-kicker">Workspace</p>
          <h2>Graphing Workspace</h2>
          <p className="section-lede">
            Use the graphing surface below when you want the fastest path from an equation to an explanation-friendly
            visual. The rest of the Math Studio is one click away when the question grows.
          </p>
        </div>
        <GraphingCalculatorSim />
      </section>
    </>
  );
}
