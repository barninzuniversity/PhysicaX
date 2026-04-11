export const degToRad = (deg: number) => (deg * Math.PI) / 180;
export const radToDeg = (rad: number) => (rad * 180) / Math.PI;

export const celsiusToKelvin = (c: number) => c + 273.15;
export const kelvinToCelsius = (k: number) => k - 273.15;

export const atmToPa = (atm: number) => atm * 101325;
export const barToPa = (bar: number) => bar * 1e5;
export const literToM3 = (liter: number) => liter * 1e-3;
