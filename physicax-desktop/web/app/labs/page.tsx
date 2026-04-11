import Link from "next/link";
import { LabExplorer } from "../components/LabExplorer";
import { LocaleText } from "../components/LocaleText";

export default function LabsPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="labsTitle" fallback="Labs and Modules" /></h2>
        <p>
          <LocaleText
            id="labsIntro"
            fallback="Each lab is a module with its own models and validation rules. The platform treats labs as plugins, making the system scalable and the formulas governable."
          />
        </p>
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="labsThermo" fallback="ThermoLab" /></h3>
            <p><Link href="/labs/thermo"><LocaleText id="labsOpenThermo" fallback="Open ThermoLab page" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsMechanics" fallback="MechanicsLab" /></h3>
            <p><Link href="/labs/mechanics"><LocaleText id="labsOpenMechanics" fallback="Open MechanicsLab page" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsChaos" fallback="ChaosLab" /></h3>
            <p><Link href="/labs/chaos"><LocaleText id="labsOpenChaos" fallback="Open ChaosLab page" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsWave" fallback="WaveLab" /></h3>
            <p><Link href="/labs/waves"><LocaleText id="labsOpenWave" fallback="Open WaveLab page" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsEM" fallback="EMLab" /></h3>
            <p><Link href="/labs/em"><LocaleText id="labsOpenEM" fallback="Open EMLab page" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsODEPDE" fallback="ODE/PDE Lab" /></h3>
            <p><Link href="/labs/ode-pde"><LocaleText id="labsOpenODEPDE" fallback="Open ODE/PDE Lab page" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsStat" fallback="Stat Physics" /></h3>
            <p><Link href="/labs/stat"><LocaleText id="labsOpenStat" fallback="Open Statistical Physics page" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsQuantum" fallback="Quantum Lab" /></h3>
            <p><Link href="/labs/quantum"><LocaleText id="labsOpenQuantum" fallback="Open Quantum Intuition Lab" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsMath" fallback="Math Engine" /></h3>
            <p><Link href="/labs/math"><LocaleText id="labsOpenMath" fallback="Open Math Engine page" /></Link></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="labsExplorerTitle" fallback="Interactive Lab Explorer" /></h2>
        <p><LocaleText id="labsExplorerBody" fallback="Select a lab to preview its focus and jump to the full page." /></p>
        <LabExplorer />
      </section>

      <section className="section reveal">
        <h2><LocaleText id="labsThermoTitle" fallback="ThermoLab" /></h2>
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="labsThermoState" fallback="State Variable Solver" /></h3>
            <p><LocaleText id="labsThermoStateBody" fallback="Ideal gas law, multi-unit support, dimensional checks." /></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsThermoProcesses" fallback="Processes" /></h3>
            <p><LocaleText id="labsThermoProcessesBody" fallback="Isothermal, isochoric, isobaric, adiabatic, polytropic." /></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsThermoCycles" fallback="Cycles" /></h3>
            <p><LocaleText id="labsThermoCyclesBody" fallback="Carnot, Otto, Diesel, Brayton, refrigeration and heat pump." /></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsThermoEntropy" fallback="Entropy and Stat Mech" /></h3>
            <p><LocaleText id="labsThermoEntropyBody" fallback="Entropy visualizer, Maxwell-Boltzmann, Boltzmann factor." /></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="labsMechanicsTitle" fallback="MechanicsLab" /></h2>
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="labsMechanicsKinematics" fallback="Kinematics" /></h3>
            <p><LocaleText id="labsMechanicsKinematicsBody" fallback="1D motion, projectile, drag, wind, intercept problems." /></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsMechanicsOscillators" fallback="Oscillators" /></h3>
            <p><LocaleText id="labsMechanicsOscillatorsBody" fallback="SHM, damped, driven, resonance, coupled oscillators." /></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsMechanicsPendulums" fallback="Pendulums" /></h3>
            <p><LocaleText id="labsMechanicsPendulumsBody" fallback="Small-angle vs exact, damped, driven, double pendulum." /></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsMechanicsOrbits" fallback="Orbits" /></h3>
            <p><LocaleText id="labsMechanicsOrbitsBody" fallback="Circular orbits, escape velocity, energy diagnostics." /></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="labsChaosTitle" fallback="ChaosLab" /></h2>
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="labsChaosDiscrete" fallback="Discrete Maps" /></h3>
            <p><LocaleText id="labsChaosDiscreteBody" fallback="Logistic map, tent map, bifurcation diagrams, Lyapunov." /></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsChaosContinuous" fallback="Continuous Systems" /></h3>
            <p><LocaleText id="labsChaosContinuousBody" fallback="Lorenz, Rossler, Duffing, driven pendulum." /></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsChaosDiagnostics" fallback="Diagnostics" /></h3>
            <p><LocaleText id="labsChaosDiagnosticsBody" fallback="Phase portraits, Poincare sections, basins of attraction." /></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="labsWaveEMTitle" fallback="WaveLab and EMLab" /></h2>
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="labsWaveTitle" fallback="WaveLab" /></h3>
            <p><LocaleText id="labsWaveBody" fallback="Traveling waves, standing waves, beats, harmonics, Fourier." /></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsEMTitle" fallback="EMLab" /></h3>
            <p><LocaleText id="labsEMBody" fallback="Coulomb, E-field maps, RC/RL/RLC circuits, Lorentz force." /></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="labsODEStatTitle" fallback="ODE/PDE Lab and Statistical Physics" /></h2>
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="labsODETitle" fallback="ODE/PDE Lab" /></h3>
            <p><LocaleText id="labsODEBody" fallback="Euler, Heun, RK4, error analysis, heat and wave equations." /></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsStatTitle" fallback="Stat Physics" /></h3>
            <p><LocaleText id="labsStatBody" fallback="Random walk, diffusion, Monte Carlo sampling, two-level systems." /></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="labsMathTitle" fallback="Math Engine" /></h2>
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="labsMathSymbolic" fallback="Symbolic Layer" /></h3>
            <p><LocaleText id="labsMathSymbolicBody" fallback="Render formulas, assumptions, and derivation notes." /></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsMathDimensional" fallback="Dimensional Analysis" /></h3>
            <p><LocaleText id="labsMathDimensionalBody" fallback="Unit checks, nondimensionalization, scaling insights." /></p>
          </div>
          <div className="card">
            <h3><LocaleText id="labsMathSensitivity" fallback="Sensitivity" /></h3>
            <p><LocaleText id="labsMathSensitivityBody" fallback="Parameter influence charts and partial-derivative insights." /></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="labsWorkflowTitle" fallback="Lab Workflow" /></h2>
        <p><LocaleText id="labsWorkflowBody" fallback="Every lab follows the same workflow so the platform stays consistent." /></p>
        <div className="diagram">
          <svg viewBox="0 0 900 220" role="img" aria-label="Lab workflow diagram">
            <rect x="30" y="60" width="170" height="70" rx="12" fill="#e8f4f2" />
            <text x="115" y="100" textAnchor="middle" fontSize="13" fill="#101820">Select Model</text>
            <rect x="230" y="60" width="170" height="70" rx="12" fill="#fbeee6" />
            <text x="315" y="100" textAnchor="middle" fontSize="13" fill="#101820">Set Parameters</text>
            <rect x="430" y="60" width="170" height="70" rx="12" fill="#e8f4f2" />
            <text x="515" y="100" textAnchor="middle" fontSize="13" fill="#101820">Run Solver</text>
            <rect x="630" y="60" width="170" height="70" rx="12" fill="#fbeee6" />
            <text x="715" y="100" textAnchor="middle" fontSize="13" fill="#101820">Analyze + Compare</text>
            <line x1="200" y1="95" x2="230" y2="95" stroke="#101820" strokeWidth="2" />
            <line x1="400" y1="95" x2="430" y2="95" stroke="#101820" strokeWidth="2" />
            <line x1="600" y1="95" x2="630" y2="95" stroke="#101820" strokeWidth="2" />
          </svg>
        </div>
      </section>
    </>
  );
}
