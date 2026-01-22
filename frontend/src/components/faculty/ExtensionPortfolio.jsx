import React, { useState, useContext, useEffect } from 'react';
import Swal from 'sweetalert2';
import AuthContext from '../../contexts/AuthContext';
import './facultyComponents.css';

const ExtensionPortfolio = () => {
    const { user, ensureToken } = useContext(AuthContext);
    const [extensions, setExtensions] = useState([]);
    const [filteredExtensions, setFilteredExtensions] = useState([]);
    const [filterCategory, setFilterCategory] = useState('All');
    const [newExtension, setNewExtension] = useState({
        title: '',
        category: 'Community Service',
        description: '',
        startDate: '',
        endDate: '',
        venue: '',
        beneficiaries: '',
        numberOfParticipants: '',
        partners: '',
        budget: '',
        outcomes: '',
        status: 'Planning'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadExtensions();
    }, []);

    useEffect(() => {
        if (filterCategory === 'All') {
            setFilteredExtensions(extensions);
        } else {
            setFilteredExtensions(extensions.filter(ext => ext.category === filterCategory));
        }
    }, [extensions, filterCategory]);

    const loadExtensions = async () => {
        try {
            const token = ensureToken();
            if (!token) {
                console.error('No token available');
                return;
            }
            
            const response = await fetch('http://localhost:5000/api/extension', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setExtensions(data);
        } catch (error) {
            console.error('Error loading extensions:', error);
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
                    text: `Error loading extensions: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    };

    const addExtension = async () => {
        if (!newExtension.title || !newExtension.category) {
            Swal.fire({
                title: 'Missing Fields',
                text: 'Please fill in title and category',
                icon: 'warning',
                confirmButtonColor: '#e74c3c'
            });
            return;
        }

        setLoading(true);
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
            
            const response = await fetch('http://localhost:5000/api/extension', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newExtension)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            setExtensions([...extensions, result.extension]);
            setNewExtension({
                title: '',
                category: 'Community Service',
                description: '',
                startDate: '',
                endDate: '',
                venue: '',
                beneficiaries: '',
                numberOfParticipants: '',
                partners: '',
                budget: '',
                outcomes: '',
                status: 'Planning'
            });
            Swal.fire({
                title: 'Added!',
                text: 'Extension activity added successfully!',
                icon: 'success',
                confirmButtonColor: '#3498db',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error adding extension:', error);
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
                    text: `Error adding extension: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const deleteExtension = async (extensionId) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#95a5a6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (!result.isConfirmed) return;

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
            
            const response = await fetch(`http://localhost:5000/api/extension/${extensionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            setExtensions(extensions.filter(ext => ext._id !== extensionId));
            Swal.fire({
                title: 'Deleted!',
                text: 'Extension activity deleted successfully',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error deleting extension:', error);
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
                    text: `Error deleting extension: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    };

    const categories = ['Community Service', 'Training/Workshop', 'Consultancy', 'Outreach Program', 'Technical Assistance', 'Advocacy'];

    return (
        <div className="faculty-section">
            <div className="section-header">
                <h2>Extension Portfolio</h2>
                <p>Manage your community engagement and extension activities</p>
            </div>

            <div className="content-card">
                <h3>Extension Activities</h3>
                
                <div className="add-form">
                    <h4>Add New Extension Activity</h4>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Activity Title *</label>
                            <input
                                type="text"
                                placeholder="e.g., Community Computer Literacy Training"
                                value={newExtension.title}
                                onChange={(e) => setNewExtension({...newExtension, title: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Category *</label>
                            <select
                                value={newExtension.category}
                                onChange={(e) => setNewExtension({...newExtension, category: e.target.value})}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={newExtension.status}
                                onChange={(e) => setNewExtension({...newExtension, status: e.target.value})}
                            >
                                <option value="Planning">Planning</option>
                                <option value="Ongoing">Ongoing</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Start Date</label>
                            <input
                                type="date"
                                value={newExtension.startDate}
                                onChange={(e) => setNewExtension({...newExtension, startDate: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>End Date</label>
                            <input
                                type="date"
                                value={newExtension.endDate}
                                onChange={(e) => setNewExtension({...newExtension, endDate: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Venue</label>
                            <input
                                type="text"
                                placeholder="e.g., Barangay Hall"
                                value={newExtension.venue}
                                onChange={(e) => setNewExtension({...newExtension, venue: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Number of Participants</label>
                            <input
                                type="number"
                                placeholder="e.g., 50"
                                value={newExtension.numberOfParticipants}
                                onChange={(e) => setNewExtension({...newExtension, numberOfParticipants: e.target.value})}
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>Beneficiaries</label>
                            <input
                                type="text"
                                placeholder="e.g., Community Members, Students"
                                value={newExtension.beneficiaries}
                                onChange={(e) => setNewExtension({...newExtension, beneficiaries: e.target.value})}
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>Description</label>
                            <textarea
                                rows="3"
                                placeholder="Brief description of the activity..."
                                value={newExtension.description}
                                onChange={(e) => setNewExtension({...newExtension, description: e.target.value})}
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>Outcomes</label>
                            <textarea
                                rows="2"
                                placeholder="Expected or achieved outcomes..."
                                value={newExtension.outcomes}
                                onChange={(e) => setNewExtension({...newExtension, outcomes: e.target.value})}
                            />
                        </div>
                    </div>
                    <button 
                        className="add-button" 
                        onClick={addExtension}
                        disabled={loading}
                    >
                        {loading ? 'Adding...' : 'Add Extension Activity'}
                    </button>
                </div>

                <div className="items-list">
                    <div className="filter-section" style={{marginBottom: '1.5rem'}}>
                        <h4>Your Activities ({filteredExtensions.length})</h4>
                        <div className="filter-buttons" style={{display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap'}}>
                            <button 
                                className={`filter-btn ${filterCategory === 'All' ? 'active' : ''}`}
                                onClick={() => setFilterCategory('All')}
                                style={{padding: '0.5rem 1rem', borderRadius: '20px', border: filterCategory === 'All' ? '2px solid #3498db' : '2px solid #e0e0e0', background: filterCategory === 'All' ? '#3498db' : 'white', color: filterCategory === 'All' ? 'white' : '#2c3e50', cursor: 'pointer'}}
                            >
                                All ({extensions.length})
                            </button>
                            {categories.map(cat => (
                                <button 
                                    key={cat}
                                    className={`filter-btn ${filterCategory === cat ? 'active' : ''}`}
                                    onClick={() => setFilterCategory(cat)}
                                    style={{padding: '0.5rem 1rem', borderRadius: '20px', border: filterCategory === cat ? '2px solid #3498db' : '2px solid #e0e0e0', background: filterCategory === cat ? '#3498db' : 'white', color: filterCategory === cat ? 'white' : '#2c3e50', cursor: 'pointer'}}
                                >
                                    {cat} ({extensions.filter(e => e.category === cat).length})
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredExtensions.map(extension => (
                        <div key={extension._id} className="item-card">
                            <div className="item-header">
                                <h4>{extension.title}</h4>
                                <span className="section-badge">{extension.category}</span>
                            </div>
                            <p><strong>Status:</strong> {extension.status}</p>
                            {extension.startDate && <p><strong>Start:</strong> {new Date(extension.startDate).toLocaleDateString()}</p>}
                            {extension.venue && <p><strong>Venue:</strong> {extension.venue}</p>}
                            {extension.numberOfParticipants && <p><strong>Participants:</strong> {extension.numberOfParticipants}</p>}
                            {extension.description && <p>{extension.description}</p>}
                            <div className="item-actions">
                                <button className="action-btn view">View Details</button>
                                <button className="action-btn edit">Edit</button>
                                <button 
                                    className="action-btn delete"
                                    onClick={() => deleteExtension(extension._id)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExtensionPortfolio;
