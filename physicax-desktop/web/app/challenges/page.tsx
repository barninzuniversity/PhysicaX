import { ChallengeBuilder } from "../components/ChallengeBuilder";
import { ChallengeRunner } from "../components/ChallengeRunner";
import { ChallengeProgressBoard } from "../components/ChallengeProgressBoard";
import { BadgeShelf } from "../components/BadgeShelf";
import { LocaleText } from "../components/LocaleText";
import { ChallengeSetPanel } from "../components/ChallengeSetPanel";

export default function ChallengesPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="challengeLibrary" fallback="Challenge Library" /></h2>
        <p>
          <LocaleText
            id="challengeIntro"
            fallback="Build guided physics challenges, then run them in assessment mode. Use the challenge runner to test numeric tolerances and conceptual prompts."
          />
        </p>
      </section>
      <section className="section reveal">
        <ChallengeRunner />
      </section>
      <section className="section reveal">
        <ChallengeSetPanel />
      </section>
      <section className="section reveal">
        <ChallengeProgressBoard />
      </section>
      <section className="section reveal">
        <BadgeShelf />
      </section>
      <section className="section reveal">
        <ChallengeBuilder />
      </section>
    </>
  );
}
