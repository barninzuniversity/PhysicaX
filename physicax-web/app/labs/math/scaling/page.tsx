import Link from "next/link";
import { LocaleText } from "../../../components/LocaleText";

export default function MathScalingPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="mathScalingPageTitle" fallback="Scaling + Dimensionless Groups" /></h2>
        <p>
          <LocaleText
            id="mathScalingPageIntro"
            fallback="Open a focused tool for characteristic scales or similarity numbers."
          />
        </p>
      </section>
      <section className="section reveal">
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="mathScalingExplorerCardTitle" fallback="Scaling Explorer" /></h3>
            <p><LocaleText id="mathScalingExplorerCardBody" fallback="Characteristic scales, nondimensional time, and slope intuition." /></p>
            <p><Link href="/labs/math/scaling/explorer"><LocaleText id="mathScalingExplorerCardLink" fallback="Open scaling explorer" /></Link></p>
          </div>
          <div className="card">
            <h3><LocaleText id="mathScalingGroupsCardTitle" fallback="Dimensionless Groups" /></h3>
            <p><LocaleText id="mathScalingGroupsCardBody" fallback="Re, Pr, Ma, Fr, Gr, Ra, We with regime hints." /></p>
            <p><Link href="/labs/math/scaling/groups"><LocaleText id="mathScalingGroupsCardLink" fallback="Open dimensionless groups" /></Link></p>
          </div>
        </div>
      </section>
    </>
  );
}
