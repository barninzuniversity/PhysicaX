import { DiffusionDemo } from '../../../components/DiffusionDemo';

export default function Page() {
  return (
    <>
      <section className="section reveal">
        <h2>Diffusion</h2>
        <p>Mean-square displacement growth.</p>
      </section>
      <section className="section reveal">
        <DiffusionDemo />
      </section>
    </>
  );
}

