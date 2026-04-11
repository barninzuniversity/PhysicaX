import { degToRad, radToDeg } from "../units";
import { integrateRK4, secondOrderToFirstOrder } from "../solvers";
import { ellipticK } from "../math";

type PendulumInput = {
  theta0Deg: number;
  omega0Deg: number;
  length: number;
  g: number;
  damping: number;
  duration: number;
  steps: number;
};

export const pendulumPeriods = (theta0Deg: number, length: number, g: number) => {
  if (!Number.isFinite(theta0Deg) || !Number.isFinite(length) || !Number.isFinite(g) || length <= 0 || g <= 0) {
    return { smallAngle: NaN, exact: NaN };
  }
  const theta0 = degToRad(theta0Deg);
  const smallAngle = 2 * Math.PI * Math.sqrt(length / g);
  const k = Math.sin(theta0 / 2);
  const exact = 4 * Math.sqrt(length / g) * ellipticK(k);
  return { smallAngle, exact };
};

export const simulatePendulum = (input: PendulumInput) => {
  const { theta0Deg, omega0Deg, length, g, damping, duration, steps } = input;
  if (
    !Number.isFinite(theta0Deg) ||
    !Number.isFinite(omega0Deg) ||
    !Number.isFinite(length) ||
    !Number.isFinite(g) ||
    !Number.isFinite(damping) ||
    !Number.isFinite(duration) ||
    !Number.isFinite(steps) ||
    length <= 0 ||
    g <= 0 ||
    duration <= 0 ||
    steps <= 1
  ) {
    return { points: [], thetaSeries: [], omegaSeries: [], energy: [], dt: NaN };
  }

  const theta0 = degToRad(theta0Deg);
  const omega0 = degToRad(omega0Deg);
  const accel = (t: number, theta: number, omega: number) => -(g / length) * Math.sin(theta) - damping * omega;
  const ode = secondOrderToFirstOrder(accel);

  const { series, dt } = integrateRK4(ode, [theta0, omega0], 0, duration, steps);
  const points: Array<{ x: number; y: number }> = [];
  const thetaSeries: number[] = [];
  const omegaSeries: number[] = [];
  const energy: number[] = [];

  series.forEach(({ t, y }) => {
    const theta = y[0];
    const omega = y[1];
    points.push({ x: t, y: radToDeg(theta) });
    thetaSeries.push(theta);
    omegaSeries.push(omega);
    const e = 0.5 * length * length * omega * omega + g * length * (1 - Math.cos(theta));
    energy.push(e);
  });

  return { points, thetaSeries, omegaSeries, energy, dt };
};
