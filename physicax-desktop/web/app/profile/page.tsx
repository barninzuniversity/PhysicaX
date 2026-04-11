import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { ProfileSettings } from "../components/ProfileSettings";
import { PresetManager } from "../components/PresetManager";
import { LocaleText } from "../components/LocaleText";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="profileTitle" fallback="Your Profile" /></h2>
        <p><LocaleText id="profileIntro" fallback="Manage preferences, visibility, and saved presets." /></p>
      </section>
      <section className="section reveal">
        <ProfileSettings />
      </section>
      <section className="section reveal">
        <PresetManager />
      </section>
    </>
  );
}
