import { GlobalSearch } from "../components/GlobalSearch";
import { RegistryCatalog } from "../components/RegistryCatalog";
import { modelCatalog } from "../data/modelCatalog";
import { LocaleText } from "../components/LocaleText";

export default function RegistryPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="registryTitle" fallback="Formula Registry" /></h2>
        <p>
          <LocaleText
            id="registryIntro"
            fallback="The registry is the canonical source of truth. Every model must point to exactly one registry entry. No duplicated equations."
          />
        </p>
        <div className="code-block">
          <pre><code>{`FormulaSpec:
- modelId
- title
- category
- equations (latex, expression, description)
- assumptions
- parameter domains
- units (SI)
- singularities
- validation cases`}</code></pre>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="registryModelCards" fallback="Model Cards" /></h2>
        <p><LocaleText id="registryModelCardsBody" fallback="Filter the registry by category or search the model catalog." /></p>
        <RegistryCatalog categories={modelCatalog} />
        <div className="callout">
          <LocaleText id="registryFullList" fallback="Full list of model cards:" />{" "}
          <a href="/registry/models"><LocaleText id="registryFullListLink" fallback="Open complete registry list" /></a>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="registryValidationTitle" fallback="Validation Case Format" /></h2>
        <div className="code-block">
          <pre><code>{`validationCases:
- description
- inputs
- expected
- tolerance
- references (optional)`}</code></pre>
        </div>
        <div className="callout">
          <LocaleText
            id="registryValidationBody"
            fallback="Each model must include at least three cases: exact, limiting, invalid input."
          />
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="registrySearchTitle" fallback="Registry Search" /></h2>
        <p><LocaleText id="registrySearchBody" fallback="Search across models, pages, and labs from the registry view." /></p>
        <GlobalSearch />
      </section>
    </>
  );
}
