import React from 'react';

function FileRow({ file }) {
  const url = file?.webViewLink || file?.fileUrl || file?.path || '';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #eee' }}>
      <div style={{ fontSize: '0.95rem' }}>{file?.fileName || file?.originalName || 'File'}</div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#1e88e5' }}>Open</a>
        ) : (
          <span style={{ color: '#999' }}>No link</span>
        )}
      </div>
    </div>
  );
}

export default function AdminPreviewModal({ sectionId, portfolio, onClose }) {
  const slots = (portfolio?.slots || []).slice().sort((a, b) => a.slotNumber - b.slotNumber);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
      <div style={{ width: '86%', maxWidth: '980px', background: '#fff', borderRadius: '8px', padding: '1rem', maxHeight: '88vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <h3 style={{ margin: 0 }}>Admin Preview — Section</h3>
          <div>
            <button onClick={onClose} style={{ padding: '0.4rem 0.7rem', borderRadius: '6px', border: 'none', background: '#e74c3c', color: '#fff', cursor: 'pointer' }}>Close</button>
          </div>
        </div>

        {slots.length === 0 && <div style={{ padding: '1rem', color: '#666' }}>No activity slots available.</div>}

        {slots.map((slot) => (
          <div key={`preview-slot-${slot.slotNumber}`} style={{ border: '1px solid #eef2f6', borderRadius: '8px', padding: '0.9rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <strong>Course Outcome {slot.courseOutcomeNumber} — Activity {slot.activityNumber}</strong>
              <span style={{ fontSize: '0.85rem', color: '#666' }}>{slot.status || 'unknown'}</span>
            </div>
            {slot.title && <div style={{ marginBottom: '0.4rem', color: '#333' }}>{slot.title}</div>}
            {slot.notes && <div style={{ marginBottom: '0.6rem', color: '#555' }}>{slot.notes}</div>}

            <div style={{ marginTop: '0.4rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Instructions</div>
              {(slot.instructions ? [slot.instructions] : []).map((f, i) => <FileRow key={`ins-${i}`} file={f} />)}
            </div>

            <div style={{ marginTop: '0.6rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Student Outputs</div>
              {(slot.studentOutputs || []).map((f, i) => <FileRow key={`out-${i}`} file={f} />)}
            </div>

            <div style={{ marginTop: '0.6rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Rated Rubrics</div>
              {(slot.ratedRubrics || []).map((f, i) => <FileRow key={`rub-${i}`} file={f} />)}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
