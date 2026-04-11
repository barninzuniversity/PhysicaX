"use client";

import { FeatureToggles } from "../components/FeatureToggles";
import { GlobalSearch } from "../components/GlobalSearch";
import { ExperimentBuilder } from "../components/ExperimentBuilder";
import { useLocale } from "../components/LocaleProvider";

export default function PlatformPage() {
  const { t } = useLocale();
  return (
    <>
      <section className="section reveal">
        <h2>{t("platformTitle")}</h2>
        <p>{t("platformIntro")}</p>
      </section>

      <section className="section reveal">
        <h2>{t("platformAccountsTitle")}</h2>
        <div className="columns">
          <div className="column">
            <h3>{t("platformSignInTitle")}</h3>
            <ul>
              <li>{t("platformSignInItem1")}</li>
              <li>{t("platformSignInItem2")}</li>
              <li>{t("platformSignInItem3")}</li>
            </ul>
          </div>
          <div className="column">
            <h3>{t("platformPreferencesTitle")}</h3>
            <ul>
              <li>{t("platformPrefItem1")}</li>
              <li>{t("platformPrefItem2")}</li>
              <li>{t("platformPrefItem3")}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>{t("platformTogglesTitle")}</h2>
        <p>{t("platformTogglesBody")}</p>
        <FeatureToggles
          title={t("platformTogglesPanelTitle")}
          items={[
            {
              id: "accounts",
              label: t("platformToggleAccountsLabel"),
              description: t("platformToggleAccountsDesc")
            },
            {
              id: "dashboard",
              label: t("platformToggleDashboardLabel"),
              description: t("platformToggleDashboardDesc")
            },
            {
              id: "workspace",
              label: t("platformToggleWorkspaceLabel"),
              description: t("platformToggleWorkspaceDesc")
            },
            {
              id: "gallery",
              label: t("platformToggleGalleryLabel"),
              description: t("platformToggleGalleryDesc")
            },
            {
              id: "search",
              label: t("platformToggleSearchLabel"),
              description: t("platformToggleSearchDesc")
            },
            {
              id: "i18n",
              label: t("platformToggleI18nLabel"),
              description: t("platformToggleI18nDesc")
            }
          ]}
          defaultOn={["accounts", "workspace", "search"]}
        />
      </section>

      <section className="section reveal">
        <h2>{t("platformWorkspaceTitle")}</h2>
        <div className="columns">
          <div className="column">
            <h3>{t("platformWorkspaceLayoutTitle")}</h3>
            <ul>
              <li>{t("platformWorkspaceLayoutItem1")}</li>
              <li>{t("platformWorkspaceLayoutItem2")}</li>
              <li>{t("platformWorkspaceLayoutItem3")}</li>
              <li>{t("platformWorkspaceLayoutItem4")}</li>
            </ul>
          </div>
          <div className="column">
            <h3>{t("platformWorkspaceShareTitle")}</h3>
            <ul>
              <li>{t("platformWorkspaceShareItem1")}</li>
              <li>{t("platformWorkspaceShareItem2")}</li>
              <li>{t("platformWorkspaceShareItem3")}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>{t("platformExperimentTitle")}</h2>
        <p>{t("platformExperimentIntro")}</p>
        <div className="columns">
          <div className="column">
            <h3>{t("platformExperimentComposeTitle")}</h3>
            <ul>
              <li>{t("platformExperimentComposeItem1")}</li>
              <li>{t("platformExperimentComposeItem2")}</li>
              <li>{t("platformExperimentComposeItem3")}</li>
            </ul>
          </div>
          <div className="column">
            <h3>{t("platformExperimentNotesTitle")}</h3>
            <ul>
              <li>{t("platformExperimentNotesItem1")}</li>
              <li>{t("platformExperimentNotesItem2")}</li>
              <li>{t("platformExperimentNotesItem3")}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>{t("platformExperimentBuilderTitle")}</h2>
        <p>{t("platformExperimentBuilderBody")}</p>
        <ExperimentBuilder />
      </section>

      <section className="section reveal">
        <h2>{t("platformPublicTitle")}</h2>
        <div className="columns">
          <div className="column">
            <h3>{t("platformPublicGalleryTitle")}</h3>
            <ul>
              <li>{t("platformPublicGalleryItem1")}</li>
              <li>{t("platformPublicGalleryItem2")}</li>
              <li>{t("platformPublicGalleryItem3")}</li>
            </ul>
          </div>
          <div className="column">
            <h3>{t("platformSearchTitle")}</h3>
            <ul>
              <li>{t("platformSearchItem1")}</li>
              <li>{t("platformSearchItem2")}</li>
              <li>{t("platformSearchItem3")}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2>{t("platformSearchPreviewTitle")}</h2>
        <p>{t("platformSearchPreviewBody")}</p>
        <GlobalSearch />
      </section>

      <section className="section reveal">
        <h2>{t("platformCompareTitle")}</h2>
        <ul className="governance-list">
          <li>{t("platformCompareItem1")}</li>
          <li>{t("platformCompareItem2")}</li>
          <li>{t("platformCompareItem3")}</li>
          <li>{t("platformCompareItem4")}</li>
        </ul>
      </section>

      <section className="section reveal">
        <h2>{t("platformDocsTitle")}</h2>
        <div className="columns">
          <div className="column">
            <h3>{t("platformDocsInteractiveTitle")}</h3>
            <ul>
              <li>{t("platformDocsInteractiveItem1")}</li>
              <li>{t("platformDocsInteractiveItem2")}</li>
              <li>{t("platformDocsInteractiveItem3")}</li>
            </ul>
          </div>
          <div className="column">
            <h3>{t("platformDocsLearnTitle")}</h3>
            <ul>
              <li>{t("platformDocsLearnItem1")}</li>
              <li>{t("platformDocsLearnItem2")}</li>
              <li>{t("platformDocsLearnItem3")}</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
