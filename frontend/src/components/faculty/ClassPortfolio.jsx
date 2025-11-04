import React, { useState, useContext, useEffect } from 'react';
import  AuthContext  from '../../contexts/AuthContext';
import './facultyComponents.css';

const ClassPortfolio = () => {
    const { user } = useContext(AuthContext);
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

    const loadMaterials = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/class-portfolio', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                // Flatten materials from all class portfolios
                const allMaterials = data.flatMap(portfolio => portfolio.materials);
                setMaterials(allMaterials);
            }
        } catch (error) {
            console.error('Error loading materials:', error);
        }
    };

    const addMaterial = async () => {
        console.log('Starting upload process...');
        console.log('Form data:', newMaterial);
        
        if (!newMaterial.title || !newMaterial.subject) {
            alert('Please fill in title and subject');
            return;
        }

        if (!selectedFile) {
            alert('Please select a file to upload');
            return;
        }

        console.log('Selected file:', selectedFile);

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
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

            console.log('Sending request to server...');

            const response = await fetch('http://localhost:5000/api/class-portfolio/materials', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Server error occurred' }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Upload successful:', result);
            
            setMaterials([...materials, result.material]);
            
            // Reset form
            setNewMaterial({ 
                title: '', subject: '', type: 'Lecture', description: '', 
                section: '', topic: '', isPublic: false 
            });
            setSelectedFile(null);
            document.getElementById('material-file').value = '';
            alert('Material added successfully!');
            
        } catch (error) {
            console.error('Error adding material:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const deleteMaterial = async (materialId) => {
        if (!window.confirm('Are you sure you want to delete this material?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/class-portfolio/materials/${materialId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setMaterials(materials.filter(material => material._id !== materialId));
                alert('Material deleted successfully!');
            }
        } catch (error) {
            console.error('Error deleting material:', error);
            alert('Error deleting material');
        }
    };

    return (
        <div className="faculty-section">
            <div className="section-header">
                <h2>Class Portfolio</h2>
                <p>Upload and manage class materials</p>
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
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.jpg,.jpeg,.png"
                                onChange={(e) => setSelectedFile(e.target.files[0])}
                            />
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
                        {loading ? 'Uploading...' : 'Upload Material'}
                    </button>
                </div>

                {/* Materials List */}
                <div className="materials-grid">
                    <h4>Your Materials ({materials.length})</h4>
                    {materials.map(material => (
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
                                        href={`http://localhost:5000/${material.fileUrl}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="action-btn view"
                                    >
                                        Download
                                    </a>
                                )}
                                <button 
                                    className="action-btn delete"
                                    onClick={() => deleteMaterial(material._id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ClassPortfolio;