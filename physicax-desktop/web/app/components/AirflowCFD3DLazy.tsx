"use client";

import dynamic from "next/dynamic";

export const AirflowCFD3DLazy = dynamic(
  () => import("./AirflowCFD3D").then((module) => module.AirflowCFD3D),
  {
    ssr: false,
    loading: () => (
      <div className="card">
        <h3>Loading the GPU airflow stage</h3>
        <p>
          PhysicaX is deferring the heavy 3D scene until the page shell is ready, which keeps the first paint faster
          and avoids front-loading the most expensive client bundle work.
        </p>
      </div>
    )
  }
);
