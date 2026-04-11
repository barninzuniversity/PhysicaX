export type ODEState = number[];
export type ODEFunc = (t: number, y: ODEState) => ODEState;

export const rk4Step = (t: number, y: ODEState, h: number, f: ODEFunc): ODEState => {
  const k1 = f(t, y);
  const y2 = y.map((yi, i) => yi + 0.5 * h * k1[i]);
  const k2 = f(t + 0.5 * h, y2);
  const y3 = y.map((yi, i) => yi + 0.5 * h * k2[i]);
  const k3 = f(t + 0.5 * h, y3);
  const y4 = y.map((yi, i) => yi + h * k3[i]);
  const k4 = f(t + h, y4);
  return y.map((yi, i) => yi + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
};

export const integrateRK4 = (f: ODEFunc, y0: ODEState, t0: number, t1: number, steps: number) => {
  const dt = (t1 - t0) / Math.max(1, steps);
  const series: Array<{ t: number; y: ODEState }> = [];
  let t = t0;
  let y = [...y0];
  for (let i = 0; i <= steps; i += 1) {
    series.push({ t, y: [...y] });
    y = rk4Step(t, y, dt, f);
    t += dt;
  }
  return { series, dt };
};

export const secondOrderToFirstOrder = (g: (t: number, x: number, v: number) => number): ODEFunc => {
  return (t, y) => {
    const x = y[0];
    const v = y[1];
    return [v, g(t, x, v)];
  };
};
