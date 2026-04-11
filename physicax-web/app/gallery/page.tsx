import { ExperimentGallery } from "../components/ExperimentGallery";
import { LocaleText } from "../components/LocaleText";

export default function GalleryPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="galleryTitle" fallback="Public Gallery" /></h2>
        <p><LocaleText id="galleryIntro" fallback="Browse and search published experiments from your local workspace." /></p>
      </section>
      <section className="section reveal">
        <ExperimentGallery />
      </section>
    </>
  );
}
