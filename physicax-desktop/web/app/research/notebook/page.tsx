import { NotebookOutlineBuilder } from "../../components/NotebookOutlineBuilder";
import { NotebookManager } from "../../components/NotebookManager";

export default function NotebookTemplatesPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Notebook Mode Templates</h2>
        <p>
          Notebook Mode combines narrative, equations, plots, and experiment snapshots into a
          publishable artifact. Templates keep structure consistent.
        </p>
      </section>

      <section className="section reveal">
        <h2>Template: Experiment Report</h2>
        <div className="code-block">
          <pre><code>{`1. Title and Abstract
2. Model and Assumptions
3. Parameters and Initial Conditions
4. Solver Configuration
5. Plots and Results
6. Discussion and Limitations
7. Reproducibility Metadata`}</code></pre>
        </div>
      </section>

      <section className="section reveal">
        <h2>Outline Builder</h2>
        <p>Select the sections you want included in a new report.</p>
        <NotebookOutlineBuilder />
      </section>

      <section className="section reveal">
        <h2>Notebook Manager</h2>
        <p>Save research notes locally in your PhysicaX workspace.</p>
        <NotebookManager />
      </section>

      <section className="section reveal">
        <h2>Template: Comparative Study</h2>
        <div className="code-block">
          <pre><code>{`1. Objective
2. Model A vs Model B
3. Parameter Sweep Summary
4. Error Metrics
5. Visual Comparisons
6. Conclusions`}</code></pre>
        </div>
      </section>

      <section className="section reveal">
        <h2>Template: Solver Evaluation</h2>
        <div className="code-block">
          <pre><code>{`1. Test Equation
2. Solver Settings
3. Error vs dt
4. Stability Observations
5. Recommended Solver`}</code></pre>
        </div>
      </section>
    </>
  );
}
