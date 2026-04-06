import React, { useState, useContext, useEffect, useRef } from 'react';
import  AuthContext  from '../../contexts/AuthContext';
import './facultyComponents.css';
import { FaTrash, FaDownload } from 'react-icons/fa';
import Swal from 'sweetalert2';

const InstructionalMaterials = () => {
    const { user, ensureToken } = useContext(AuthContext);
    const fileInputRef = useRef(null);
    const [materials, setMaterials] = useState([]);
    const [newMaterial, setNewMaterial] = useState({
        title: '',
        course: '',
        description: '',
        subject: '',
        type: 'lecture',
        tags: '',
        accessLevel: 'private',
        file: null
    });

    useEffect(() => {
        loadMaterials();
    }, []);

    const confirmFileManagerAccess = async () => {
        const result = await Swal.fire({
            title: 'Allow file access?',
            text: 'Do you allow this app to access your file manager to select a file?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Allow',
            cancelButtonText: 'Deny',
            confirmButtonColor: '#3498db',
            cancelButtonColor: '#95a5a6'
        });

        return result.isConfirmed;
    };

    const showDenyPermissionWarning = () => {
        Swal.fire({
            title: 'Warning!',
            text: 'No permissions (cannot upload to this course)',
            icon: 'warning',
            confirmButtonColor: '#e74c3c'
        });
    };

    const handleSelectFile = async () => {
        const acceptedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.mp4', '.jpg', '.jpeg', '.png'];

        const allowed = await confirmFileManagerAccess();
        if (!allowed) {
            showDenyPermissionWarning();
            return;
        }

        // Prefer the File System Access API when available to explicitly request read permission.
        if (typeof window.showOpenFilePicker === 'function') {
            try {
                const [fileHandle] = await window.showOpenFilePicker({
                    multiple: false,
                    types: [
                        {
                            description: 'Allowed files',
                            accept: {
                                'application/pdf': ['.pdf'],
                                'application/msword': ['.doc'],
                                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                                'application/vnd.ms-powerpoint': ['.ppt'],
                                'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
                                'video/mp4': ['.mp4'],
                                'image/jpeg': ['.jpg', '.jpeg'],
                                'image/png': ['.png']
                            }
                        }
                    ],
                    excludeAcceptAllOption: true
                });

                const file = await fileHandle.getFile();
                const fileExt = file.name.includes('.') ? `.${file.name.split('.').pop().toLowerCase()}` : '';
                if (!acceptedExtensions.includes(fileExt)) {
                    Swal.fire({
                        title: 'Invalid File Type!',
                        text: 'Please select a valid file type.',
                        icon: 'warning',
                        confirmButtonColor: '#e74c3c'
                    });
                    return;
                }

                setNewMaterial({ ...newMaterial, file });
                return;
            } catch (error) {
                if (error?.name === 'NotAllowedError') {
                    showDenyPermissionWarning();
                    return;
                }
                if (error?.name === 'AbortError') {
                    return;
                }
                console.error('Error selecting file:', error);
            }
        }

        // Fallback for browsers without File System Access API.
        fileInputRef.current?.click();
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0] || null;
        if (!file) {
            return;
        }

        setNewMaterial({ ...newMaterial, file });
    };

    const getResponseErrorMessage = async (response) => {
        try {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const data = await response.json();
                return data.message || data.error || `HTTP error! status: ${response.status}`;
            }

            const text = await response.text();
            return text || `HTTP error! status: ${response.status}`;
        } catch (parseError) {
            return `HTTP error! status: ${response.status}`;
        }
    };

    const loadMaterials = async () => {
        try {
            const token = ensureToken();
            if (!token) {
                console.error('No token available');
                return;
            }
            
            const response = await fetch('http://localhost:5000/api/materials', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setMaterials(Array.isArray(data) ? data : (data.materials || []));
        } catch (error) {
            console.error('Error loading materials:', error);
            if (error.message.includes('Failed to fetch')) {
                Swal.fire({
                    title: 'Connection Error!',
                    text: 'Unable to connect to server. Please make sure the backend is running.',
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: `Error loading materials: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    };

    const addMaterial = async () => {
        const normalizedTitle = (newMaterial.title || '').trim();
        const normalizedCourseCode = (newMaterial.course || '').trim().toUpperCase();
        const description = (newMaterial.description || '').trim();
        //const courseCodePattern = /^[A-Z]{2,4}\d{3}$/;

        if (!description) {
            Swal.fire({
                title: 'Warning!',
                text: 'Description required (add material description)',
                icon: 'warning',
                confirmButtonColor: '#e74c3c'
            });
            return;
        }

        if (!normalizedTitle || !normalizedCourseCode || !newMaterial.file) {
            Swal.fire({
                title: 'Missing Fields!',
                text: 'Please fill in title, course ID, and upload a file.',
                icon: 'warning',
                confirmButtonColor: '#e74c3c'
            });
            return;
        }
    
        const maxFileSizeBytes = 10 * 1024 * 1024;
        if (newMaterial.file.size > maxFileSizeBytes) {
            Swal.fire({
                title: 'File Too Large!',
                text: 'Instructional material file must be 10MB or less.',
                icon: 'warning',
                confirmButtonColor: '#e74c3c'
            });
            return;
        }

        try {
            const token = ensureToken();
            if (!token) {
                Swal.fire({
                    title: 'Authentication Required!',
                    text: 'Please log in again.',
                    icon: 'warning',
                    confirmButtonColor: '#e74c3c'
                });
                return;
            }
            
            const formData = new FormData();
            formData.append('title', normalizedTitle);
            formData.append('courseCode', normalizedCourseCode);
            formData.append('description', (newMaterial.description || '').trim());
            // Send both subjectCode and subjectName (using the same value for now)
            formData.append('subjectCode', (newMaterial.subject || 'General').trim() || 'General');
            formData.append('subjectName', (newMaterial.subject || '').trim());
            formData.append('type', newMaterial.type);
            formData.append('tags', (newMaterial.tags || '').trim());
            // Map accessLevel to isPublic (boolean) for the backend
            formData.append('isPublic', newMaterial.accessLevel === 'public');
            if (newMaterial.file) {
                formData.append('file', newMaterial.file);
            }

            const response = await fetch('http://localhost:5000/api/materials', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (!response.ok) {
                const errorMessage = await getResponseErrorMessage(response);
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            setMaterials([...materials, result.material]);
            setNewMaterial({
                title: '', course: '', description: '', subject: '', type: 'lecture',
                tags: '', accessLevel: 'private', file: null
            });
            document.getElementById('material-file').value = '';
            Swal.fire({
                title: 'Success!',
                text: 'Material uploaded successfully!',
                icon: 'success',
                confirmButtonColor: '#3498db',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error uploading material:', error);
            if (error.message.includes('Failed to fetch')) {
                Swal.fire({
                    title: 'Connection Error!',
                    text: 'Unable to connect to server. Please make sure the backend is running.',
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: `Error uploading material: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    };

    const deleteMaterial = async (id) => {
        const confirm = await Swal.fire({
            title: 'Are you sure?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#95a5a6',
            confirmButtonText: 'Delete'
        });

        if (confirm.isConfirmed) {
            try {
                const token = ensureToken();
                const response = await fetch(`http://localhost:5000/api/materials/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                setMaterials(materials.filter(material => material._id !== id));
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Material has been deleted.',
                    icon: 'success',
                    confirmButtonColor: '#3498db',
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error('Error deleting material:', error);
                Swal.fire({
                    title: 'Error!',
                    text: `Error deleting material: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    };

    const getTypeIcon = (type) => {
        const icons = {
            lecture: '📚',
            presentation: '📊',
            handout: '📄',
            video: '🎥',
            assignment: '📝',
            quiz: '❓',
            exam: '시험',
            project: '🏗️',
            other: '📁'
        };
        return icons[type] || '📁';
    };

    return (
        <div className="faculty-section">
            <div className="section-header">
                <h2>Instructional Materials</h2>
                <p>Manage your teaching resources and materials</p>
            </div>

            <div className="content-card">
                <h3>Upload Instructional Material</h3>
                
                <div className="form-grid">
                    <div className="form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            value={newMaterial.title}
                            onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                            placeholder="Enter material title"
                        />
                    </div>
                    <div className="form-group">
                        <label>Course ID *</label>
                        <input
                            type="text"
                            value={newMaterial.course}
                            onChange={(e) => setNewMaterial({...newMaterial, course: e.target.value.toUpperCase()})}
                            placeholder="Enter course ID (e.g., IT131)"
                        />
                    </div>
                    <div className="form-group">
                        <label>Subject</label>
                        <input
                            type="text"
                            value={newMaterial.subject}
                            onChange={(e) => setNewMaterial({...newMaterial, subject: e.target.value})}
                            placeholder="Enter subject"
                        />
                    </div>
                    <div className="form-group">
                        <label>Type</label>
                        <select 
                            value={newMaterial.type}
                            onChange={(e) => setNewMaterial({...newMaterial, type: e.target.value})}
                        >
                            <option value="lecture">Lecture</option>
                            <option value="presentation">Presentation</option>
                            <option value="handout">Handout</option>
                            <option value="video">Video</option>
                            <option value="assignment">Assignment</option>
                            <option value="quiz">Quiz</option>
                            <option value="exam">Exam</option>
                            <option value="project">Project</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Access Level</label>
                        <select 
                            value={newMaterial.accessLevel}
                            onChange={(e) => setNewMaterial({...newMaterial, accessLevel: e.target.value})}
                        >
                            <option value="private">Private</option>
                            <option value="department">Department</option>
                            <option value="public">Public</option>
                        </select>
                    </div>
                    <div className="form-group full-width">
                        <label>Description</label>
                        <textarea
                            rows="3"
                            value={newMaterial.description}
                            onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                            placeholder="Enter material description"
                        />
                    </div>
                    <div className="form-group">
                        <label>Tags</label>
                        <input
                            type="text"
                            value={newMaterial.tags}
                            onChange={(e) => setNewMaterial({...newMaterial, tags: e.target.value})}
                            placeholder="Enter tags (comma separated)"
                        />
                    </div>
                    <div className="form-group">
                        <label>Upload File *</label>
                        <button
                            type="button"
                            className="save-button"
                            style={{ width: '100%', padding: '0.6rem 0.8rem' }}
                            onClick={handleSelectFile}
                        >
                            Select File
                        </button>
                        <input
                            ref={fileInputRef}
                            id="material-file"
                            type="file"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.jpg,.jpeg,.png"
                            style={{ display: 'none' }}
                            onChange={handleFileInputChange}
                        />
                        {newMaterial.file && (
                            <small style={{ display: 'block', marginTop: '0.5rem', color: '#555' }}>
                                Selected: {newMaterial.file.name}
                            </small>
                        )}
                    </div>
                </div>

                <button className="save-button" onClick={addMaterial}>
                    Upload Material
                </button>

                <div className="materials-grid" style={{marginTop: '2rem'}}>
                    <h3>Your Instructional Materials</h3>
                    {materials.map(material => (
                        <div key={material._id} className="material-card" style={{ padding: '1rem', marginBottom: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                            <div className="material-icon">
                                {getTypeIcon(material.type)}
                            </div>
                            <h4>{material.title}</h4>
                            <p className="material-subject"><strong>Course:</strong> {material.courseCode || 'N/A'}</p>
                            <p className="material-subject">{material.subject}</p>
                            <p className="material-type">{material.type}</p>
                            <p className="material-description">{material.description}</p>
                            <span className={`access-badge ${material.accessLevel}`}>
                                {material.accessLevel}
                            </span>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <a href={`http://localhost:5000${material.file?.fileUrl || material.fileUrl || ''}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', color: '#3498db', textDecoration: 'none' }}>
                                    <FaDownload style={{ marginRight: '0.5rem' }} /> Download
                                </a>
                                <button onClick={() => deleteMaterial(material._id)} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                                    <FaTrash style={{ marginRight: '0.5rem' }} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InstructionalMaterials;