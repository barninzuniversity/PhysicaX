window.addEventListener('DOMContentLoaded', () => {
  const R = 8.314462618;
  const Cp_over_Cv_default = 1.4;
  const monatomic_Cv = 3/2 * R;
  const monatomic_Cp = 5/2 * R;

  const els = {
    process: document.getElementById('process'),
    n: document.getElementById('n-moles'),
    gamma: document.getElementById('gamma'),
    p1: document.getElementById('p-init'),
    v1: document.getElementById('v-init'),
    t1: document.getElementById('t-init'),
    v2: document.getElementById('v-final'),
    m: document.getElementById('polytropic-n'),
    run: document.getElementById('run-btn'),
    save: document.getElementById('save-btn'),
    reset: document.getElementById('reset-btn'),
    initial: document.getElementById('initial-state'),
    final: document.getElementById('final-state'),
    scalars: document.getElementById('scalars'),
    assumptions: document.getElementById('assumptions'),
    savedList: document.getElementById('saved-list'),
  };

  let saved = [];

  function readNum(id, fallback) {
    const v = parseFloat(els[id].value);
    return Number.isFinite(v) && v > 0 ? v : fallback;
  }

  function toBar(pa) { return pa / 1e5; }
  function toL(m3) { return m3 * 1000; }

  function fmtSI(num) {
    if (num >= 1e6) return num.toExponential(3) + ' Pa';
    if (num >= 1) return num.toFixed(2) + ' Pa';
    if (num >= 1e-3) return (num * 1e3).toFixed(2) + ' mPa';
    return num.toExponential(3) + ' Pa';
  }

  function solveIdealGas(P, V, n, T) {
    if (!Number.isFinite(P)) P = (n * R * T) / V;
    else if (!Number.isFinite(V)) V = (n * R * T) / P;
    else if (!Number.isFinite(T)) T = (P * V) / (n * R);
    return { P, V, T };
  }

  function computeProcess() {
    const process = els.process.value;
    const n = readNum('n', 1);
    const gamma = readNum('gamma', Cp_over_Cv_default);
    const P1 = readNum('p1', 101325);
    const V1 = readNum('v1', 0.0224);
    const T1 = readNum('t1', 273.15);
    const V2 = readNum('v2', V1 * 2);
    const m = readNum('m', 1.3);

    const state1 = solveIdealGas(P1, V1, n, T1);
    const Cp = gamma * R / (gamma - 1);
    const Cv = Cp - R;

    let state2 = { ...state1 };
    let W = 0;
    let Q = 0;
    let dU = 0;
    let warnings = [];

    const guardLog = (x) => (Number.isFinite(x) ? x : NaN);

    if (process === 'isothermal') {
      state2.T = state1.T;
      state2.P = (state1.P * state1.V) / state2.V;
      W = n * R * state1.T * Math.log(state2.V / state1.V);
      Q = W;
      dU = 0;
    } else if (process === 'isochoric') {
      state2.V = state1.V;
      state2.T = state1.T * 1.5;
      state2.P = state1.P * 1.5;
      W = 0;
      dU = n * Cv * (state2.T - state1.T);
      Q = dU;
      warnings.push('Isochoric demo uses a default temperature ratio. Specify final T or added heat in a later version for exact control.');
    } else if (process === 'isobaric') {
      state2.P = state1.P;
      state2.T = state1.T * (state2.V / state1.V);
      state2.P = state1.P;
      W = state1.P * (state2.V - state1.V);
      dU = n * Cv * (state2.T - state1.T);
      Q = dU + W;
    } else if (process === 'adiabatic') {
      const safeGamma = Math.max(gamma, 1.01);
      const ratio = Math.max(state1.V / state2.V, 0.01);
      state2.P = state1.P * Math.pow(ratio, safeGamma);
      state2.T = state1.T * Math.pow(ratio, safeGamma - 1);
      W = (state1.P * state1.V - state2.P * state2.V) / (safeGamma - 1);
      dU = -W;
      Q = 0;
      if (gamma !== safeGamma) {
        warnings.push('Adiabatic gamma was too close to 1; clamped to 1.01 to avoid singularity.');
      }
      if (state2.T <= 0) {
        warnings.push('Adiabatic expansion produced non-physical temperature. Reduce volume ratio or increase gamma.');
      }
    } else if (process === 'polytropic') {
      if (Math.abs(m - 1) < 1e-9) {
        warnings.push('Polytropic exponent ~1; switching to isothermal approximation.');
        state2.T = state1.T;
        state2.P = (state1.P * state1.V) / state2.V;
        W = n * R * state1.T * Math.log(state2.V / state1.V);
        Q = W;
        dU = 0;
      } else {
        state2.P = state1.P * Math.pow(state1.V / state2.V, m);
        state2.T = state1.P * state1.V / (n * R) * Math.pow(state1.V / state2.V, m - 1);
        W = (state2.P * state2.V - state1.P * state1.V) / (1 - m);
        dU = n * Cv * (state2.T - state1.T);
        Q = dU + W;
      }
    }

    const steps = 60;
    const pvPoints = [];
    const tsPoints = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const V = state1.V + (state2.V - state1.V) * t;
      let P = state1.P;
      let T = state1.T;
      if (process === 'isothermal') {
        P = (state1.P * state1.V) / V;
        T = state1.T;
      } else if (process === 'isochoric') {
        P = state1.P + (state2.P - state1.P) * t;
        T = state1.T + (state2.T - state1.T) * t;
      } else if (process === 'isobaric') {
        P = state1.P;
        T = state1.T * (V / state1.V);
      } else if (process === 'adiabatic') {
        P = state1.P * Math.pow(state1.V / V, gamma);
        T = state1.T * Math.pow(state1.V / V, gamma - 1);
      } else if (process === 'polytropic') {
        if (Math.abs(m - 1) < 1e-9) {
          P = (state1.P * state1.V) / V;
          T = state1.T;
        } else {
          P = state1.P * Math.pow(state1.V / V, m);
          T = state1.P * state1.V / (n * R) * Math.pow(state1.V / V, m - 1);
        }
      }
      pvPoints.push({ x: V, y: P });
      tsPoints.push({ x: T, y: n * R * Math.log(V / state1.V) + n * Cv * Math.log(T / state1.T) });
    }

    return {
      state1,
      state2: { ...state2, m },
      W,
      Q,
      dU,
      Cv,
      Cp,
      gamma,
      process,
      pvPoints,
      tsPoints,
      warnings: [
        ...warnings,
        ...(state2.T <= 0 ? ['Final temperature is not positive. Check inputs.'] : []),
        ...(state2.P <= 0 ? ['Final pressure is not positive. Check inputs.'] : []),
      ],
    };
  }

  function renderResults(result) {
    els.initial.textContent = JSON.stringify({
      process: result.process,
      P1: fmtSI(result.state1.P),
      V1: toL(result.state1.V).toFixed(4) + ' L',
      T1: result.state1.T.toFixed(2) + ' K',
    }, null, 2);

    els.final.textContent = JSON.stringify({
      P2: fmtSI(result.state2.P),
      V2: toL(result.state2.V).toFixed(4) + ' L',
      T2: result.state2.T.toFixed(2) + ' K',
    }, null, 2);

    els.scalars.textContent = JSON.stringify({
      W: result.W.toExponential(4) + ' J',
      Q: result.Q.toExponential(4) + ' J',
      dU: result.dU.toExponential(4) + ' J',
    }, null, 2);

    els.assumptions.textContent = result.warnings.length
      ? result.warnings.join('\n')
      : 'No warnings for this run. Calculations are idealized reversible ideal-gas estimates.';
  }

  function renderPlots(result) {
    Plotly.newPlot('pv-plot', [{
      x: result.pvPoints.map(p => toL(p.x)),
      y: result.pvPoints.map(p => toBar(p.y)),
      mode: 'lines',
      line: { shape: 'spline' },
    }], {
      xaxis: { title: 'Volume (L)' },
      yaxis: { title: 'Pressure (bar)' },
      margin: { t: 20, r: 20, b: 40, l: 50 },
    }, { responsive: true, displayModeBar: false });

    Plotly.newPlot('ts-plot', [{
      x: result.tsPoints.map(p => p.x),
      y: result.tsPoints.map(p => p.y),
      mode: 'lines',
      line: { shape: 'spline' },
    }], {
      xaxis: { title: 'Temperature (K)' },
      yaxis: { title: 'ΔS (J/K)' },
      margin: { t: 20, r: 20, b: 40, l: 50 },
    }, { responsive: true, displayModeBar: false });
  }

  els.run.addEventListener('click', () => {
    const result = computeProcess();
    renderResults(result);
    renderPlots(result);
  });

  els.reset.addEventListener('click', () => {
    els.process.value = 'adiabatic';
    els.n.value = '1';
    els.gamma.value = '1.4';
    els.p1.value = '101325';
    els.v1.value = '0.0224';
    els.t1.value = '273.15';
    els.v2.value = '0.0448';
    els.m.value = '1.3';
    els.initial.textContent = 'Run a simulation to see results.';
    els.final.textContent = '-';
    els.scalars.textContent = '-';
    els.assumptions.textContent = '-';
  });

  els.save.addEventListener('click', () => {
    const payload = {
      id: Date.now().toString(36),
      createdAt: new Date().toISOString(),
      process: els.process.value,
      n: els.n.value,
      gamma: els.gamma.value,
      p1: els.p1.value,
      v1: els.v1.value,
      t1: els.t1.value,
      v2: els.v2.value,
      m: els.m.value,
    };
    saved.unshift(payload);
    if (!window.localStorage) {
      els.savedList.innerHTML = '<p class="muted">Local storage unavailable.</p>';
      return;
    }
    window.localStorage.setItem('physicax_thermo_saved', JSON.stringify(saved));
    renderSaved();
  });

  function renderSaved() {
    if (!saved.length) {
      els.savedList.innerHTML = '<p class="muted">No saved experiments yet.</p>';
      return;
    }
    els.savedList.innerHTML = saved.map((item) => `
      <div class="saved-card">
        <div><strong>${item.process}</strong></div>
        <div class="muted">${item.createdAt}</div>
        <div>n=${item.n}, γ=${item.gamma}, P₁=${item.p1} Pa, V₁=${item.v1} m³</div>
      </div>
    `).join('');
  }

  const stored = window.localStorage.getItem('physicax_thermo_saved');
  if (stored) {
    try {
      saved = JSON.parse(stored);
      renderSaved();
    } catch (_e) {}
  }
});
