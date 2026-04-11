import { HeatmapPDE2D } from '../../../../components/HeatmapPDE2D';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Heat Equation (2D)</h2>
        <p>2D heatmap diffusion visualization.</p>
      </section>
      <section className="section reveal">
        <HeatmapPDE2D />
      </section>
    </>
  );
}

