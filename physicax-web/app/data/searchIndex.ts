import { labs } from "./labs";
import { modelCatalog } from "./modelCatalog";

export type SearchCategory =
  | "page"
  | "lab"
  | "model"
  | "feature"
  | "experiment"
  | "publication"
  | "challenge"
  | "classroom"
  | "assignment"
  | "notebook";

export type SearchEntry = {
  title: string;
  href: string;
  category: SearchCategory;
  summary: string;
  tags: string[];
};

const pageEntries: SearchEntry[] = [
  {
    title: "Overview",
    href: "/",
    category: "page",
    summary: "Full blueprint overview and platform map.",
    tags: ["home", "blueprint", "platform"]
  },
  {
    title: "Platform Core",
    href: "/platform",
    category: "page",
    summary: "Accounts, workspace, experiments, gallery, search, i18n.",
    tags: ["accounts", "workspace", "gallery"]
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    category: "page",
    summary: "Saved experiments, publishing, and exports.",
    tags: ["experiments", "publish"]
  },
  {
    title: "Gallery",
    href: "/gallery",
    category: "page",
    summary: "Public experiment gallery with shareable links.",
    tags: ["gallery", "share"]
  },
  {
    title: "Profile",
    href: "/profile",
    category: "page",
    summary: "User preferences, favorites, and saved presets.",
    tags: ["profile", "preferences"]
  },
  {
    title: "Labs",
    href: "/labs",
    category: "page",
    summary: "Module catalog for every physics lab.",
    tags: ["labs", "modules"]
  },
  {
    title: "Math Engine",
    href: "/labs/math",
    category: "page",
    summary: "Math engine navigator with tools and formula context.",
    tags: ["math", "analysis", "tools"]
  },
  {
    title: "Graphing Calculator",
    href: "/labs/math/graphing",
    category: "page",
    summary: "GeoGebra-style plotting with geometry tools.",
    tags: ["graphing", "geometry", "math"]
  },
  {
    title: "CAS Workspace",
    href: "/labs/math/cas",
    category: "page",
    summary: "Full SymPy-powered symbolic engine with assumptions and steps.",
    tags: ["cas", "symbolic", "math", "sympy"]
  },
  {
    title: "Symbolic Workbench",
    href: "/labs/math/symbolic",
    category: "page",
    summary: "Simplify expressions, compute derivatives, and estimate integrals.",
    tags: ["symbolic", "derivatives", "math"]
  },
  {
    title: "Symbolic Assumptions",
    href: "/labs/math/assumptions",
    category: "page",
    summary: "Apply small/large/positive assumptions to simplify expressions.",
    tags: ["assumptions", "symbolic", "math"]
  },
  {
    title: "Derivation Mode",
    href: "/labs/math/derivation",
    category: "page",
    summary: "Governing equations, assumptions, and approximation boundaries.",
    tags: ["derivation", "assumptions", "math"]
  },
  {
    title: "Approximation Comparator",
    href: "/labs/math/approximations",
    category: "page",
    summary: "Exact vs approximate model comparisons with error metrics.",
    tags: ["approximation", "error", "math"]
  },
  {
    title: "Taylor Series",
    href: "/labs/math/series/taylor",
    category: "page",
    summary: "Taylor series explorer with custom functions.",
    tags: ["taylor", "series", "approximation"]
  },
  {
    title: "Scaling Explorer",
    href: "/labs/math/scaling/explorer",
    category: "page",
    summary: "Characteristic scales and nondimensional time.",
    tags: ["scaling", "dimensionless"]
  },
  {
    title: "Dimensionless Groups",
    href: "/labs/math/scaling/groups",
    category: "page",
    summary: "Re, Pr, Ma, Fr, Gr, Ra, We explorer.",
    tags: ["reynolds", "prandtl", "mach"]
  },
  {
    title: "Derived Units",
    href: "/labs/math/units/derived",
    category: "page",
    summary: "Match dimensional signatures to SI derived units.",
    tags: ["units", "derived", "dimension"]
  },
  {
    title: "Stability Regions",
    href: "/labs/math/stability/regions",
    category: "page",
    summary: "Numerical stability regions and CFL hints.",
    tags: ["stability", "cfl", "numerics"]
  },
  {
    title: "Admin Users",
    href: "/admin/users",
    category: "page",
    summary: "Admin role and locale management.",
    tags: ["admin", "roles", "locale"]
  },
  {
    title: "CFD Control Center",
    href: "/cfd",
    category: "page",
    summary: "CFD backend status, setup, and 3D airflow launchpad.",
    tags: ["cfd", "fluid", "backend"]
  },
  {
    title: "Architecture",
    href: "/architecture",
    category: "page",
    summary: "Model registry and simulation response design.",
    tags: ["registry", "response", "backend"]
  },
  {
    title: "Formulas",
    href: "/formulas",
    category: "page",
    summary: "Canonical formula registry text.",
    tags: ["equations", "registry"]
  },
  {
    title: "Glossary",
    href: "/formulas/glossary",
    category: "page",
    summary: "Definitions and context for math and physics.",
    tags: ["glossary", "definitions"]
  },
  {
    title: "Governance",
    href: "/governance",
    category: "page",
    summary: "Formula policy, unit rules, and validation norms.",
    tags: ["policy", "validation"]
  },
  {
    title: "Solvers",
    href: "/solvers",
    category: "page",
    summary: "Numerical solver comparison and stability guidance.",
    tags: ["ode", "pde", "rk4"]
  },
  {
    title: "Registry",
    href: "/registry",
    category: "page",
    summary: "Model registry overview with sample cards.",
    tags: ["models", "registry"]
  },
  {
    title: "Registry Models",
    href: "/registry/models",
    category: "page",
    summary: "Full catalog of model cards.",
    tags: ["models", "catalog"]
  },
  {
    title: "UI",
    href: "/ui",
    category: "page",
    summary: "Workspace layout and UI standards.",
    tags: ["layout", "panels"]
  },
  {
    title: "Research",
    href: "/research",
    category: "page",
    summary: "Parameter sweeps, batch runs, reproducibility.",
    tags: ["sweeps", "batch"]
  },
  {
    title: "Research Analysis",
    href: "/research",
    category: "feature",
    summary: "Peak detection, convergence checks, and stability flags.",
    tags: ["analysis", "peaks", "convergence"]
  },
  {
    title: "Research Workflows",
    href: "/research/workflows",
    category: "page",
    summary: "Workflow checklists for sweeps and comparisons.",
    tags: ["workflow", "sweeps"]
  },
  {
    title: "Notebook Templates",
    href: "/research/notebook",
    category: "page",
    summary: "Notebook mode outlines and report templates.",
    tags: ["notebook", "reports"]
  },
  {
    title: "Education",
    href: "/education",
    category: "page",
    summary: "Challenges, grading, classroom assignments.",
    tags: ["education", "grading"]
  },
  {
    title: "Challenges",
    href: "/challenges",
    category: "page",
    summary: "Challenge library and solver workspace.",
    tags: ["challenges", "assessment"]
  },
  {
    title: "Challenge Sets",
    href: "/challenges",
    category: "page",
    summary: "Organize challenges into guided sets.",
    tags: ["challenges", "sets"]
  },
  {
    title: "Classrooms",
    href: "/classrooms",
    category: "page",
    summary: "Classroom hub for assignments and submissions.",
    tags: ["classroom", "assignments"]
  },
  {
    title: "Assignment Detail",
    href: "/classrooms/assignments",
    category: "page",
    summary: "Assignment submission review and scoring.",
    tags: ["assignments", "grading"]
  },
  {
    title: "QA",
    href: "/qa",
    category: "page",
    summary: "Physics QA checklists for every lab.",
    tags: ["qa", "validation"]
  },
  {
    title: "Testing",
    href: "/testing",
    category: "page",
    summary: "Testing strategy and golden cases.",
    tags: ["tests", "quality"]
  },
  {
    title: "Build",
    href: "/build",
    category: "page",
    summary: "Build phases and delivery checklist.",
    tags: ["roadmap", "phases"]
  },
  {
    title: "Appendix",
    href: "/appendix",
    category: "page",
    summary: "Full OCR text of the original guide.",
    tags: ["ocr", "reference"]
  }
];

