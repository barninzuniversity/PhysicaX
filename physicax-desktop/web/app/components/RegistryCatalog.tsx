"use client";

import { useMemo, useState } from "react";
import type { Category } from "../data/modelCatalog";
import { useLocale } from "./LocaleProvider";

type RegistryCatalogProps = {
  categories: Category[];
};

export function RegistryCatalog({ categories }: RegistryCatalogProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("all");

  const categoryOptions = useMemo(() => ["all", ...categories.map((cat) => cat.title)], [categories]);

  const results = useMemo(() => {
    const q = query.toLowerCase();
    return categories
      .filter((category) => (active === "all" ? true : category.title === active))
      .map((category) => ({
        ...category,
        models: category.models.filter((model) => {
          if (!q) {
            return true;
          }
          return (
            model.id.toLowerCase().includes(q) ||
            model.equation.toLowerCase().includes(q) ||
            model.assumptions.toLowerCase().includes(q) ||
            model.validation.toLowerCase().includes(q)
          );
        })
      }))
      .filter((category) => category.models.length > 0);
  }, [categories, query, active]);

  return (
    <div className="demo-panel">
      <div className="demo-title">{t("registryCatalogTitle")}</div>
      <div className="search-controls">
        <input
          className="search-input"
          type="text"
          placeholder={t("registryCatalogPlaceholder")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select className="search-select" value={active} onChange={(event) => setActive(event.target.value)}>
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? t("registryCatalogAllCategories") : cat}
            </option>
          ))}
        </select>
      </div>
      <div className="search-meta">
        {results.length} {results.length === 1 ? t("registryCatalogCategory") : t("registryCatalogCategories")} {t("registryCatalogDisplayed")}
      </div>
      {results.map((category) => (
        <div key={category.title} className="catalog-section">
          <div className="catalog-title">{category.title}</div>
          <div className="model-grid">
            {category.models.map((model) => (
              <div className="model-card" key={model.id}>
                <h3>{model.title ? `${model.title} (${model.id})` : model.id}</h3>
                <p>{t("registryCatalogEquation")}: {model.equation}</p>
                <p>{t("registryCatalogAssumptions")}: {model.assumptions}</p>
                <p>{t("registryCatalogValidation")}: {model.validation}</p>
                {model.inputs?.length ? <p>{t("registryCatalogInputs")}: {model.inputs.join(", ")}</p> : null}
                {model.outputs?.length ? <p>{t("registryCatalogOutputs")}: {model.outputs.join(", ")}</p> : null}
                {model.presets?.length ? <p>{t("registryCatalogPresets")}: {model.presets.join(", ")}</p> : null}
                {model.plots?.length ? (
                  <p>{t("registryCatalogPlots")}: {model.plots.map((plot) => plot.label).join(", ")}</p>
                ) : null}
                {model.challengeHooks?.length ? (
                  <p>{t("registryCatalogHooks")}: {model.challengeHooks.join(", ")}</p>
                ) : null}
                {model.validationCases?.length ? (
                  <div className="model-cases">
                    {model.validationCases.map((item) => (
                      <div key={item.description} className="model-case">
                        <strong>{item.description}</strong>
                        <div>{t("registryCatalogInputs")}: {item.inputs}</div>
                        <div>{t("registryCatalogExpected")}: {item.expected}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
