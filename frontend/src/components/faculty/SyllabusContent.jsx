import React from 'react';
import './SyllabusContent.css';

// Presentational component: no data fetching, no dummy content.
// Prop: hasAssignedCourses (boolean) - default false shows clean empty state.
export default function SyllabusContent({ hasAssignedCourses = false }) {
  if (!hasAssignedCourses) {
    return (
      <div className="syllabus-content">
        <header className="sc-header">
          <h1>Syllabus</h1>
          <p className="sc-sub">Manage your syllabus, sections, and course outcome activity evidence</p>
        </header>

        <div className="sc-empty-card">
          <h2>No assigned courses yet</h2>
          <p>Please wait for assignment or contact your administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="syllabus-content">
      <header className="sc-header">
        <h1>Syllabus</h1>
        <p className="sc-sub">Manage your syllabus, sections, and course outcome activity evidence</p>
      </header>

      <section className="sc-course-header card">
        <div className="ch-left">
          <label className="ph">Subject Code</label>
          <div className="ph-input" />

          <label className="ph">Subject Name</label>
          <div className="ph-input" style={{ width: '60%' }} />

          <div className="ph-row">
            <div>
              <label className="ph">Academic Year</label>
              <div className="ph-input small" />
            </div>
            <div>
              <label className="ph">Semester</label>
              <div className="ph-input small" />
            </div>
          </div>
        </div>

        <div className="ch-right">
          <button className="btn ghost" disabled>View Syllabus</button>
          <button className="btn" disabled>Upload / Replace Syllabus</button>
        </div>
      </section>

      <section className="sc-sections card">
        <div className="tabs">
          <button className="tab" aria-disabled>Section A</button>
          <button className="tab" aria-disabled>Section B</button>
          <button className="tab" aria-disabled>Section C</button>
        </div>
        <div className="select-state">No section selected</div>
      </section>

      <section className="sc-outcomes">
        {[1,2,3,4].map((n) => (
          <div className="co card" key={n}>
            <div className="co-header">
              <h3>Course Outcome {n}</h3>
              <button className="btn small primary">+ Add Activity</button>
            </div>

            <div className="co-body">
              <div className="empty-activity">No activities added yet</div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
