import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { ExperimentBuilder } from "../components/ExperimentBuilder";
import { ExperimentGallery } from "../components/ExperimentGallery";
import { ExperimentLibrary } from "../components/ExperimentLibrary";
import { ExperimentVersionTracker } from "../components/ExperimentVersionTracker";
import { ExperimentComparePanel } from "../components/ExperimentComparePanel";
import { LocaleText } from "../components/LocaleText";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  const nameSuffix = session.user?.name ? `, ${session.user.name}` : "";
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="dashboardTitle" fallback="Dashboard" /></h2>
        <p>
          <LocaleText id="dashboardWelcome" fallback="Welcome back" />
          {nameSuffix}.{" "}
          <LocaleText
            id="dashboardIntro"
            fallback="Track experiments, publish to the gallery, and jump back into key labs."
          />
        </p>
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="dashboardContinueTitle" fallback="Continue Labs" /></h3>
            <p>
              <Link href="/labs/mechanics">MechanicsLab</Link>
            </p>
            <p>
              <Link href="/labs/thermo">ThermoLab</Link>
            </p>
            <p>
              <Link href="/labs/chaos">ChaosLab</Link>
            </p>
          </div>
          <div className="card">
            <h3><LocaleText id="dashboardWorkspaceTitle" fallback="Workspace Tools" /></h3>
            <p><LocaleText id="dashboardWorkspaceBody" fallback="Save runs, publish public experiments, and export JSON snapshots." /></p>
          </div>
          <div className="card">
            <h3><LocaleText id="dashboardGalleryTitle" fallback="Explore Gallery" /></h3>
            <p>
              <Link href="/gallery"><LocaleText id="dashboardGalleryLink" fallback="Open Gallery" /></Link>
            </p>
          </div>
          <div className="card">
            <h3><LocaleText id="dashboardProfileTitle" fallback="Profile + Presets" /></h3>
            <p>
              <Link href="/profile"><LocaleText id="dashboardProfileLink" fallback="Open profile settings" /></Link>
            </p>
          </div>
          <div className="card">
            <h3><LocaleText id="dashboardResearchTitle" fallback="Research Mode" /></h3>
            <p>
              <Link href="/research"><LocaleText id="dashboardResearchLink" fallback="Open research tools" /></Link>
            </p>
          </div>
          <div className="card">
            <h3><LocaleText id="dashboardClassroomTitle" fallback="Classroom" /></h3>
            <p>
              <Link href="/education"><LocaleText id="dashboardClassroomLink" fallback="Open classroom tools" /></Link>
            </p>
          </div>
        </div>
      </section>
      <section className="section reveal">
        <ExperimentBuilder />
      </section>
      <section className="section reveal">
        <ExperimentLibrary />
      </section>
      <section className="section reveal">
        <ExperimentComparePanel />
      </section>
      <section className="section reveal">
        <ExperimentVersionTracker />
      </section>
      <section className="section reveal">
        <ExperimentGallery />
      </section>
    </>
  );
}
