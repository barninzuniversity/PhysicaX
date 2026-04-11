import { GradingDemo } from "../components/GradingDemo";
import { ChallengeBuilder } from "../components/ChallengeBuilder";
import { ChallengeRunner } from "../components/ChallengeRunner";
import { ChallengeProgressBoard } from "../components/ChallengeProgressBoard";
import { BadgeShelf } from "../components/BadgeShelf";
import { AssignmentBuilder } from "../components/AssignmentBuilder";
import { ClassroomDashboard } from "../components/ClassroomDashboard";
import { ClassroomRoster } from "../components/ClassroomRoster";
import { AssignmentSubmissionPanel } from "../components/AssignmentSubmissionPanel";
import { SubmissionBoard } from "../components/SubmissionBoard";
import { ClassroomAnalytics } from "../components/ClassroomAnalytics";
import { LocaleText } from "../components/LocaleText";

export default function EducationPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="educationLayerTitle" fallback="Education and Classroom Layer" /></h2>
        <p><LocaleText id="educationIntro" fallback="The education layer turns simulations into guided learning experiences. It supports classroom assignments, hints, and conceptual questions without hiding the underlying physics." /></p>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="educationChallengeTitle" fallback="Challenge Mode" /></h2>
        <div className="columns">
          <div className="column">
            <h3><LocaleText id="educationGuidedTitle" fallback="Guided Challenges" /></h3>
            <ul>
              <li><LocaleText id="educationGuidedItem1" fallback="Predict before simulating" /></li>
              <li><LocaleText id="educationGuidedItem2" fallback="Multiple choice and numeric answers" /></li>
              <li><LocaleText id="educationGuidedItem3" fallback="Hints and conceptual notes" /></li>
            </ul>
          </div>
          <div className="column">
            <h3><LocaleText id="educationAssessmentTitle" fallback="Assessment" /></h3>
            <ul>
              <li><LocaleText id="educationAssessmentItem1" fallback="Auto-grading for numeric answers" /></li>
              <li><LocaleText id="educationAssessmentItem2" fallback="Rubrics for lab reports" /></li>
              <li><LocaleText id="educationAssessmentItem3" fallback="Progress tracking per student" /></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="educationToolsTitle" fallback="Classroom Tools" /></h2>
        <div className="card-grid">
          <div className="card">
            <h3><LocaleText id="educationAssignmentsTitle" fallback="Assignments" /></h3>
            <p><LocaleText id="educationAssignmentsBody" fallback="Create lab tasks with presets and required outputs." /></p>
          </div>
          <div className="card">
            <h3><LocaleText id="educationSharingTitle" fallback="Sharing" /></h3>
            <p><LocaleText id="educationSharingBody" fallback="Share experiments via public or private links." /></p>
          </div>
          <div className="card">
            <h3><LocaleText id="educationTemplatesTitle" fallback="Templates" /></h3>
            <p><LocaleText id="educationTemplatesBody" fallback="Use predefined models with domain-validated parameters." /></p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <h2><LocaleText id="educationGradingTitle" fallback="Auto-Grading Preview" /></h2>
        <p><LocaleText id="educationGradingBody" fallback="Test numeric tolerance grading for physics questions." /></p>
        <GradingDemo />
      </section>

      <section className="section reveal">
        <h2><LocaleText id="educationBuilderTitle" fallback="Challenge Builder" /></h2>
        <p><LocaleText id="educationBuilderBody" fallback="Create a guided challenge template with difficulty and answer type." /></p>
        <ChallengeBuilder />
      </section>

      <section className="section reveal">
        <h2><LocaleText id="educationRunnerTitle" fallback="Challenge Runner" /></h2>
        <p><LocaleText id="educationRunnerBody" fallback="Run challenges with numeric tolerance checks and immediate feedback." /></p>
        <ChallengeRunner />
      </section>

      <section className="section reveal">
        <h2><LocaleText id="educationProgressTitle" fallback="Challenge Progress" /></h2>
        <p><LocaleText id="educationProgressBody" fallback="Track completion rate, attempts, and badges across the class." /></p>
        <ChallengeProgressBoard />
      </section>

      <section className="section reveal">
        <h2><LocaleText id="educationBadgeTitle" fallback="Badge Shelf" /></h2>
        <p><LocaleText id="educationBadgeBody" fallback="Earn badges for mastering challenge sequences." /></p>
        <BadgeShelf />
      </section>

      <section className="section reveal">
        <h2><LocaleText id="educationAssignmentBuilderTitle" fallback="Assignment Builder" /></h2>
        <p><LocaleText id="educationAssignmentBuilderBody" fallback="Compose classroom assignments with required deliverables." /></p>
        <AssignmentBuilder />
      </section>

      <section className="section reveal">
        <h2><LocaleText id="educationClassroomDashboardTitle" fallback="Classroom Dashboard" /></h2>
        <p><LocaleText id="educationClassroomDashboardBody" fallback="Track classes, challenges, and assignments in one place." /></p>
        <ClassroomDashboard />
      </section>

      <section className="section reveal">
        <h2><LocaleText id="educationJoinTitle" fallback="Join Classroom" /></h2>
        <p><LocaleText id="educationJoinBody" fallback="Students can join with a classroom ID and see active rosters." /></p>
        <ClassroomRoster />
      </section>

      <section className="section reveal">
        <h2><LocaleText id="educationSubmitTitle" fallback="Submit Assignment" /></h2>
        <p><LocaleText id="educationSubmitBody" fallback="Submit answers, notes, and experiment references." /></p>
        <AssignmentSubmissionPanel />
      </section>

      <section className="section reveal">
        <h2><LocaleText id="educationSubmissionTitle" fallback="Submission Tracker" /></h2>
        <p><LocaleText id="educationSubmissionBody" fallback="Review assignment submissions and timestamps." /></p>
        <SubmissionBoard />
      </section>

      <section className="section reveal">
        <h2><LocaleText id="educationAnalyticsTitle" fallback="Classroom Analytics" /></h2>
        <p><LocaleText id="educationAnalyticsBody" fallback="Track submission volume and scoring trends per assignment." /></p>
        <ClassroomAnalytics />
      </section>
    </>
  );
}
