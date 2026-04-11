import { CoolingCurveSim } from '../../../../components/CoolingCurveSim';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Cooling Curve</h2>
        <p>Newton cooling model with time response.</p>
      </section>
      <section className="section reveal">
        <CoolingCurveSim />
      </section>
    </>
  );
}

