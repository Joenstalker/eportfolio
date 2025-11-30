import React, { useState, useContext, useEffect } from 'react';
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
            
            console.log('📦 Loading materials with token...');
            const response = await fetch('http://localhost:5000/api/class-portfolio', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📡 Load response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Materials loaded:', data);
                
                // Flatten materials from all class portfolios
                const allMaterials = data.flatMap(portfolio => portfolio.materials || []);
                setMaterials(allMaterials);
            } else {
                console.log('⚠️ Could not load materials, but continuing...');
            }
            
        } catch (error) {
            console.error('❌ Error loading materials:', error);
        }
    };

    const addMaterial = async () => {
        console.log('🚀 Starting upload process...');
        console.log('📝 Form data:', newMaterial);
        console.log('📁 Selected file:', selectedFile);
        
        if (!newMaterial.title || !newMaterial.subject) {
            alert('Please fill in title and subject');
            return;
        }

        if (!selectedFile) {
            alert('Please select a file to upload');
            return;
        }

        setLoading(true);
        try {
            const token = getToken();
            
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

            if (response.ok) {
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
                
                alert('Material added successfully!');
            } else {
                const errorText = await response.text();
                console.error('❌ Upload failed:', errorText);
                
                // Even if upload fails, we still have a token for next time
                if (response.status === 401) {
                    alert('Upload requires proper authentication. Please ensure you are logged in with a valid account.');
                } else {
                    alert(`Upload failed: ${errorText}`);
                }
            }
            
        } catch (error) {
            console.error('❌ Error adding material:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const deleteMaterial = async (materialId) => {
        if (!window.confirm('Are you sure you want to delete this material?')) return;

        try {
            const token = getToken();
            
            console.log('🗑️ Deleting material:', materialId);
            const response = await fetch(`http://localhost:5000/api/class-portfolio/materials/${materialId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Delete response status:', response.status);

            if (response.ok) {
                // Remove from local state
                setMaterials(materials.filter(material => material._id !== materialId));
                alert('Material deleted successfully!');
            } else {
                console.error('❌ Delete failed with status:', response.status);
                alert('Error deleting material. Please try again.');
            }
            
        } catch (error) {
            console.error('❌ Error deleting material:', error);
            alert('Error deleting material: ' + error.message);
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
                                    <button 
                                        className="action-btn delete"
                                        onClick={() => deleteMaterial(material._id)}
                                    >
                                        🗑️ Delete
                                    </button>
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