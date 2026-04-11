import katex from "katex";

type MathProps = {
  latex: string;
  block?: boolean;
  className?: string;
};

export function MathBlock({ latex, block = true, className = "" }: MathProps) {
  const html = katex.renderToString(latex, {
    displayMode: block,
    throwOnError: false,
    strict: "ignore"
  });
  return (
    <span
      className={`${block ? "math-block" : "math-inline"} ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function MathInline({ latex, className = "" }: MathProps) {
  return <MathBlock latex={latex} block={false} className={className} />;
}
