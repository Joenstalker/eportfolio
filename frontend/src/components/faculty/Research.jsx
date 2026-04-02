import React, { useState, useContext, useEffect } from 'react';
import  AuthContext  from '../../contexts/AuthContext';
import './facultyComponents.css';
import { FaTrash, FaDownload } from 'react-icons/fa';
import Swal from 'sweetalert2';

const Research = () => {
    const { user, ensureToken } = useContext(AuthContext);
    const [researchPapers, setResearchPapers] = useState([]);
    const [newPaper, setNewPaper] = useState({
        title: '',
        authors: '',
        researchType: '',
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

    const allowedResearchFileExtensions = ['.pdf', '.doc', '.docx'];
    const allowedResearchFileMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const doiUrlPattern = /^https:\/\/doi\.org\/10\.\d{4,9}\/[\w.()\-;/:]+$/i;

    const validateResearchForm = (paper) => {
        const errors = [];
        const normalizedTitle = (paper.title || '').trim();
        const authorEntries = (paper.authors || '')
            .split(',')
            .map(author => author.trim())
            .filter(Boolean);
        const normalizedAbstract = (paper.abstract || '').trim();
        const normalizedDoi = (paper.doi || '').trim();

        if (!normalizedTitle) {
            errors.push('Title is required.');
        } else {
            const titleHasValidChars = /^[A-Za-z0-9][A-Za-z0-9 .,:'"()\-\/&]*$/.test(normalizedTitle);
            if (!titleHasValidChars) {
                errors.push('Title contains invalid characters.');
            }
        }

        if (authorEntries.length === 0) {
            errors.push('Author is required.');
        } else {
            const invalidAuthor = authorEntries.find(author => !/^[A-Za-z][A-Za-z .\-']*$/.test(author));
            if (invalidAuthor) {
                errors.push('Author name must contain letters only.');
            }
        }

        if (!paper.researchType) {
            errors.push('Research type is required.');
        }

        if (!(paper.journal || '').trim()) {
            errors.push('Journal/Conference is required.');
        }

        if (!normalizedAbstract) {
            errors.push('Abstract field is required.');
        }

        if (normalizedDoi && !doiUrlPattern.test(normalizedDoi)) {
            errors.push('DOI must be a valid DOI link (e.g., https://doi.org/10.1080/10509585.2015.1092083).');
        }

        if (paper.publicationDate) {
            const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(paper.publicationDate);
            const year = Number.parseInt((paper.publicationDate || '').slice(0, 4), 10);
            if (!isIsoDate || Number.isNaN(year)) {
                errors.push('Year must be a valid number.');
            }
        }

        if (paper.file) {
            const fileName = paper.file.name || '';
            const fileExtension = fileName.includes('.')
                ? `.${fileName.split('.').pop().toLowerCase()}`
                : '';
            const mimeType = paper.file.type || '';

            const isAllowedExtension = allowedResearchFileExtensions.includes(fileExtension);
            const isAllowedMime = !mimeType || allowedResearchFileMimeTypes.includes(mimeType);

            if (!isAllowedExtension || !isAllowedMime) {
                errors.push('Only PDF, DOC, and DOCX files are allowed.');
            }
        }

        return errors;
    };

    const getResponseErrorMessage = async (response) => {
        try {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const data = await response.json();
                if (Array.isArray(data.errors) && data.errors.length > 0) {
                    return data.errors.join('\n');
                }
                return data.message || data.error || `HTTP error! status: ${response.status}`;
            }

            const text = await response.text();
            return text || `HTTP error! status: ${response.status}`;
        } catch (parseError) {
            return `HTTP error! status: ${response.status}`;
        }
    };

    const loadResearchPapers = async () => {
        try {
            const token = ensureToken();
            if (!token) {
                console.error('No token available');
                return;
            }
            
            const response = await fetch('http://localhost:5000/api/research', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errorMessage = await getResponseErrorMessage(response);
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            const items = Array.isArray(data)
                ? data
                : (data.researchPapers || data.research || data.researches || []);
            setResearchPapers(items);
        } catch (error) {
            console.error('Error loading research papers:', error);
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
                    text: `Error loading research papers: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    };

    const addResearchPaper = async () => {
        const normalizedTitle = (newPaper.title || '').trim();
        const normalizedAuthors = (newPaper.authors || '')
            .split(',')
            .map(author => author.trim())
            .filter(Boolean)
            .join(', ');
        const normalizedDoi = (newPaper.doi || '').trim();

        const validationErrors = validateResearchForm(newPaper);
        if (validationErrors.length > 0) {
            Swal.fire({
                title: 'Validation Error!',
                html: `<ul style="text-align:left;margin:0;padding-left:1.2rem;">${validationErrors.map(err => `<li>${err}</li>`).join('')}</ul>`,
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
            formData.append('authors', normalizedAuthors);

            if (newPaper.journal?.trim()) {
                formData.append('journal', newPaper.journal.trim());
            }

            formData.append('researchType', newPaper.researchType);

            if (/^\d{4}-\d{2}-\d{2}$/.test(newPaper.publicationDate)) {
                formData.append('publicationDate', newPaper.publicationDate);
            }

            if (normalizedDoi) {
                formData.append('doi', normalizedDoi);
            }

            formData.append('abstract', newPaper.abstract.trim());

            if (['draft', 'submitted', 'published', 'in-progress'].includes(newPaper.status)) {
                formData.append('status', newPaper.status);
            }

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
            
            if (!response.ok) {
                const errorMessage = await getResponseErrorMessage(response);
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            const added = result.researchPaper || result.research || result;
            setResearchPapers(prev => [...prev, added]);
            setNewPaper({
                title: '', authors: '', researchType: '', journal: '', publicationDate: '', 
                doi: '', abstract: '', status: 'published', file: null
            });
            document.getElementById('research-file').value = '';
            Swal.fire({
                title: 'Success!',
                text: 'Research paper added successfully!',
                icon: 'success',
                confirmButtonColor: '#3498db',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error adding research paper:', error);
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
                    text: `Error adding research paper: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    };
    const deleteResearchPaper = async (id) => {
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
                const response = await fetch(`http://localhost:5000/api/research/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                setResearchPapers(researchPapers.filter(paper => paper._id !== id));
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Research paper has been removed.',
                    icon: 'success',
                    confirmButtonColor: '#3498db',
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error('Error deleting research paper:', error);
                Swal.fire({
                    title: 'Error!',
                    text: `Error deleting research paper: ${error.message}`,
                    icon: 'error',
                    confirmButtonColor: '#e74c3c'
                });
            }
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
                        <label htmlFor="research-title">Paper Title *</label>
                        <input
                            id="research-title"
                            name="title"
                            type="text"
                            value={newPaper.title}
                            onChange={(e) => setNewPaper({...newPaper, title: e.target.value})}
                            placeholder="Enter paper title"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="research-authors">Authors *</label>
                        <input
                            id="research-authors"
                            name="authors"
                            type="text"
                            value={newPaper.authors}
                            onChange={(e) => setNewPaper({...newPaper, authors: e.target.value})}
                            placeholder="Enter authors (comma separated)"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="research-type">Research Type *</label>
                        <select
                            id="research-type"
                            name="researchType"
                            value={newPaper.researchType}
                            onChange={(e) => setNewPaper({...newPaper, researchType: e.target.value})}
                        >
                            <option value="">Select type</option>
                            <option value="journal-article">Journal Article</option>
                            <option value="conference-paper">Conference Paper</option>
                            <option value="book-chapter">Book Chapter</option>
                            <option value="review-paper">Review Paper</option>
                            <option value="patent">Patent</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="research-journal">Journal/Conference</label>
                        <input
                            id="research-journal"
                            name="journal"
                            type="text"
                            value={newPaper.journal}
                            onChange={(e) => setNewPaper({...newPaper, journal: e.target.value})}
                            placeholder="Enter journal or conference name"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="research-publication-date">Publication Date</label>
                        <input
                            id="research-publication-date"
                            name="publicationDate"
                            type="date"
                            value={newPaper.publicationDate}
                            onChange={(e) => setNewPaper({...newPaper, publicationDate: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="research-doi">DOI</label>
                        <input
                            id="research-doi"
                            name="doi"
                            type="text"
                            value={newPaper.doi}
                            onChange={(e) => setNewPaper({...newPaper, doi: e.target.value})}
                            placeholder="Enter DOI"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="research-status">Status</label>
                        <select 
                            id="research-status"
                            name="status"
                            value={newPaper.status}
                            onChange={(e) => setNewPaper({...newPaper, status: e.target.value})}
                        >
                            <option value="published">Published</option>
                            <option value="submitted">Submitted</option>
                            <option value="in-progress">In Progress</option>
                        </select>
                    </div>
                    <div className="form-group full-width">
                        <label htmlFor="research-abstract">Abstract *</label>
                        <textarea
                            id="research-abstract"
                            name="abstract"
                            rows="4"
                            value={newPaper.abstract}
                            onChange={(e) => setNewPaper({...newPaper, abstract: e.target.value})}
                            placeholder="Enter paper abstract"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="research-file">Upload Paper</label>
                        <input
                            id="research-file"
                            name="researchFile"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                                const file = e.target.files[0] || null;
                                if (!file) {
                                    setNewPaper({ ...newPaper, file: null });
                                    return;
                                }

                                const fileName = file.name || '';
                                const fileExtension = fileName.includes('.')
                                    ? `.${fileName.split('.').pop().toLowerCase()}`
                                    : '';
                                const mimeType = file.type || '';

                                const isAllowedExtension = allowedResearchFileExtensions.includes(fileExtension);
                                const isAllowedMime = !mimeType || allowedResearchFileMimeTypes.includes(mimeType);

                                if (!isAllowedExtension || !isAllowedMime) {
                                    Swal.fire({
                                        title: 'Invalid File Type!',
                                        text: 'Only PDF, DOC, and DOCX files are allowed.',
                                        icon: 'warning',
                                        confirmButtonColor: '#e74c3c'
                                    });
                                    e.target.value = '';
                                    setNewPaper({ ...newPaper, file: null });
                                    return;
                                }

                                setNewPaper({ ...newPaper, file });
                            }}
                        />
                    </div>
                </div>

                <button className="save-button" onClick={addResearchPaper}>
                    Add Research Paper
                </button>

                <div className="items-list" style={{marginTop: '2rem'}}>
                    <h3>Your Research Papers</h3>
                    {researchPapers.map(paper => (
                        <div key={paper._id} className="item-card" style={{ padding: '1rem', marginBottom: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                            <div className="item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4>{paper.title}</h4>
                                <span className={`status-badge ${paper.status}`}>
                                    {paper.status}
                                </span>
                            </div>
                            <p><strong>Authors:</strong> {paper.authors}</p>
                            {paper.researchType && <p><strong>Type:</strong> {paper.researchType}</p>}
                            <p><strong>Journal:</strong> {paper.journal}</p>
                            <p><strong>Published:</strong> {paper.publicationDate}</p>
                            {paper.doi && <p><strong>DOI:</strong> {paper.doi}</p>}
                            {paper.abstract && (
                                <p><strong>Abstract:</strong> {paper.abstract.substring(0, 200)}...</p>
                            )}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                {paper.fileUrl && (
                                    <a href={`http://localhost:5000/${paper.fileUrl}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', color: '#3498db', textDecoration: 'none' }}>
                                        <FaDownload style={{ marginRight: '0.5rem' }} /> Download Paper
                                    </a>
                                )}
                                <button onClick={() => deleteResearchPaper(paper._id)} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                                    <FaTrash style={{ marginRight: '0.5rem' }} /> Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Research;