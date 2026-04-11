import React, { useState } from 'react';
import Swal from 'sweetalert2';

const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx'];

const isValidInstructionsFile = (file) => {
  if (!file) return true;
  const fileName = (file.name || '').toLowerCase();
  return ALLOWED_FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
};

export default function AddActivityModal({ sectionId, onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructionsFile, setInstructionsFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const token = localStorage.getItem('token');

    if (!trimmedTitle) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Activity title is required.',
        confirmButtonColor: '#e74c3c'
      });
      return;
    }

    if (!isValidInstructionsFile(instructionsFile)) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid File',
        text: 'Instructions must be PDF, DOC, or DOCX.',
        confirmButtonColor: '#e74c3c'
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('sectionId', sectionId);
      formData.append('title', trimmedTitle);
      formData.append('description', description.trim());
      if (instructionsFile) {
        formData.append('instructionsFile', instructionsFile);
      }

      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to add activity');
      }

      onSaved?.(payload);
      onClose();
      Swal.fire({
        icon: 'success',
        title: 'Activity Added',
        text: 'Activity created successfully.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to add activity',
        confirmButtonColor: '#e74c3c'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <form className="modal-content" onSubmit={handleSubmit}>
        <h4>Add Activity</h4>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Activity Title"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
        />
        <input
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => setInstructionsFile(e.target.files?.[0] || null)}
        />
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
