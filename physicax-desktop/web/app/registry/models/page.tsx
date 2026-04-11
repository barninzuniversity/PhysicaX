import { RegistryCatalog } from "../../components/RegistryCatalog";
import { modelCatalog } from "../../data/modelCatalog";

export default function RegistryModelsPage() {
  return (
    <>
      <section className="section reveal">
        <h2>Full Model Cards (All Formulas)</h2>
        <p>
          This page enumerates every formula in the reference pack as a model card. Each card
          includes the equation, assumptions, and a validation note.
        </p>
      </section>

      <section className="section reveal">
        <RegistryCatalog categories={modelCatalog} />
      </section>
    </>
  );
}
