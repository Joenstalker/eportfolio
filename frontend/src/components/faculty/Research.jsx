import React, { useState, useContext, useEffect } from 'react';
import  AuthContext  from '../../contexts/AuthContext';
import './facultyComponents.css';

const Research = () => {
    const { user } = useContext(AuthContext);
    const [researchPapers, setResearchPapers] = useState([]);
    const [newPaper, setNewPaper] = useState({
        title: '',
        authors: '',
        journal: '',
        publicationDate: '',
        doi: '',
        abstract: '',
        status: 'published',
        file: null
    });

    useEffect(() => {
        loadResearchPapers();
    }, []);

    const loadResearchPapers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/research', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                const items = Array.isArray(data)
                    ? data
                    : (data.researchPapers || data.research || data.researches || []);
                setResearchPapers(items);
            }
        } catch (error) {
            console.error('Error loading research papers:', error);
        }
    };

    const addResearchPaper = async () => {
        if (!newPaper.title || !newPaper.authors) {
            alert('Please fill in title and authors');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', newPaper.title);
            formData.append('authors', newPaper.authors);
            formData.append('journal', newPaper.journal);
            formData.append('publicationDate', newPaper.publicationDate);
            formData.append('doi', newPaper.doi);
            formData.append('abstract', newPaper.abstract);
            formData.append('status', newPaper.status);
            if (newPaper.file) {
                formData.append('researchFile', newPaper.file);
            }

            const response = await fetch('http://localhost:5000/api/research', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                const added = result.researchPaper || result.research || result;
                setResearchPapers(prev => [...prev, added]);
                setNewPaper({
                    title: '', authors: '', journal: '', publicationDate: '', 
                    doi: '', abstract: '', status: 'published', file: null
                });
                document.getElementById('research-file').value = '';
                alert('Research paper added successfully!');
            }
        } catch (error) {
            console.error('Error adding research paper:', error);
            alert('Error adding research paper');
        }
    };

    return (
        <div className="faculty-section">
            <div className="section-header">
                <h2>Research Publications</h2>
                <p>Manage your research papers and publications</p>
            </div>

            <div className="content-card">
                <h3>Add Research Paper</h3>
                
                <div className="form-grid">
                    <div className="form-group">
                        <label>Paper Title *</label>
                        <input
                            type="text"
                            value={newPaper.title}
                            onChange={(e) => setNewPaper({...newPaper, title: e.target.value})}
                            placeholder="Enter paper title"
                        />
                    </div>
                    <div className="form-group">
                        <label>Authors *</label>
                        <input
                            type="text"
                            value={newPaper.authors}
                            onChange={(e) => setNewPaper({...newPaper, authors: e.target.value})}
                            placeholder="Enter authors (comma separated)"
                        />
                    </div>
                    <div className="form-group">
                        <label>Journal/Conference</label>
                        <input
                            type="text"
                            value={newPaper.journal}
                            onChange={(e) => setNewPaper({...newPaper, journal: e.target.value})}
                            placeholder="Enter journal or conference name"
                        />
                    </div>
                    <div className="form-group">
                        <label>Publication Date</label>
                        <input
                            type="date"
                            value={newPaper.publicationDate}
                            onChange={(e) => setNewPaper({...newPaper, publicationDate: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>DOI</label>
                        <input
                            type="text"
                            value={newPaper.doi}
                            onChange={(e) => setNewPaper({...newPaper, doi: e.target.value})}
                            placeholder="Enter DOI"
                        />
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select 
                            value={newPaper.status}
                            onChange={(e) => setNewPaper({...newPaper, status: e.target.value})}
                        >
                            <option value="published">Published</option>
                            <option value="submitted">Submitted</option>
                            <option value="in-progress">In Progress</option>
                        </select>
                    </div>
                    <div className="form-group full-width">
                        <label>Abstract</label>
                        <textarea
                            rows="4"
                            value={newPaper.abstract}
                            onChange={(e) => setNewPaper({...newPaper, abstract: e.target.value})}
                            placeholder="Enter paper abstract"
                        />
                    </div>
                    <div className="form-group">
                        <label>Upload Paper</label>
                        <input
                            id="research-file"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setNewPaper({...newPaper, file: e.target.files[0]})}
                        />
                    </div>
                </div>

                <button className="save-button" onClick={addResearchPaper}>
                    Add Research Paper
                </button>

                <div className="items-list" style={{marginTop: '2rem'}}>
                    <h3>Your Research Papers</h3>
                    {researchPapers.map(paper => (
                        <div key={paper._id} className="item-card">
                            <div className="item-header">
                                <h4>{paper.title}</h4>
                                <span className={`status-badge ${paper.status}`}>
                                    {paper.status}
                                </span>
                            </div>
                            <p><strong>Authors:</strong> {paper.authors}</p>
                            <p><strong>Journal:</strong> {paper.journal}</p>
                            <p><strong>Published:</strong> {paper.publicationDate}</p>
                            {paper.doi && <p><strong>DOI:</strong> {paper.doi}</p>}
                            {paper.abstract && (
                                <p><strong>Abstract:</strong> {paper.abstract.substring(0, 200)}...</p>
                            )}
                            {paper.fileUrl && (
                                <a href={`http://localhost:5000/${paper.fileUrl}`} target="_blank" rel="noopener noreferrer">
                                    Download Paper
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Research;