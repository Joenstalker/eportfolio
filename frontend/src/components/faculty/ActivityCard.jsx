import React, { useState, useEffect } from 'react';

// Dummy fetch for student outputs (replace with real API call)
const fetchStudentOutputs = async (activityId) => [];

export default function ActivityCard({ activity }) {
  const [outputs, setOutputs] = useState([]);
  useEffect(() => {
    fetchStudentOutputs(activity._id).then(setOutputs);
  }, [activity._id]);

  return (
    <div className="activity-card card">
      <h5>{activity.title}</h5>
      <p>{activity.description}</p>
      {activity.instructionsFile && (
        <a href={`/${activity.instructionsFile}`} download>Download Instructions</a>
      )}
      {activity.rubricFile && (
        <a href={`/${activity.rubricFile}`} download>Download Rubric</a>
      )}
      <div>
        <h6>Student Submissions</h6>
        {outputs.length === 0 ? (
          <div className="empty-state">No submissions yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>File</th>
                <th>Score</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {outputs.map(output => (
                <tr key={output._id}>
                  <td>{output.studentId?.firstName} {output.studentId?.lastName}</td>
                  <td><a href={`/${output.file}`} download>Download</a></td>
                  <td>{output.score ?? '-'}</td>
                  <td>{output.feedback ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
