import React, { useState } from 'react';
import Swal from 'sweetalert2';

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
    <div className="modal">
      <form className="modal-content" onSubmit={handleSubmit}>
        <h4>Add Section</h4>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Section Name (e.g., BSIT 2A)"
          required
        />
        <select value={semester} onChange={(e) => setSemester(e.target.value)} required>
          <option value="">Select Semester</option>
          <option value="First Semester">First Semester</option>
          <option value="Second Semester">Second Semester</option>
        </select>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
