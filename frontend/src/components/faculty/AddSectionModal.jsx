import React, { useState } from 'react';
import Swal from 'sweetalert2';
import './AddSectionModal.css';

const VALID_SEMESTERS = ['First Semester', 'Second Semester'];

export default function AddSectionModal({ courseId, facultyId, defaultSemester = '', onClose, onSaved }) {
  const [name, setName] = useState('');
  const [semester, setSemester] = useState(defaultSemester || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const token = localStorage.getItem('token');

    if (!trimmedName || !semester) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Section name and semester are required.',
        confirmButtonColor: '#e74c3c'
      });
      return;
    }

    if (!VALID_SEMESTERS.includes(semester)) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Semester must be First Semester or Second Semester.',
        confirmButtonColor: '#e74c3c'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          courseId,
          facultyId,
          name: trimmedName,
          semester
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to add section');
      }

      onSaved?.(payload);
      onClose();
      Swal.fire({
        icon: 'success',
        title: 'Section Added',
        text: 'Section created successfully.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to add section',
        confirmButtonColor: '#e74c3c'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="asm-modal" role="dialog" aria-modal="true" aria-labelledby="asm-title">
      <form className="asm-content" onSubmit={handleSubmit}>
        <div className="asm-header">
          <h3 id="asm-title" className="asm-title">Add Section</h3>
          <p className="asm-subtitle">Create a section for this course</p>
        </div>

        <div className="asm-body">
          <div className="asm-field">
            <label className="asm-label" htmlFor="section-name">Section Name</label>
            <input
              id="section-name"
              className="asm-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., BSIT 2A or BSCS 1B"
              required
              aria-required="true"
            />
            <div className="asm-help">Example: BSIT 2A, BSCS 1B</div>
          </div>

          <div className="asm-field">
            <label className="asm-label" htmlFor="section-semester">Semester</label>
            <select
              id="section-semester"
              className="asm-select"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              required
              aria-required="true"
            >
              <option value="">Select Semester</option>
              <option value="First Semester">First Semester</option>
              <option value="Second Semester">Second Semester</option>
            </select>
          </div>
        </div>

        <div className="asm-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Section'}
          </button>
        </div>
      </form>
    </div>
  );
}
