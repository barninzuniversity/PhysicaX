"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type PlotlyPlotProps = {
  data: unknown;
  layout?: Record<string, unknown>;
  config?: Record<string, unknown>;
  style?: CSSProperties;
  revision?: number;
};

export function PlotlyPlot(props: PlotlyPlotProps) {
  const { layout, config, style, revision, ...rest } = props;
  const layoutTyped = (layout ?? {}) as Record<string, any>;
  const hasScene = Boolean(layoutTyped.scene);
  const shapes = hasScene
    ? layoutTyped.shapes
    : [
        ...(layoutTyped.shapes ?? []),
        {
          type: "line",
          xref: "paper",
          x0: 0,
          x1: 1,
          y0: 0,
          y1: 0,
          line: { color: "rgba(11, 18, 32, 0.28)", width: 1.2, dash: "dash" }
        }
      ];
  return (
    <div className="plotly-frame">
      <Plot
        {...rest}
        revision={revision}
        layout={{
          paper_bgcolor: "rgba(255,255,255,0.92)",
          plot_bgcolor: "rgba(248,245,239,0.95)",
        font: { family: "Geist, sans-serif", color: "#0a0a0a" },
          margin: { l: 50, r: 20, t: 30, b: 40 },
          ...layout,
          shapes
        }}
        config={{ displaylogo: false, responsive: true, ...config }}
        style={{ width: "100%", height: "100%", ...style }}
      />
    </div>
  );
}
