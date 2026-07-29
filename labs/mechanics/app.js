window.addEventListener('DOMContentLoaded', () => {
  const els = {
    v0: document.getElementById('v0'),
    angle: document.getElementById('angle'),
    h0: document.getElementById('h0'),
    g: document.getElementById('g'),
    run: document.getElementById('run-btn'),
    reset: document.getElementById('reset-btn'),
    flight: document.getElementById('flight'),
    range: document.getElementById('range'),
    impact: document.getElementById('impact'),
    assumptions: document.getElementById('assumptions'),
  };

  function readNum(id, fallback) {
    const v = parseFloat(els[id].value);
    return Number.isFinite(v) && v > 0 ? v : fallback;
  }

  function degToRad(deg) {
    return deg * Math.PI / 180;
  }

  function solveProjectile(v0, theta, h0, g) {
    const vx = v0 * Math.cos(theta);
    const vy = v0 * Math.sin(theta);
    const a = -0.5 * g;
    const b = vy;
    const c = h0;

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
      return {
        valid: false,
        error: 'No real landing time with these inputs. Increase speed or reduce height/gravity.',
        vx,
        vy,
        path: [],
        tFlight: null,
        range: null,
        maxHeight: null,
        timeToMaxHeight: null,
      };
    }

    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const tFlight = Math.max(t1, t2);

    const timeToMaxHeight = t1;
    const maxHeight = h0 + vy * timeToMaxHeight - 0.5 * g * timeToMaxHeight * timeToMaxHeight;
    const range = vx * tFlight;

    const steps = 120;
    const path = [];
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * tFlight;
      const x = vx * t;
      const y = h0 + vy * t - 0.5 * g * t * t;
      path.push({ t, x, y, vx, vy: vy - g * t });
    }

    const impactVy = vy - g * tFlight;
    const impactSpeed = Math.sqrt(vx * vx + impactVy * impactVy);

    return {
      valid: true,
      vx,
      vy,
      path,
      tFlight,
      range,
      maxHeight,
      timeToMaxHeight,
      impactSpeed,
    };
  }

  function renderResults(result) {
    if (!result.valid) {
      els.flight.textContent = result.error;
      els.range.textContent = '-';
      els.impact.textContent = '-';
      return;
    }

    els.flight.textContent = JSON.stringify({
      flightTime: result.tFlight.toFixed(3) + ' s',
      timeToMaxHeight: result.timeToMaxHeight.toFixed(3) + ' s',
    }, null, 2);

    els.range.textContent = JSON.stringify({
      range: result.range.toFixed(3) + ' m',
      maxHeight: result.maxHeight.toFixed(3) + ' m',
    }, null, 2);

    els.impact.textContent = JSON.stringify({
      impactSpeed: result.impactSpeed.toFixed(3) + ' m/s',
      impactAngle: (Math.atan2(Math.abs(result.vy - result.g * result.tFlight), result.vx) * 180 / Math.PI).toFixed(2) + '°',
    }, null, 2);
  }

  function renderPlots(result) {
    Plotly.newPlot('trajectory-plot', [{
      x: result.path.map(p => p.x),
      y: result.path.map(p => p.y),
      mode: 'lines',
      line: { shape: 'spline' },
    }], {
      xaxis: { title: 'Distance (m)' },
      yaxis: { title: 'Height (m)', scaleanchor: 'x', scaleratio: 1 },
      margin: { t: 20, r: 20, b: 40, l: 50 },
    }, { responsive: true, displayModeBar: false });

    Plotly.newPlot('velocity-plot', [
      {
        x: result.path.map(p => p.t),
        y: result.path.map(p => p.vx),
        mode: 'lines',
        name: 'vx',
        line: { shape: 'spline' },
      },
      {
        x: result.path.map(p => p.t),
        y: result.path.map(p => p.vy),
        mode: 'lines',
        name: 'vy',
        line: { shape: 'spline' },
      }
    ], {
      xaxis: { title: 'Time (s)' },
      yaxis: { title: 'Velocity (m/s)' },
      margin: { t: 20, r: 20, b: 40, l: 50 },
    }, { responsive: true, displayModeBar: false });
  }

  els.run.addEventListener('click', () => {
    const v0 = readNum('v0', 30);
    const angleDeg = readNum('angle', 45);
    const h0 = readNum('h0', 0);
    const g = readNum('g', 9.81);
    const theta = degToRad(angleDeg);

    const result = solveProjectile(v0, theta, h0, g);
    renderResults(result);
    if (result.valid) {
      renderPlots(result);
    }
  });

  els.reset.addEventListener('click', () => {
    els.v0.value = '30';
    els.angle.value = '45';
    els.h0.value = '0';
    els.g.value = '9.81';
    els.flight.textContent = '-';
    els.range.textContent = '-';
    els.impact.textContent = '-';
  });
});
