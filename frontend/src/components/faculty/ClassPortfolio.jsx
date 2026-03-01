import React, { useState, useContext, useEffect } from 'react';
import Swal from 'sweetalert2';
import AuthContext from '../../contexts/AuthContext';
import './facultyComponents.css';

const ClassPortfolio = () => {
    const { user, ensureToken } = useContext(AuthContext);
    const [materials, setMaterials] = useState([]);
    const [newMaterial, setNewMaterial] = useState({ 
        title: '', 
        subject: '', 
        type: 'Lecture',
        description: '',
        section: '',
        topic: '',
        isPublic: false
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadMaterials();
    }, []);

    // Always ensure we have a token
    const getToken = () => {
        const token = ensureToken();
        console.log('🔐 Using token:', token ? 'Token available' : 'No token');
        return token;
    };

    const loadMaterials = async () => {
        try {
            const token = getToken();
            if (!token) {
                console.error('No token available');
                return;
            }
            
            console.log('📦 Loading materials with token...');
            const response = await fetch('http://localhost:5000/api/class-portfolio', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📡 Load response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Materials loaded:', data);
            
            // Flatten materials from all class portfolios
            const allMaterials = data.flatMap(portfolio => portfolio.materials || []);
            setMaterials(allMaterials);
        } catch (error) {
            console.error('❌ Error loading materials:', error);
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
        console.log('🚀 Starting upload process...');
        console.log('📝 Form data:', newMaterial);
        console.log('📁 Selected file:', selectedFile);
        
        if (!newMaterial.title || !newMaterial.subject) {
            Swal.fire({
                title: 'Missing Fields!',
                text: 'Please fill in title and subject',
                icon: 'warning',
                confirmButtonColor: '#e74c3c'
            });
            return;
        }

        if (!selectedFile) {
            Swal.fire({
                title: 'No File Selected!',
                text: 'Please select a file to upload',
                icon: 'warning',
                confirmButtonColor: '#e74c3c'
            });
            return;
        }

        setLoading(true);
        try {
            const token = getToken();
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
            
            // Append all form data
            formData.append('title', newMaterial.title);
            formData.append('subject', newMaterial.subject);
            formData.append('type', newMaterial.type);
            formData.append('description', newMaterial.description);
            formData.append('section', newMaterial.section);
            formData.append('topic', newMaterial.topic);
            formData.append('isPublic', newMaterial.isPublic.toString());
            formData.append('materialFile', selectedFile);

            console.log('📤 Sending request to server...');

            const response = await fetch('http://localhost:5000/api/class-portfolio/materials', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Upload successful:', result);
            
            // Add the new material to the list
            setMaterials(prev => [...prev, result.material]);
            
            // Reset form
            setNewMaterial({ 
                title: '', 
                subject: '', 
                type: 'Lecture', 
                description: '', 
                section: '', 
                topic: '', 
                isPublic: false 
            });
            setSelectedFile(null);
            document.getElementById('material-file').value = '';
            
            Swal.fire({
                title: 'Success!',
                text: 'Material added successfully!',
                icon: 'success',
                confirmButtonColor: '#3498db',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('❌ Error adding material:', error);
            if (error.message.includes('Failed to fetch')) {
                Swal.fire({
                    title: 'Connection Error!',
                    text: 'Unable to connect to server. Please make sure the backend is running.',
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            } else {
                Swal.fire({
                    title: 'Upload Failed!',
                    text: `Upload failed: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const deleteMaterial = async (materialId) => {
        if (!materialId) {
            console.error('❌ Cannot delete material: materialId is undefined');
            Swal.fire({
                title: 'Error!',
                text: 'Material ID is missing. Unable to delete.',
                icon: 'error',
                confirmButtonColor: '#e74c3c'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to revert this!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });
        
        if (!result.isConfirmed) return;

        try {
            const token = getToken();
            const response = await fetch(`/api/class-portfolio/materials/${materialId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            Swal.fire('Deleted!', 'Your material has been deleted.', 'success');
            loadMaterials();
        } catch (error) {
            console.error('❌ Error deleting material:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to delete material. Please try again later.',
                icon: 'error',
                confirmButtonColor: '#e74c3c'
            });
        }
    };

    return (
        <div className="faculty-section">
            <div className="section-header">
                <h2>Class Portfolio</h2>
                <p>Upload and manage class materials</p>
                <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                    Status: {localStorage.getItem('token') ? '✅ Token Available' : '❌ No Token'} |
                    User: {user ? user.email : 'Not logged in'}
                </div>
            </div>

            <div className="content-card">
                <h3>Class Materials</h3>
                
                {/* Upload Form */}
                <div className="upload-section">
                    <h4>Upload New Material</h4>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Material Title *</label>
                            <input
                                type="text"
                                placeholder="e.g., Lecture 1 Slides"
                                value={newMaterial.title}
                                onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Subject *</label>
                            <input
                                type="text"
                                placeholder="e.g., CS101"
                                value={newMaterial.subject}
                                onChange={(e) => setNewMaterial({...newMaterial, subject: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Type</label>
                            <select 
                                value={newMaterial.type}
                                onChange={(e) => setNewMaterial({...newMaterial, type: e.target.value})}
                            >
                                <option value="Lecture">Lecture</option>
                                <option value="Assignment">Assignment</option>
                                <option value="Presentation">Presentation</option>
                                <option value="Notes">Notes</option>
                                <option value="Video">Video</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Section</label>
                            <input
                                type="text"
                                placeholder="e.g., Section A"
                                value={newMaterial.section}
                                onChange={(e) => setNewMaterial({...newMaterial, section: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Topic</label>
                            <input
                                type="text"
                                placeholder="e.g., Introduction to Programming"
                                value={newMaterial.topic}
                                onChange={(e) => setNewMaterial({...newMaterial, topic: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                rows="3"
                                placeholder="Enter material description"
                                value={newMaterial.description}
                                onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Upload File *</label>
                            <input
                                id="material-file"
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
                                onChange={(e) => setSelectedFile(e.target.files[0])}
                            />
                            {selectedFile && (
                                <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                                    Selected: {selectedFile.name}
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={newMaterial.isPublic}
                                    onChange={(e) => setNewMaterial({...newMaterial, isPublic: e.target.checked})}
                                />
                                Make Public
                            </label>
                        </div>
                    </div>
                    <button 
                        className="upload-button" 
                        onClick={addMaterial}
                        disabled={loading}
                    >
                        {loading ? '📤 Uploading...' : '📁 Upload Material'}
                    </button>
                </div>

                {/* Materials List */}
                <div className="materials-grid">
                    <h4>Your Materials ({materials.length})</h4>
                    {materials.length === 0 ? (
                        <p style={{textAlign: 'center', color: '#666', padding: '20px'}}>
                            No materials uploaded yet.
                        </p>
                    ) : (
                        materials.map(material => (
                            <div key={material._id} className="material-card">
                                <div className="material-icon">
                                    {material.type === 'Lecture' ? '📚' : 
                                     material.type === 'Assignment' ? '📝' : 
                                     material.type === 'Presentation' ? '📊' : 
                                     material.type === 'Video' ? '🎥' : '📄'}
                                </div>
                                <h4>{material.title}</h4>
                                <p className="material-subject">{material.subject}</p>
                                <p className="material-type">{material.type}</p>
                                {material.description && (
                                    <p className="material-description">{material.description}</p>
                                )}
                                <p className="material-date">
                                    Uploaded: {new Date(material.uploadDate).toLocaleDateString()}
                                </p>
                                <div className="material-actions">
                                    {material.fileUrl && (
                                        <a 
                                            href={`http://localhost:5000${material.fileUrl}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="action-btn view"
                                        >
                                            📥 Download
                                        </a>
                                    )}
                                    {material._id && (
                                        <button 
                                            className="action-btn delete"
                                            onClick={() => deleteMaterial(material._id)}
                                        >
                                            🗑️ Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClassPortfolio;