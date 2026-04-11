import { BatchEstimatorDemo } from "../components/BatchEstimatorDemo";
import { ParameterSweepSim } from "../components/ParameterSweepSim";
import { ResearchRunTracker } from "../components/ResearchRunTracker";
import { ResearchAnalysisPanel } from "../components/ResearchAnalysisPanel";
import { LocaleText } from "../components/LocaleText";

export default function ResearchPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="researchModeTitle" fallback="Research Mode" /></h2>
        <p>
          <LocaleText
            id="researchIntro"
            fallback="Research Mode turns PhysicaX into a reproducible sandbox for parameter sweeps, batch runs, and publishable outputs. It is built on the same formula registry but adds workflow and compute tooling."
          />
        </p>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="researchCoreTitle" fallback="Core Features" /></h2>
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="researchSweepsTitle" fallback="Parameter Sweeps" /></h3>
            <p><LocaleText id="researchSweepsBody" fallback="Batch runs across one or two parameters with structured outputs." /></p>
          </div>
          <div className="card">
            <h3><LocaleText id="researchAsyncTitle" fallback="Async Jobs" /></h3>
            <p><LocaleText id="researchAsyncBody" fallback="Queue heavy simulations on workers and return stable run ids." /></p>
          </div>
          <div className="card">
            <h3><LocaleText id="researchNotebookTitle" fallback="Notebook Mode" /></h3>
            <p><LocaleText id="researchNotebookBody" fallback="Combine text, equations, plots, and experiment snapshots." /></p>
          </div>
          <div className="card">
            <h3><LocaleText id="researchExportsTitle" fallback="Exports" /></h3>
            <p><LocaleText id="researchExportsBody" fallback="CSV, JSON, PDF, and reproducibility metadata." /></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="researchEstimatorTitle" fallback="Batch Run Estimator" /></h2>
        <p><LocaleText id="researchEstimatorBody" fallback="Estimate total runs and time for a two-parameter sweep." /></p>
        <BatchEstimatorDemo />
      </section>

      <section className="section reveal">
        <h2><LocaleText id="researchSweepEngineTitle" fallback="Parameter Sweep Engine" /></h2>
        <p><LocaleText id="researchSweepEngineBody" fallback="Run 1D or 2D sweeps to map sensitivity and stability." /></p>
        <ParameterSweepSim />
      </section>

      <section className="section reveal">
        <h2><LocaleText id="researchRunsSectionTitle" fallback="Research Runs" /></h2>
        <p><LocaleText id="researchRunsSectionBody" fallback="Store sweep configurations and results with reproducibility metadata." /></p>
        <ResearchRunTracker />
      </section>
      <section className="section reveal">
        <h2><LocaleText id="researchAnalysisTitle" fallback="Result Analysis" /></h2>
        <p><LocaleText id="researchAnalysisBody" fallback="Compute basic statistics, peak counts, and convergence checks for run outputs." /></p>
        <ResearchAnalysisPanel />
      </section>

      <section className="section reveal">
        <h2><LocaleText id="researchToolsTitle" fallback="Research Tools" /></h2>
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="researchWorkflowsTitle" fallback="Workflows" /></h3>
            <p><a href="/research/workflows"><LocaleText id="researchWorkflowsLink" fallback="Open research workflows" /></a></p>
          </div>
          <div className="card">
            <h3><LocaleText id="researchNotebookTemplatesTitle" fallback="Notebook Templates" /></h3>
            <p><a href="/research/notebook"><LocaleText id="researchNotebookTemplatesLink" fallback="Open notebook templates" /></a></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="researchReproTitle" fallback="Reproducibility" /></h2>
        <ul className="governance-list">
          <li><LocaleText id="researchReproItem1" fallback="Each experiment stores a config snapshot." /></li>
          <li><LocaleText id="researchReproItem2" fallback="Deterministic seeds for stochastic simulations." /></li>
          <li><LocaleText id="researchReproItem3" fallback="Versioned schema for results and parameters." /></li>
          <li><LocaleText id="researchReproItem4" fallback="Exported metadata includes solver and timestep." /></li>
        </ul>
      </section>
    </>
  );
}
