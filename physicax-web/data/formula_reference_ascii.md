# PhysicaX Formula Reference Pack (Corrected)

This is a cleaned, corrected formula reference based on the guide. All formulas are stated in SI units unless noted.

## 0) Global Rules
- Keep one canonical source of truth per model.
- Store assumptions, valid domains, units, and singularities for every formula.
- Convert inputs to SI, compute in SI, convert outputs only for display.
- Use explicit sign conventions for work and heat. This pack uses: W = work done by the system.

## 1) Physical Constants (SI)
- R = 8.314462618 J/(mol*K)
- kB = 1.380649e-23 J/K
- g0 = 9.80665 m/s^2
- G = 6.67430e-11 m^3/(kg*s^2)
- epsilon0 = 8.8541878128e-12 F/m
- 1 atm = 101325 Pa
- 1 bar = 1e5 Pa
- 1 L = 1e-3 m^3

## 2) ThermoLab
### 2.1 Ideal Gas Law
Formula:
PV = n R T
Assumptions: ideal gas, equilibrium, macroscopic state.
Domain: P>0, V>0, T>0, n>0.

### 2.2 Internal Energy (Ideal Gas)
Formula:
U = n Cv T
DeltaU = n Cv (T2 - T1)
Monatomic ideal gas: Cv = (3/2) R, so U = (3/2) n R T.

### 2.3 Enthalpy (Ideal Gas)
Formula:
H = U + P V = n Cp T
DeltaH = n Cp (T2 - T1)

### 2.4 First Law of Thermodynamics
Convention: W = work done by the system, Q = heat added to the system.
Formula:
DeltaU = Q - W
Q = DeltaU + W

### 2.5 Isothermal Process (Ideal Gas, Reversible)
T = const, PV = const
Work:
W = n R T ln(V2/V1) = n R T ln(P1/P2)
DeltaU = 0, so Q = W.

### 2.6 Isochoric Process
V = const
W = 0
Q = DeltaU = n Cv (T2 - T1)

### 2.7 Isobaric Process
P = const
W = P (V2 - V1) = n R (T2 - T1)
Q = n Cp (T2 - T1)
DeltaU = n Cv (T2 - T1)

### 2.8 Reversible Adiabatic (Ideal Gas)
Q = 0
Relations:
P V^gamma = const
T V^(gamma-1) = const
T^gamma P^(1-gamma) = const
Work:
W = (P1 V1 - P2 V2) / (gamma - 1) = n Cv (T1 - T2)

### 2.9 Polytropic Process
P V^m = const
Work (m != 1):
W = (P2 V2 - P1 V1) / (1 - m)
Special case m -> 1 (isothermal):
W = n R T ln(V2/V1)

### 2.10 Entropy Change (Ideal Gas)
DeltaS = n Cv ln(T2/T1) + n R ln(V2/V1)
Equivalent form:
DeltaS = n Cp ln(T2/T1) - n R ln(P2/P1)
Reversible adiabatic: DeltaS = 0.

### 2.11 Carnot Engine
Efficiency:
eta = 1 - Tc/Th
Temperatures in Kelvin.

### 2.12 Otto Cycle (Air-Standard)
Compression ratio: r = V1/V2
Efficiency:
eta = 1 - 1 / r^(gamma-1)

### 2.13 Diesel Cycle (Air-Standard)
Compression ratio: r = V1/V2
Cutoff ratio: rho = V3/V2
Efficiency:
eta = 1 - (1 / r^(gamma-1)) * ((rho^gamma - 1) / (gamma * (rho - 1)))

### 2.14 Brayton Cycle (Ideal)
Pressure ratio: rp = P2/P1
Efficiency:
eta = 1 - 1 / rp^((gamma-1)/gamma)

### 2.15 Maxwell-Boltzmann Speed Distribution
Distribution:
 f(v) = 4 pi (m/(2 pi kB T))^(3/2) v^2 exp(-m v^2/(2 kB T))
Characteristic speeds:
 v_mp = sqrt(2 kB T / m)
 v_mean = sqrt(8 kB T / (pi m))
 v_rms = sqrt(3 kB T / m)

### 2.16 Boltzmann Factor
Probability:
 p_i = exp(-E_i/(kB T)) / Z
Partition function:
 Z = sum_i exp(-E_i/(kB T))

### 2.17 Two-Level System (E0 = 0, E1 = E)
Z = 1 + exp(-E/(kB T))
p0 = 1/Z
p1 = exp(-E/(kB T)) / Z
Mean energy:
<E> = E * p1

### 2.18 Newton's Law of Cooling
dT/dt = -k (T - T_env)
Solution:
T(t) = T_env + (T0 - T_env) exp(-k t)
Assumption: lumped system, constant ambient temperature, k>0.

