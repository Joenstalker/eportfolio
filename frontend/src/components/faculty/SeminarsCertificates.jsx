import React, { useState, useContext, useEffect } from 'react';
import  AuthContext  from '../../contexts/AuthContext';
import './facultyComponents.css';

const SeminarsCertificates = () => {
    const { user } = useContext(AuthContext);
    const [seminars, setSeminars] = useState([]);
    const [newSeminar, setNewSeminar] = useState({
        title: '',
        date: '',
        organizer: '',
        venue: '',
        duration: '',
        certificateFile: null
    });

    useEffect(() => {
        // Load seminars from database
        loadSeminars();
    }, []);

    const loadSeminars = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/seminars', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSeminars(Array.isArray(data) ? data : (data.seminars || []));
            }
        } catch (error) {
            console.error('Error loading seminars:', error);
        }
    };

    const handleFileChange = (e) => {
        setNewSeminar({...newSeminar, certificateFile: e.target.files[0]});
    };

    const addSeminar = async () => {
        if (!newSeminar.title || !newSeminar.date || !newSeminar.organizer) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', newSeminar.title);
            formData.append('date', newSeminar.date);
            formData.append('organizer', newSeminar.organizer);
            formData.append('venue', newSeminar.venue);
            formData.append('duration', newSeminar.duration);
            if (newSeminar.certificateFile) {
                formData.append('certificate', newSeminar.certificateFile);
            }

            const response = await fetch('http://localhost:5000/api/seminars', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                setSeminars([...seminars, result.seminar]);
                setNewSeminar({
                    title: '', date: '', organizer: '', venue: '', duration: '', certificateFile: null
                });
                document.getElementById('certificate-upload').value = '';
                alert('Seminar added successfully!');
            }
        } catch (error) {
            console.error('Error adding seminar:', error);
            alert('Error adding seminar');
        }
    };

    return (
        <div className="faculty-section">
            <div className="section-header">
                <h2>Seminars and Certificates</h2>
                <p>Manage your seminar participations and certificates</p>
            </div>

            <div className="content-card">
                <h3>Add New Seminar</h3>
                
                <div className="form-grid">
                    <div className="form-group">
                        <label>Seminar Title *</label>
                        <input
                            type="text"
                            value={newSeminar.title}
                            onChange={(e) => setNewSeminar({...newSeminar, title: e.target.value})}
                            placeholder="Enter seminar title"
                        />
                    </div>
                    <div className="form-group">
                        <label>Date *</label>
                        <input
                            type="date"
                            value={newSeminar.date}
                            onChange={(e) => setNewSeminar({...newSeminar, date: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>Organizer *</label>
                        <input
                            type="text"
                            value={newSeminar.organizer}
                            onChange={(e) => setNewSeminar({...newSeminar, organizer: e.target.value})}
                            placeholder="Enter organizer name"
                        />
                    </div>
                    <div className="form-group">
                        <label>Venue</label>
                        <input
                            type="text"
                            value={newSeminar.venue}
                            onChange={(e) => setNewSeminar({...newSeminar, venue: e.target.value})}
                            placeholder="Enter venue"
                        />
                    </div>
                    <div className="form-group">
                        <label>Duration (hours)</label>
                        <input
                            type="number"
                            value={newSeminar.duration}
                            onChange={(e) => setNewSeminar({...newSeminar, duration: e.target.value})}
                            placeholder="Duration in hours"
                        />
                    </div>
                    <div className="form-group">
                        <label>Certificate</label>
                        <input
                            id="certificate-upload"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                <button className="save-button" onClick={addSeminar}>
                    Add Seminar
                </button>

                <div className="items-list" style={{marginTop: '2rem'}}>
                    <h3>Your Seminars</h3>
                    {seminars.map(seminar => (
                        <div key={seminar._id} className="item-card">
                            <div className="item-header">
                                <h4>{seminar.title}</h4>
                                <span className="section-badge">{seminar.date}</span>
                            </div>
                            <p><strong>Organizer:</strong> {seminar.organizer}</p>
                            <p><strong>Venue:</strong> {seminar.venue}</p>
                            <p><strong>Duration:</strong> {seminar.duration} hours</p>
                            {seminar.certificateFile?.fileUrl && (
                                <a href={`http://localhost:5000${seminar.certificateFile.fileUrl}`} target="_blank" rel="noopener noreferrer">
                                    View Certificate
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SeminarsCertificates;