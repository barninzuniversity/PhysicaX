import { ClassroomDashboard } from "../components/ClassroomDashboard";
import { ClassroomRoster } from "../components/ClassroomRoster";
import { AssignmentSubmissionPanel } from "../components/AssignmentSubmissionPanel";
import { SubmissionBoard } from "../components/SubmissionBoard";
import { ClassroomAnalytics } from "../components/ClassroomAnalytics";
import { LocaleText } from "../components/LocaleText";

export default function ClassroomsPage() {
  return (
    <>
      <section className="section reveal">
        <h2><LocaleText id="classroomHub" fallback="Classroom Hub" /></h2>
        <p>
          <LocaleText
            id="classroomIntro"
            fallback="Manage classrooms, assignments, and submissions. Instructors can build classes and track submissions; students can join and submit work."
          />
        </p>
      </section>
      <section className="section reveal">
        <ClassroomDashboard />
      </section>
      <section className="section reveal">
        <ClassroomRoster />
      </section>
      <section className="section reveal">
        <AssignmentSubmissionPanel />
      </section>
      <section className="section reveal">
        <SubmissionBoard />
      </section>
      <section className="section reveal">
        <ClassroomAnalytics />
      </section>
    </>
  );
}