## 3) MechanicsLab
### 3.1 Constant Acceleration Kinematics
x = x0 + v0 t + (1/2) a t^2
v = v0 + a t
v^2 = v0^2 + 2 a (x - x0)

### 3.2 Projectile Motion (No Drag)
x(t) = x0 + v0 cos(theta) t
y(t) = y0 + v0 sin(theta) t - (1/2) g t^2
Time of flight (same height): tf = 2 v0 sin(theta) / g
Range: R = v0^2 sin(2 theta) / g
Max height: y_max - y0 = v0^2 sin^2(theta) / (2 g)

### 3.3 Linear Drag
Drag force: Fd = -b v
Equation of motion: m dv/dt = sumF - b v
Example vertical motion with gravity:
 v(t) = (v0 + (m g / b)) exp(-(b/m) t) - (m g / b)
Terminal speed magnitude: v_t = m g / b

### 3.4 Quadratic Drag
Drag force: Fd = -(1/2) rho Cd A |v| v
Use numerical integration (RK4 or adaptive).

### 3.5 Newton's Second Law
sumF = m a

### 3.6 Work
Constant force: W = F dot Delta x
Variable force: W = integral(F dot dx)

### 3.7 Kinetic Energy
K = (1/2) m v^2

### 3.8 Gravitational Potential (Near Earth)
U = m g h

### 3.9 Spring Potential Energy
U = (1/2) k x^2

### 3.10 Hooke's Law
F = -k x

### 3.11 Simple Harmonic Motion (Mass-Spring)
Equation: x'' + (k/m) x = 0
omega = sqrt(k/m)
Solution: x(t) = A cos(omega t + phi)
Period: T = 2 pi / omega
Energy: E = (1/2) k A^2

### 3.12 Damped Harmonic Oscillator
Equation: x'' + 2 gamma x' + omega0^2 x = 0
gamma = c/(2m), omega0 = sqrt(k/m)
Underdamped: gamma < omega0
Critical: gamma = omega0
Overdamped: gamma > omega0

### 3.13 Driven Damped Oscillator
Equation: x'' + 2 gamma x' + omega0^2 x = (F0/m) cos(omega t)
Steady-state amplitude:
A = (F0/m) / sqrt((omega0^2 - omega^2)^2 + (2 gamma omega)^2)
Phase lag:
 tan(delta) = (2 gamma omega) / (omega0^2 - omega^2)

### 3.14 Simple Pendulum (Exact)
Equation: theta'' + (g/L) sin(theta) = 0

### 3.15 Small-Angle Pendulum
If |theta| << 1 rad, sin(theta) approx theta:
theta'' + (g/L) theta = 0
Period: T = 2 pi sqrt(L/g)

### 3.16 Large-Amplitude Pendulum Period
T = 4 sqrt(L/g) K(k)
k = sin(theta0/2)
K is the complete elliptic integral of the first kind.

### 3.17 Double Pendulum (Standard Model)
Use one canonical implementation derived from the Lagrangian.
Common form with delta = theta1 - theta2:

theta1'' = ( -g(2 m1 + m2) sin(theta1) - m2 g sin(theta1 - 2 theta2)
            - 2 sin(delta) m2 (theta2'^2 L2 + theta1'^2 L1 cos(delta)) )
          / ( L1 (2 m1 + m2 - m2 cos(2 delta)) )

