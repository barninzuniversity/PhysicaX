import { FeatureChecklist } from "../../components/FeatureChecklist";

export default function ResearchWorkflowsPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Research Workflows</h2>
        <p>
          These workflows describe how researchers run parameter sweeps, compare runs, and package
          results with reproducibility metadata.
        </p>
      </section>

      <section className="section reveal">
        <h2>Workflow A: Parameter Sweep</h2>
        <FeatureChecklist
          title="Parameter Sweep Steps"
          storageKey="workflow-parameter-sweep"
          items={[
            "Select a model and baseline parameters.",
            "Define sweep ranges for 1 or 2 parameters.",
            "Queue batch runs with a deterministic seed.",
            "Aggregate outputs into a structured dataset.",
            "Export CSV and summary plots."
          ]}
        />
      </section>

      <section className="section reveal">
        <h2>Workflow B: Solver Comparison</h2>
        <FeatureChecklist
          title="Solver Comparison Steps"
          storageKey="workflow-solver-compare"
          items={[
            "Fix the model and initial conditions.",
            "Run Euler, Heun, RK4 with the same dt.",
            "Compute error against an exact solution if available.",
            "Plot error vs step size."
          ]}
        />
      </section>

      <section className="section reveal">
        <h2>Workflow C: Publishable Export</h2>
        <FeatureChecklist
          title="Publishable Export Steps"
          storageKey="workflow-publish"
          items={[
            "Include model id, version, and assumptions.",
            "Attach plots, parameters, and solver metadata.",
            "Export notebook and dataset together."
          ]}
        />
      </section>
    </>
  );
}
