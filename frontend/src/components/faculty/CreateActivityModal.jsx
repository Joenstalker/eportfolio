import React, { useState } from 'react';

export default function CreateActivityModal({ courseId, section, facultyId, onClose }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    maxScore: '',
    instructionsFile: null,
    rubricFile: null
  });

  const handleChange = e => {
    const { name, value, files } = e.target;
    setForm(f => ({
      ...f,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    // TODO: Implement API call to POST /api/activities/teaching
    onClose();
  };

  return (
    <div className="modal">
      <form onSubmit={handleSubmit}>
        <h3>Create Activity</h3>
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <input name="maxScore" type="number" placeholder="Max Score" value={form.maxScore} onChange={handleChange} required />
        <input name="instructionsFile" type="file" accept=".pdf,.doc,.docx" onChange={handleChange} />
        <input name="rubricFile" type="file" accept=".pdf,.doc,.docx" onChange={handleChange} />
        <div style={{marginTop: 16}}>
          <button type="submit">Save</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