theta2'' = ( 2 sin(delta) ( theta1'^2 L1 (m1 + m2)
            + g (m1 + m2) cos(theta1) + theta2'^2 L2 m2 cos(delta) ) )
          / ( L2 (2 m1 + m2 - m2 cos(2 delta)) )

Test energy conservation when damping = 0.

### 3.18 Universal Gravitation
Magnitude: F = G m1 m2 / r^2
Vector: F12 = -G m1 m2 / r^3 * r_vec

### 3.19 Circular Orbit
v = sqrt(G M / r)
Period: T = 2 pi sqrt(r^3 / (G M))

### 3.20 Escape Velocity
v_esc = sqrt(2 G M / r)

### 3.21 Orbital Energy (Specific)
epsilon = v^2/2 - G M / r
For bound ellipse: epsilon = -G M / (2 a)

## 4) ChaosLab
### 4.1 Logistic Map
x_{n+1} = r x_n (1 - x_n)
Typical domain: 0 <= x_n <= 1, 0 <= r <= 4
Fixed points: x* = 0, x* = 1 - 1/r (r>1)
Stability: |f'(x*)| < 1

### 4.2 Lyapunov Exponent (1D Map)
lambda = lim_{N->inf} (1/N) sum_{n=0}^{N-1} ln |f'(x_n)|
For logistic map: f'(x) = r (1 - 2 x)

### 4.3 Tent Map
x_{n+1} = r x_n, for x_n < 1/2
x_{n+1} = r (1 - x_n), for x_n >= 1/2
Typical r in [0, 2].

### 4.4 Lorenz System
x' = sigma (y - x)
y' = x (rho - z) - y
z' = x y - beta z
Classic parameters: sigma = 10, rho = 28, beta = 8/3

### 4.5 Rossler System
x' = -y - z
y' = x + a y
z' = b + z (x - c)
Typical parameters: a = 0.2, b = 0.2, c = 5.7

### 4.6 Duffing Oscillator
x'' + delta x' + alpha x + beta x^3 = gamma cos(omega t)

## 5) WaveLab
### 5.1 Traveling Wave
y(x,t) = A sin(k x - omega t + phi)
Wave speed: v = omega / k
k = 2 pi / lambda, omega = 2 pi f

### 5.2 Standing Wave
y(x,t) = 2 A sin(k x) cos(omega t)

### 5.3 Beats
A cos(omega1 t) + A cos(omega2 t) =
2 A cos((omega1 - omega2) t / 2) cos((omega1 + omega2) t / 2)
Beat frequency: f_beat = |f1 - f2|

### 5.4 String Wave Speed
v = sqrt(T / mu)
T = tension, mu = linear mass density

### 5.5 Harmonics on String (Both Ends Fixed)
f_n = n v / (2 L), n = 1,2,3...

### 5.6 Air Columns
Open-open or closed-closed:
 f_n = n v / (2 L)
Open-closed:
 f_n = (2 n - 1) v / (4 L), n = 1,2,3...

### 5.7 Fourier Series (Period 2L)
f(x) = a0/2 + sum_{n=1}^inf [a_n cos(n pi x / L) + b_n sin(n pi x / L)]
Coefficients:
 a_n = (1/L) * integral_{-L}^{L} f(x) cos(n pi x / L) dx
 b_n = (1/L) * integral_{-L}^{L} f(x) sin(n pi x / L) dx

## 6) EMLab
### 6.1 Coulomb's Law
F = (1/(4 pi epsilon0)) * (q1 q2 / r^2) r_hat
k = 1/(4 pi epsilon0)

### 6.2 Electric Field of a Point Charge
E = k q / r^2 r_hat

### 6.3 Electric Potential of a Point Charge
V = k q / r

### 6.4 Potential Energy of Two Charges
U = k q1 q2 / r

### 6.5 Parallel-Plate Capacitor
C = epsilon0 A / d (vacuum)
Energy:
U = (1/2) C V^2 = Q^2/(2 C) = (1/2) Q V

### 6.6 RC Circuit
Charging:
 q(t) = C V (1 - exp(-t/(R C)))
 i(t) = (V/R) exp(-t/(R C))
Discharging:
 q(t) = Q0 exp(-t/(R C))
 i(t) = -(Q0/(R C)) exp(-t/(R C))
Time constant: tau = R C

### 6.7 RL Circuit
Growth:
 i(t) = (V/R) (1 - exp(-t/(L/R)))
Decay:
 i(t) = I0 exp(-t/(L/R))
Time constant: tau = L/R

### 6.8 RLC Circuit (Series)
Charge equation:
 L q'' + R q' + (1/C) q = V(t)
Natural frequency (ideal):
 omega0 = 1 / sqrt(L C)

## 7) ODE Lab (Numerical Methods)
### 7.1 First-Order ODE
 dy/dt = f(t, y)

### 7.2 Euler Method
 y_{n+1} = y_n + h f(t_n, y_n)
Global error O(h), local truncation O(h^2)

### 7.3 Heun (Improved Euler)
 Predictor: y* = y_n + h f(t_n, y_n)
 Corrector: y_{n+1} = y_n + (h/2) [f(t_n, y_n) + f(t_{n+1}, y*)]
Global error O(h^2)

### 7.4 RK4
 k1 = f(t_n, y_n)
 k2 = f(t_n + h/2, y_n + h k1/2)
 k3 = f(t_n + h/2, y_n + h k2/2)
 k4 = f(t_n + h, y_n + h k3)
 y_{n+1} = y_n + (h/6)(k1 + 2 k2 + 2 k3 + k4)
Global error O(h^4)

### 7.5 Convert Second-Order ODE to First-Order System
If x'' = f(t, x, x')
Let y1 = x, y2 = x'
Then y1' = y2, y2' = f(t, y1, y2)

### 7.6 Euler Stability Warning
Explicit Euler can add energy to oscillatory systems even if the true solution is bounded.
Warn users for SHO, pendulum, orbital systems when h is large.

## 8) PDE Lab
### 8.1 1D Heat Equation
 u_t = alpha u_xx

### 8.2 Explicit Finite Difference (Heat)
 u_i^{n+1} = u_i^n + r (u_{i+1}^n - 2 u_i^n + u_{i-1}^n)
 r = alpha * dt / dx^2
Stability (1D): r <= 1/2

### 8.3 1D Wave Equation
 u_tt = c^2 u_xx

### 8.4 Finite Difference (Wave)
 u_i^{n+1} = 2 u_i^n - u_i^{n-1} + s^2 (u_{i+1}^n - 2 u_i^n + u_{i-1}^n)
 s = c * dt / dx
Stability (1D): s <= 1

### 8.5 1D Diffusion Equation
 u_t = D u_xx
Same numerical form as heat equation with alpha replaced by D.

## 9) Statistical Physics / Monte Carlo
### 9.1 1D Random Walk
Step length: a, each step +-a
After N steps:
 <x> = 0
 <x^2> = N a^2
RMS displacement: x_rms = a sqrt(N)

### 9.2 Diffusion Connection
1D: <x^2> = 2 D t
2D: <r^2> = 4 D t
3D: <r^2> = 6 D t

## 10) Unit and Dimension Safety
- Always compute in SI units.
- Convert temperatures to Kelvin before use: T(K) = T(C) + 273.15
- Convert degrees to radians: rad = deg * pi / 180
- Convert pressures: 1 atm = 101325 Pa, 1 bar = 1e5 Pa
- Convert volume: 1 L = 1e-3 m^3

## 11) Validation and Sanity Rules (Summary)
- Energy conservation tests for conservative systems (SHO, pendulum, orbital motion, double pendulum).
- Entropy should not decrease for irreversible processes.
- Reject negative Kelvin temperatures, negative absolute pressure, and non-positive arguments in logs.
- Warn on unstable timesteps for explicit methods.

## 12) Recommended Canonical Model Set (First Wave)
- Thermo: ideal gas law, isothermal, isochoric, isobaric, reversible adiabatic, polytropic, entropy change, Carnot, Otto, Diesel, Newton cooling, Maxwell-Boltzmann.
- Mechanics: projectile (no drag, linear drag, quadratic drag), SHM, damped and driven oscillator, simple pendulum (exact and small-angle), double pendulum, circular orbit, escape velocity.
- Chaos: logistic map, tent map, Lorenz, Duffing.
- Waves: traveling wave, standing wave, beats, harmonics, Fourier series.
- EM: point charge E-field and potential, RC, RL, RLC.
- ODE/PDE: Euler, Heun, RK4, 1D heat equation, 1D wave equation.

## 13) EM Advanced
### 13.1 Series RLC Impedance
Z = R + i(omega L - 1/(omega C))
Magnitude: |Z| = sqrt(R^2 + (omega L - 1/(omega C))^2)
Phase: phi = atan((omega L - 1/(omega C)) / R)
Current amplitude: I = V0 / |Z|

### 13.2 Induction (Faraday/Lenz)
emf = - dPhi_B / dt
Magnetic flux: Phi_B = integral(B dot dA)

### 13.3 Lorentz Force
F = q(E + v x B)

## 14) Waves and Interference
### 14.1 Standing Wave (string)
y(x,t) = A sin(k x) cos(omega t)
Nodes at x = n pi / k

### 14.2 Two-source interference (intensity)
I = I0 (1 + cos(delta_phi)) = 2 I0 cos^2(delta_phi/2)
Path difference: delta = r2 - r1
Phase: delta_phi = 2 pi delta / lambda

### 14.3 Beats
y(t) = 2A cos((delta_omega/2) t) sin(omega_avg t)

## 15) Chaos and Nonlinear Systems
### 15.1 Logistic Map Lyapunov
lambda = lim (1/N) sum_{n=1..N} ln |r (1 - 2 x_n)|
If lambda > 0, chaos is present.

### 15.2 Lorenz System
dx/dt = sigma (y - x)
dy/dt = x (rho - z) - y
dz/dt = x y - beta z

## 16) Quantum Intuition
### 16.1 Particle in a Box (1D)
Energy levels: En = n^2 pi^2 hbar^2 / (2 m L^2)
Wavefunction: psi_n(x) = sqrt(2/L) sin(n pi x / L)

### 16.2 Tunneling (rectangular barrier)
Transmission (qualitative): T ~ exp(-2 kappa a)
kappa = sqrt(2 m (V0 - E)) / hbar

## 17) Nonlinear Oscillators and Chaos
### 17.1 Duffing Oscillator
x'' + delta x' + alpha x + beta x^3 = gamma cos(omega t)

### 17.2 Driven Pendulum
theta'' + q theta' + sin(theta) = A cos(omega t)

## 18) Linear Systems
### 18.1 2D Linear System
 x' = a x + b y
 y' = c x + d y
Eigenvalues:
 lambda = (tr(A) +- sqrt(tr(A)^2 - 4 det(A))) / 2


