import Link from "next/link";
import { MathBlock } from "../../components/MathBlock";
import { LocaleText } from "../../components/LocaleText";

export default function MathEnginePage() {
  return (
    <>
      <section className="section reveal">
        <div className="hero">
          <div>
            <div className="hero-kicker">
              <LocaleText id="mathEngineKicker" fallback="Math Engine" />
            </div>
            <h1>
              <LocaleText
                id="mathEngineTitle"
                fallback="Computational Math + Scientific Insight Lab"
              />
            </h1>
            <p className="hero-lede">
              <LocaleText
                id="mathEngineLede"
                fallback="A focused math layer for every physics module: formulas, assumptions, scaling, dimensional checks, and graphing tools that make simulations trustworthy."
              />
            </p>
            <div className="hero-badges">
              <span><LocaleText id="mathBadgeSymbolic" fallback="Symbolic + numeric tooling" /></span>
              <span><LocaleText id="mathBadgeUnits" fallback="Units + nondimensionalization" /></span>
              <span><LocaleText id="mathBadgeSeries" fallback="Series + stability" /></span>
              <span><LocaleText id="mathBadgeDerivation" fallback="Derivation + approximation" /></span>
            </div>
            <div className="hero-actions">
              <Link className="control-button" href="/labs/math/graphing">
                <LocaleText id="mathOpenGraphing" fallback="Open graphing lab" />
              </Link>
              <Link className="control-chip" href="/labs/math/series/taylor">
                <LocaleText id="mathOpenTaylor" fallback="Taylor explorer" />
              </Link>
              <Link className="control-chip" href="/labs/math/units">
                <LocaleText id="mathOpenUnits" fallback="Unit consistency" />
              </Link>
              <Link className="control-chip" href="/labs/math/derivation">
                <LocaleText id="mathOpenDerivation" fallback="Derivation mode" />
              </Link>
            </div>
          </div>
          <div className="hero-panel">
            <div className="card">
              <h3><LocaleText id="mathFormulaContext" fallback="Formula Context" /></h3>
              <MathBlock latex={String.raw`\nabla \cdot \vec{u} = 0,\;\; \mathrm{Re}=\frac{\rho U L}{\mu}`} />
              <p>
                <LocaleText
                  id="mathFormulaContextBody"
                  fallback="Every lab links to governing equations and explicit assumptions."
                />
              </p>
            </div>
            <div className="card">
              <h3><LocaleText id="mathPrecisionChecks" fallback="Precision Checks" /></h3>
              <p>
                <LocaleText
                  id="mathPrecisionChecksBody"
                  fallback="Unit validation, sensitivity diagnostics, and stability warnings before you simulate."
                />
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="mathNavigator" fallback="Math Navigator" /></h2>
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="mathSymbolicWorkbench" fallback="Symbolic Workbench" /></h3>
            <p>
              <LocaleText
                id="mathSymbolicWorkbenchBody"
                fallback="Simplify expressions, compute derivatives, and estimate integrals."
              />
            </p>
            <p><Link href="/labs/math/symbolic"><LocaleText id="mathOpenSymbolic" fallback="Open symbolic tools" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathSymbolicAssumptions" fallback="Symbolic Assumptions" /></h3>
            <p>
              <LocaleText
                id="mathSymbolicAssumptionsBody"
                fallback="Apply small/large/positive assumptions to simplify equations."
              />
            </p>
            <p><Link href="/labs/math/assumptions"><LocaleText id="mathOpenAssumptions" fallback="Open assumptions lab" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathCasTitle" fallback="Full CAS (SymPy)" /></h3>
            <p><LocaleText id="mathCasBody" fallback="Symbolic solve, simplify, integrate, and unit-aware transformations with step-by-step derivations." /></p>
            <p><Link href="/labs/math/cas"><LocaleText id="mathOpenCas" fallback="Open CAS workspace" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathGraphingCalculator" fallback="Graphing Calculator" /></h3>
            <p><LocaleText id="mathGraphingCalculatorBody" fallback="GeoGebra-style plotting with geometry tools and snapping." /></p>
            <p><Link href="/labs/math/graphing"><LocaleText id="mathOpenGraphingTools" fallback="Open graphing tools" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathEquationWorkbench" fallback="Equation Workbench" /></h3>
            <p><LocaleText id="mathEquationWorkbenchBody" fallback="Build custom ODEs, sweep parameters, and compare solutions." /></p>
            <p><Link href="/labs/math/workbench"><LocaleText id="mathOpenWorkbench" fallback="Open workbench" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathFormulaLibrary" fallback="Formula Library" /></h3>
            <p><LocaleText id="mathFormulaLibraryBody" fallback="Canonical equations with variables, assumptions, and notes." /></p>
            <p><Link href="/labs/math/formulas"><LocaleText id="mathOpenFormulaLibrary" fallback="Open formula library" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathDerivationMode" fallback="Derivation Mode" /></h3>
            <p><LocaleText id="mathDerivationModeBody" fallback="Follow governing equations, assumptions, and validity windows." /></p>
            <p><Link href="/labs/math/derivation"><LocaleText id="mathOpenDerivationMode" fallback="Open derivation mode" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathApproximationComparator" fallback="Approximation Comparator" /></h3>
            <p><LocaleText id="mathApproximationComparatorBody" fallback="Compare exact vs approximate models with error metrics." /></p>
            <p><Link href="/labs/math/approximations"><LocaleText id="mathOpenComparator" fallback="Open comparator" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathIntegrationTitle" fallback="Integration Calculator" /></h3>
            <p><LocaleText id="mathIntegrationBody" fallback="Simpson, Gauss, midpoint, and cumulative area diagnostics." /></p>
            <p><Link href="/labs/math/integration"><LocaleText id="mathOpenIntegration" fallback="Open integration" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathCalculusTitle" fallback="Derivative + Integral Calculator" /></h3>
            <p><LocaleText id="mathCalculusBody" fallback="Visualize derivatives and antiderivatives with custom colors." /></p>
            <p><Link href="/labs/math/calculus"><LocaleText id="mathOpenCalculus" fallback="Open calculus tools" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathRootFinderTitle" fallback="Root Finder" /></h3>
            <p><LocaleText id="mathRootFinderBody" fallback="Bisection, secant, and Newton iteration diagnostics." /></p>
            <p><Link href="/labs/math/roots"><LocaleText id="mathOpenRootFinder" fallback="Open root finder" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathOptimizationTitle" fallback="Optimization Lab" /></h3>
            <p><LocaleText id="mathOptimizationBody" fallback="Gradient descent with momentum and convergence tracking." /></p>
            <p><Link href="/labs/math/optimization"><LocaleText id="mathOpenOptimization" fallback="Open optimization" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathInterpolationTitle" fallback="Interpolation Lab" /></h3>
            <p><LocaleText id="mathInterpolationBody" fallback="Sample data and build interpolating polynomials." /></p>
            <p><Link href="/labs/math/interpolation"><LocaleText id="mathOpenInterpolation" fallback="Open interpolation" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathDifferentiationTitle" fallback="Numerical Differentiation" /></h3>
            <p><LocaleText id="mathDifferentiationBody" fallback="Finite differences with error comparison." /></p>
            <p><Link href="/labs/math/differentiation"><LocaleText id="mathOpenDifferentiation" fallback="Open differentiation" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathCurveFittingTitle" fallback="Curve Fitting" /></h3>
            <p><LocaleText id="mathCurveFittingBody" fallback="Regression models with R² diagnostics." /></p>
            <p><Link href="/labs/math/fitting"><LocaleText id="mathOpenCurveFitting" fallback="Open curve fitting" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathConnectionsCardTitle" fallback="Math Connections Mode" /></h3>
            <p><LocaleText id="mathConnectionsCardBody" fallback="Link discrete maps, stability, and physical intuition." /></p>
            <p><Link href="/labs/math/connections"><LocaleText id="mathConnectionsCardLink" fallback="Open math connections" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathGlossary" fallback="Glossary" /></h3>
            <p><LocaleText id="mathGlossaryBody" fallback="Definitions and notation used across the platform." /></p>
            <p><Link href="/formulas/glossary"><LocaleText id="mathOpenGlossary" fallback="Open glossary" /></Link></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="mathScalingRegimes" fallback="Scaling + Regimes" /></h2>
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="mathScalingExplorer" fallback="Scaling Explorer" /></h3>
            <p><LocaleText id="mathScalingExplorerBody" fallback="Characteristic scales, nondimensional time, and similarity checks." /></p>
            <p><Link href="/labs/math/scaling/explorer"><LocaleText id="mathOpenScalingExplorer" fallback="Open scaling explorer" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathDimensionlessGroups" fallback="Dimensionless Groups" /></h3>
            <p><LocaleText id="mathDimensionlessGroupsBody" fallback="Re, Pr, Ma, Fr, Gr, Ra, We with regime hints." /></p>
            <p><Link href="/labs/math/scaling/groups"><LocaleText id="mathOpenDimensionlessGroups" fallback="Open dimensionless groups" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathAsymptoticRegimes" fallback="Asymptotic Regimes" /></h3>
            <p><LocaleText id="mathAsymptoticRegimesBody" fallback="Log-log slope analysis and dominant balance cues." /></p>
            <p><Link href="/labs/math/regimes"><LocaleText id="mathOpenRegimes" fallback="Open regimes" /></Link></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="mathSeriesLinearization" fallback="Series + Linearization" /></h2>
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="mathTaylorSeries" fallback="Taylor Series" /></h3>
            <p><LocaleText id="mathTaylorSeriesBody" fallback="Custom functions with local approximation errors." /></p>
            <p><Link href="/labs/math/series/taylor"><LocaleText id="mathOpenTaylorExplorer" fallback="Open Taylor explorer" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathFourierSeries" fallback="Fourier Series" /></h3>
            <p><LocaleText id="mathFourierSeriesBody" fallback="Harmonic builder and spectral fidelity checks." /></p>
            <p><Link href="/labs/math/series/fourier"><LocaleText id="mathOpenFourierBuilder" fallback="Open Fourier builder" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathLinearization" fallback="Linearization + Jacobian" /></h3>
            <p><LocaleText id="mathLinearizationBody" fallback="Find equilibria, classify stability, and view Jacobians." /></p>
            <p><Link href="/labs/math/linearization"><LocaleText id="mathOpenLinearization" fallback="Open linearization" /></Link></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="mathAccuracySensitivity" fallback="Accuracy + Sensitivity" /></h2>
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="mathSensitivityAnalysis" fallback="Sensitivity Analysis" /></h3>
            <p><LocaleText id="mathSensitivityAnalysisBody" fallback="Partial derivatives and normalized sensitivity metrics." /></p>
            <p><Link href="/labs/math/sensitivity"><LocaleText id="mathOpenSensitivity" fallback="Open sensitivity" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathTimestepAccuracy" fallback="Timestep Accuracy" /></h3>
            <p><LocaleText id="mathTimestepAccuracyBody" fallback="Explore error vs step size and solver behavior." /></p>
            <p><Link href="/labs/math/stability/timestep"><LocaleText id="mathOpenTimestepAccuracy" fallback="Open timestep accuracy" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathStabilityRegions" fallback="Stability Regions" /></h3>
            <p><LocaleText id="mathStabilityRegionsBody" fallback="Stability maps and CFL-style limits." /></p>
            <p><Link href="/labs/math/stability/regions"><LocaleText id="mathOpenStabilityRegions" fallback="Open stability regions" /></Link></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="mathUnitsNondim" fallback="Units + Nondimensionalization" /></h2>
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="mathUnitConsistency" fallback="Unit Consistency" /></h3>
            <p><LocaleText id="mathUnitConsistencyBody" fallback="Check dimensional consistency for custom expressions." /></p>
            <p><Link href="/labs/math/units"><LocaleText id="mathOpenUnitChecker" fallback="Open unit checker" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathDerivedUnits" fallback="Derived Units" /></h3>
            <p><LocaleText id="mathDerivedUnitsBody" fallback="Identify derived SI units and match dimensions to symbols." /></p>
            <p><Link href="/labs/math/units/derived"><LocaleText id="mathOpenDerivedUnits" fallback="Open derived units" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathNondimensionalization" fallback="Nondimensionalization" /></h3>
            <p><LocaleText id="mathNondimensionalizationBody" fallback="Compute dimensionless variables from characteristic scales." /></p>
            <p><Link href="/labs/math/nondimensional"><LocaleText id="mathOpenNondimensionalization" fallback="Open nondimensionalization" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathLinearAlgebra" fallback="Linear Algebra" /></h3>
            <p><LocaleText id="mathLinearAlgebraBody" fallback="Solve systems and inspect eigenstructure." /></p>
            <p><Link href="/labs/math/linear-algebra"><LocaleText id="mathOpenLinearAlgebra" fallback="Open linear algebra" /></Link></p>
          </div>
        </div>
      </section>
    </>
  );
}
