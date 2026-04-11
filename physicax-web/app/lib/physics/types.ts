export type FormulaEquation = {
  name: string;
  latex: string;
  expressionId: string;
  description?: string;
};

export type FormulaSpec = {
  id: string;
  title: string;
  category: string;
  equations: FormulaEquation[];
  assumptions?: string[];
  parameterDomains?: Array<{ name: string; constraint: string }>;
  units?: Array<{ variable: string; siUnit: string }>;
  validationCases?: Array<{
    description: string;
    inputs: Record<string, number>;
    expected: Record<string, number>;
    tolerance: number;
  }>;
};
