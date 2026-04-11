export const ellipticK = (k: number) => {
  if (!Number.isFinite(k) || k < 0 || k >= 1) {
    return NaN;
  }
  let a = 1;
  let b = Math.sqrt(1 - k * k);
  for (let i = 0; i < 50; i += 1) {
    const an = (a + b) / 2;
    const bn = Math.sqrt(a * b);
    if (Math.abs(an - bn) < 1e-12) {
      a = an;
      b = bn;
      break;
    }
    a = an;
    b = bn;
  }
  return Math.PI / (2 * a);
};