const labEntries: SearchEntry[] = labs.map((lab) => ({
  title: lab.title,
  href: lab.href,
  category: "lab",
  summary: lab.summary,
  tags: lab.focus
}));

const modelEntries: SearchEntry[] = modelCatalog.flatMap((category) =>
  category.models.map((model) => ({
    title: model.id,
    href: "/registry/models",
    category: "model",
    summary: model.equation,
    tags: [category.title, model.assumptions]
  }))
);

const featureEntries: SearchEntry[] = [
  {
    title: "Experiment Builder",
    href: "/platform",
    category: "feature",
    summary: "Compose experiments, compare runs, and export results.",
    tags: ["experiments", "compare", "export"]
  },
  {
    title: "Compare Mode",
    href: "/platform",
    category: "feature",
    summary: "Compare exact vs numerical and solver A vs solver B.",
    tags: ["compare", "solvers"]
  },
  {
    title: "Export System",
    href: "/research",
    category: "feature",
    summary: "CSV, JSON, plots, and report exports.",
    tags: ["export", "reports"]
  },
  {
    title: "Parameter Sweep Engine",
    href: "/research",
    category: "feature",
    summary: "1D/2D sweep grids for stability and sensitivity.",
    tags: ["sweeps", "research"]
  },
  {
    title: "Classroom Dashboard",
    href: "/education",
    category: "feature",
    summary: "Assignments, challenges, and classroom tracking.",
    tags: ["classroom", "education"]
  },
  {
    title: "Formula Registry",
    href: "/formulas",
    category: "feature",
    summary: "Single source of truth for all equations.",
    tags: ["formulas", "registry"]
  },
  {
    title: "3D Airflow (CFD)",
    href: "/labs/mechanics/drag/flow-3d",
    category: "feature",
    summary: "GPU 3D airflow with CFD backend streaming.",
    tags: ["cfd", "airflow", "gpu"]
  },
  {
    title: "3D Heat Volume",
    href: "/labs/thermo/heat-transfer/volume",
    category: "feature",
    summary: "WebGL volume rendering of heat diffusion.",
    tags: ["heat", "volume", "webgl"]
  },
  {
    title: "OpenFOAM Export",
    href: "/cfd",
    category: "feature",
    summary: "Use OpenFOAM velocity exports in the CFD airflow viewer.",
    tags: ["openfoam", "cfd", "export"]
  }
];

export const searchIndex: SearchEntry[] = [
  ...pageEntries,
  ...labEntries,
  ...modelEntries,
  ...featureEntries
];
