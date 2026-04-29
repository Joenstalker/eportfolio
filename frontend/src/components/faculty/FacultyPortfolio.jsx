import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import { FaSave, FaDownload, FaUpload, FaCheckCircle, FaTimesCircle, FaFile, FaTimes, FaSearch, FaExclamationTriangle } from 'react-icons/fa';
import './facultyComponents.css';
import { getPortfolio, savePortfolio } from '../../services/facultyPortfolioService';

const FacultyPortfolio = () => {
    const { user, ensureToken } = useContext(AuthContext);
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [searchSubjectCode, setSearchSubjectCode] = useState('');
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [activeTab, setActiveTab] = useState('Class');

    const [portfolioData, setPortfolioData] = useState({
        // Restructure to store portfolio data by subject code
        subjects: {
            default: {
                subjectCode: '',
                sectionCode: '',
                facultyPortfolio: {
                    'A.1.0': { uploaded: false, fileName: '' },
                    'B.1.0': { uploaded: false, fileName: '' },
                    'C.1.0': { uploaded: false, fileName: '' },
                    'D.1.0': { uploaded: false, fileName: '' },
                    'E.1.0': { uploaded: false, fileName: '' },
                    'F.1.0': { uploaded: false, fileName: '' },
                    'G.1.0': { uploaded: false, fileName: '' },
                    'H.1.0': { uploaded: false, fileName: '' },
                    'I.1.0': { uploaded: false, fileName: '' },
                    'J.1.0': { uploaded: false, fileName: '' },
                    'L.1.0': { uploaded: false, fileName: '' }
                },
                classPortfolio: {
                    'A.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                    'B.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                    'C.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                    'D.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                    'E.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                    'F.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                    'G.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                    'H.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                    'I.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                    'J.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                    'K.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                    'L.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                    'M.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                    'N.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                    'O.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                    'P.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                },
                L1: {
                    instruction: {},
                    sampleOutput: {},
                    answerKey: {},
                    returnOutputReceipt: { uploaded: false, fileName: '' }
                },
                M1: {
                    rawScore: {},
                    gradeSheetSigned: {},
                    officialGradeSheet: {},
                    googleClassroomScore: {}
                },
                N1: {
                    consultationForms: {},
                    consultationScreenshots: {},
                    evidenceAddressing: {},
                    O1: { uploaded: false, fileName: '' },
                    P1: { uploaded: false, fileName: '' },
                    Q1: { uploaded: false, fileName: '' },
                    R1: { uploaded: false, fileName: '' }
                },
                ClassPortfolio: {}
            }
        }
    });

    const [loading, setLoading] = useState(false);
    const [savedStatus, setSavedStatus] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFileType, setSelectedFileType] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [reviewStatus, setReviewStatus] = useState('not_submitted');
    const [reviewMessage, setReviewMessage] = useState('');
    const [missingDocs, setMissingDocs] = useState([]);
    const [submittedForReview, setSubmittedForReview] = useState(false);

    // Load portfolio data from backend
    useEffect(() => {
        const loadPortfolioFromBackend = async () => {
            if (user?.id) {
                try {
                    const token = await ensureToken();
                    const data = await getPortfolio(user.id, token);
                    if (data) {
                        setPortfolioData(data);
                        setReviewStatus(data.adminReviewStatus || 'not_submitted');
                        setReviewMessage(data.adminReviewMessage || '');
                        setMissingDocs(data.missingDocuments || []);
                        setSubmittedForReview(data.submittedForReview || false);
                    }
                } catch (error) {
                    console.error('Error loading portfolio:', error);
                }
            }
        };
        loadPortfolioFromBackend();
    }, [user?.id, ensureToken]);

    // File type options based on portfolio structure
    const facultyFileTypes = [
        { id: 'A.1.0', name: 'Faculty Profile', description: 'Personal faculty information and CV' },
        { id: 'B.1.0', name: 'Educational Attainment', description: 'Academic degrees and certificates' },
        { id: 'C.1.0', name: 'Service Records', description: 'Employment and service history' },
        { id: 'D.1.0', name: 'Seminars & Workshops', description: 'Professional development activities' },
        { id: 'E.1.0', name: 'Grants & Awards', description: 'Research grants and recognition' },
        { id: 'F.1.0', name: 'Research Proposals', description: 'Research project proposals' },
        { id: 'G.1.0', name: 'Extension Involvement', description: 'Community extension services' },
        { id: 'H.1.0', name: 'Production', description: 'Published works and productions' },
        { id: 'I.1.0', name: 'Membership', description: 'Professional organization memberships' },
        { id: 'J.1.0', name: 'Licensure Examinations', description: 'Professional license examinations' },
        { id: 'L.1.0', name: 'IPCR', description: 'Individual Performance Commitment Review' }
    ];

    const classFileTypes = [
        { id: 'A.1.0', name: 'Instructional Load Report', description: 'Teaching load assignment' },
        { id: 'B.1.0', name: 'Official Class List', description: 'Student enrollment records' },
        { id: 'C.1.0', name: 'Syllabus', description: 'Course syllabus documents' },
        { id: 'D.1.0', name: 'Instructional Materials', description: 'Teaching materials and resources' },
        { id: 'E.1.0', name: 'Classroom Policies', description: 'Class rules and policies' },
        { id: 'F.1.0', name: 'Syllabus Acknowledgement', description: 'Student syllabus receipts' },
        { id: 'G.1.0', name: 'Seat Plan', description: 'Classroom seating arrangement' },
        { id: 'H.1.0', name: 'Classroom Officers', description: 'Student officer assignments' },
        { id: 'I.1.0', name: 'Attendance Records', description: 'Student attendance sheets' },
        { id: 'J.1.0', name: 'Preliminary Test', description: 'Preliminary examination papers' },
        { id: 'K.1.0', name: 'Signed TOS', description: 'Table of specifications' },
        { id: 'L.1.0', name: 'Test Questionnaire', description: 'Examination questions' },
        { id: 'M.1.0', name: 'Instruction of Activities', description: 'Activity instruction sheets' },
        { id: 'N.1.0', name: 'Sample Checked Output', description: 'Sample student works' },
        { id: 'O.1.0', name: 'Answer Key', description: 'Test answer keys' },
        { id: 'P.1.0', name: 'Return Output Receipt', description: 'Student output receipts' }
    ];

    useEffect(() => {
        loadPortfolioData();
    }, []);

    // Search and modal handlers
    const handleSearchSubject = () => {
        if (!searchSubjectCode.trim()) {
            Swal.fire({
                title: 'Error',
                text: 'Please enter a subject code',
                icon: 'warning'
            });
            return;
        }

        // Check if subject exists, if not create it
        const subjectKey = searchSubjectCode.toUpperCase();
        if (!portfolioData.subjects[subjectKey]) {
            setPortfolioData(prev => ({
                ...prev,
                subjects: {
                    ...prev.subjects,
                    [subjectKey]: {
                        subjectCode: subjectKey,
                        sectionCode: '',
                        facultyPortfolio: {
                            'A.1.0': { uploaded: false, fileName: '' },
                            'B.1.0': { uploaded: false, fileName: '' },
                            'C.1.0': { uploaded: false, fileName: '' },
                            'D.1.0': { uploaded: false, fileName: '' },
                            'E.1.0': { uploaded: false, fileName: '' },
                            'F.1.0': { uploaded: false, fileName: '' },
                            'G.1.0': { uploaded: false, fileName: '' },
                            'H.1.0': { uploaded: false, fileName: '' },
                            'I.1.0': { uploaded: false, fileName: '' },
                            'J.1.0': { uploaded: false, fileName: '' },
                            'L.1.0': { uploaded: false, fileName: '' }
                        },
                        classPortfolio: {
                            'A.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                            'B.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                            'C.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                            'D.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                            'E.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                            'F.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                            'G.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                            'H.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                            'I.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                            'J.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                            'K.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                            'L.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                            'M.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                            'N.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                            'O.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                            'P.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                        }
                    }
                }
            }));
        }

        setSelectedSubject(portfolioData.subjects[subjectKey] || {
            subjectCode: subjectKey,
            sectionCode: '',
            facultyPortfolio: {
                'A.1.0': { uploaded: false, fileName: '' },
                'B.1.0': { uploaded: false, fileName: '' },
                'C.1.0': { uploaded: false, fileName: '' },
                'D.1.0': { uploaded: false, fileName: '' },
                'E.1.0': { uploaded: false, fileName: '' },
                'F.1.0': { uploaded: false, fileName: '' },
                'G.1.0': { uploaded: false, fileName: '' },
                'H.1.0': { uploaded: false, fileName: '' },
                'I.1.0': { uploaded: false, fileName: '' },
                'J.1.0': { uploaded: false, fileName: '' },
                'L.1.0': { uploaded: false, fileName: '' }
            },
            classPortfolio: {
                'A.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                'B.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                'C.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                'D.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                'E.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                'F.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                'G.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                'H.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                'I.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                'J.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                'K.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                'L.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                'M.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                'N.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                'O.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
                'P.1.0': Array(8).fill(null).map(() => ({ uploaded: false, fileName: '' })),
            }
        });
        setShowSubjectModal(true);
        setSearchSubjectCode('');
    };

    const handleSubjectFileUpload = (subjectKey, itemId, file) => {
        setPortfolioData(prev => ({
            ...prev,
            subjects: {
                ...prev.subjects,
                [subjectKey]: {
                    ...prev.subjects[subjectKey],
                    facultyPortfolio: {
                        ...prev.subjects[subjectKey].facultyPortfolio,
                        [itemId]: { uploaded: true, fileName: file.name }
                    }
                }
            }
        }));
    };

    const handleSubjectFileRemove = (subjectKey, itemId) => {
        setPortfolioData(prev => ({
            ...prev,
            subjects: {
                ...prev.subjects,
                [subjectKey]: {
                    ...prev.subjects[subjectKey],
                    facultyPortfolio: {
                        ...prev.subjects[subjectKey].facultyPortfolio,
                        [itemId]: { uploaded: false, fileName: '' }
                    }
                }
            }
        }));
    };

    // File upload functions
    const openUploadModal = () => {
        setShowUploadModal(true);
        setSelectedFileType('');
        setSelectedFile(null);
        setUploadProgress(0);
    };

    const closeUploadModal = () => {
        setShowUploadModal(false);
        setSelectedFileType('');
        setSelectedFile(null);
        setUploadProgress(0);
    };

    const handleFileSelect = (fileType) => {
        setSelectedFileType(fileType);
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const uploadFile = async () => {
        if (!selectedFileType || !selectedFile) {
            Swal.fire({
                title: 'Missing Information!',
                text: 'Please select a file type and choose a file to upload.',
                icon: 'warning',
                confirmButtonColor: '#e74c3c'
            });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

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
            formData.append('file', selectedFile);
            formData.append('fileType', selectedFileType);
            formData.append('category', selectedFileType.startsWith('class') ? 'class' : 'faculty');

            const xhr = new XMLHttpRequest();

            // Upload progress tracking
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percentComplete);
                }
            });

            xhr.onload = function() {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    
                    // Update portfolio data to mark the uploaded item as complete
                    if (selectedFileType.startsWith('class')) {
                        // Handle class portfolio item
                        const [itemCode, index] = selectedFileType.split('-');
                        setPortfolioData(prev => ({
                            ...prev,
                            subjects: {
                                ...prev.subjects,
                                default: {
                                    ...prev.subjects.default,
                                    classPortfolio: {
                                        ...prev.subjects.default.classPortfolio,
                                        [itemCode]: prev.subjects.default.classPortfolio[itemCode].map((val, idx) =>
                                            idx === parseInt(index) ? { uploaded: true, fileName: selectedFile?.name || '' } : val
                                        )
                                    }
                                }
                            }
                        }));
                    } else {
                        // Handle faculty portfolio item
                        setPortfolioData(prev => ({
                            ...prev,
                            subjects: {
                                ...prev.subjects,
                                default: {
                                    ...prev.subjects.default,
                                    facultyPortfolio: {
                                        ...prev.subjects.default.facultyPortfolio,
                                        [selectedFileType]: { uploaded: true, fileName: selectedFile?.name || '' }
                                    }
                                }
                            }
                        }));
                    }

                    Swal.fire({
                        title: 'Upload Successful!',
                        text: 'File uploaded successfully and portfolio updated.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });

                    closeUploadModal();
                } else {
                    throw new Error('Upload failed');
                }
            };

            xhr.onerror = function() {
                throw new Error('Upload failed');
            };

            xhr.open('POST', 'http://localhost:5000/api/faculty/upload');
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(formData);

        } catch (error) {
            console.error('Error uploading file:', error);
            Swal.fire({
                title: 'Upload Error!',
                text: 'Failed to upload file. Please try again.',
                icon: 'error',
                confirmButtonColor: '#e74c3c'
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleClassInfoChange = (field, value) => {
        setPortfolioData(prev => ({
            ...prev,
            subjects: {
                ...prev.subjects,
                default: {
                    ...prev.subjects.default,
                    [field]: value
                }
            }
        }));
    };

    const loadPortfolioData = async () => {
        try {
            const token = ensureToken();
            if (!token) return;

            const response = await fetch('http://localhost:5000/api/faculty/portfolio', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data) {
                    setPortfolioData(data);
                }
            }
        } catch (error) {
            console.error('Error loading portfolio data:', error);
        }
    };

    const savePortfolioData = async () => {
        setLoading(true);
        try {
            const token = await ensureToken();
            if (!token) {
                Swal.fire({
                    title: 'Authentication Required!',
                    text: 'Please log in again.',
                    icon: 'warning',
                    confirmButtonColor: '#e74c3c'
                });
                return;
            }

            const result = await savePortfolio(user.id, portfolioData, token);

            setSavedStatus('success');
            Swal.fire({
                title: 'Success!',
                text: 'Portfolio saved successfully!',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            setTimeout(() => setSavedStatus(null), 3000);
        } catch (error) {
            console.error('Error saving portfolio:', error);
            setSavedStatus('error');
            Swal.fire({
                title: 'Error!',
                text: 'Failed to save portfolio. Please try again.',
                icon: 'error',
                confirmButtonColor: '#e74c3c'
            });
            setTimeout(() => setSavedStatus(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleFacultyPortfolioToggle = (item) => {
        setPortfolioData(prev => ({
            ...prev,
            subjects: {
                ...prev.subjects,
                default: {
                    ...prev.subjects.default,
                    facultyPortfolio: {
                        ...prev.subjects.default.facultyPortfolio,
                        [item]: !prev.subjects.default.facultyPortfolio[item]
                    }
                }
            }
        }));
    };

    const handleClassPortfolioToggle = (item, index) => {
        setPortfolioData(prev => ({
            ...prev,
            subjects: {
                ...prev.subjects,
                default: {
                    ...prev.subjects.default,
                    classPortfolio: {
                        ...prev.subjects.default.classPortfolio,
                        items: {
                            ...prev.subjects.default.classPortfolio.items,
                            [item]: prev.subjects.default.classPortfolio.items[item].map((checked, i) =>
                                i === index ? !checked : checked
                            )
                        }
                    }
                }
            }
        }));
    };

    const handleFacultyFileUpload = (item, file) => {
        setPortfolioData(prev => ({
            ...prev,
            subjects: {
                ...prev.subjects,
                default: {
                    ...prev.subjects.default,
                    facultyPortfolio: {
                        ...prev.subjects.default.facultyPortfolio,
                        [item]: { uploaded: true, fileName: file.name }
                    }
                }
            }
        }));
    };

    const handleFacultyFileRemove = (item) => {
        setPortfolioData(prev => ({
            ...prev,
            subjects: {
                ...prev.subjects,
                default: {
                    ...prev.subjects.default,
                    facultyPortfolio: {
                        ...prev.subjects.default.facultyPortfolio,
                        [item]: { uploaded: false, fileName: '' }
                    }
                }
            }
        }));
    };

    const handleClassFileUpload = (item, index, file) => {
        setPortfolioData(prev => ({
            ...prev,
            subjects: {
                ...prev.subjects,
                default: {
                    ...prev.subjects.default,
                    classPortfolio: {
                        ...prev.subjects.default.classPortfolio,
                        items: {
                            ...prev.subjects.default.classPortfolio.items,
                            [item]: prev.subjects.default.classPortfolio.items[item].map((data, i) =>
                                i === index ? { uploaded: true, fileName: file.name } : data
                            )
                        }
                    }
                }
            }
        }));
    };

    const handleClassFileRemove = (item, index) => {
        setPortfolioData(prev => ({
            ...prev,
            subjects: {
                ...prev.subjects,
                default: {
                    ...prev.subjects.default,
                    classPortfolio: {
                        ...prev.subjects.default.classPortfolio,
                        items: {
                            ...prev.subjects.default.classPortfolio.items,
                            [item]: prev.subjects.default.classPortfolio.items[item].map((data, i) =>
                                i === index ? { uploaded: false, fileName: '' } : data
                            )
                        }
                    }
                }
            }
        }));
    };

    const calculateProgress = () => {
        const facultyItems = Object.values(portfolioData.subjects.default.facultyPortfolio);
        const facultyCompleted = facultyItems.filter(item => item.uploaded).length;
        const facultyTotal = facultyItems.length;

        const classItems = Object.values(portfolioData.subjects.default.classPortfolio);
        const classCompleted = classItems.reduce((total, itemArray) =>
            total + itemArray.filter(item => item.uploaded).length, 0
        );
        const classTotal = classItems.reduce((total, itemArray) => total + itemArray.length, 0);

        const totalCompleted = facultyCompleted + classCompleted;
        const totalItems = facultyTotal + classTotal;

        return totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
    };

    const exportPortfolio = async () => {
        try {
            const token = ensureToken();
            const response = await fetch('http://localhost:5000/api/faculty/portfolio/export', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(portfolioData)
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `faculty-portfolio-${portfolioData.facultyInfo.facultyName || 'export'}-${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                Swal.fire({
                    title: 'Success!',
                    text: 'Portfolio exported successfully!',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error exporting portfolio:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to export portfolio',
                icon: 'error',
                confirmButtonColor: '#e74c3c'
            });
        }
    };

    const progressPercentage = calculateProgress();

    return (
        <div className="faculty-section">
            <div className="section-header">
                <h2>Faculty Portfolio</h2>
                <p>Complete your faculty portfolio checklist for comprehensive evaluation</p>
                <div className="progress-bar">
                    <div className="progress-info">
                        <span>Progress: {progressPercentage}%</span>
                        <span className={`status-indicator ${savedStatus}`}>
                            {savedStatus === 'success' && <FaCheckCircle />}
                            {savedStatus === 'error' && <FaTimesCircle />}
                        </span>
                    </div>
                    <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                </div>

                {/* Review Status Banner */}
                {reviewStatus === 'approved' && (
                    <div className="review-banner approved">
                        <FaCheckCircle /> <strong>Portfolio Approved</strong> — Your portfolio has been reviewed and approved by the administrator.
                    </div>
                )}
                {reviewStatus === 'rejected' && (
                    <div className="review-banner rejected">
                        <FaTimesCircle /> <strong>Action Required</strong> — {reviewMessage || 'Your portfolio was rejected. Please check the missing documents below and resubmit.'}
                        {missingDocs.length > 0 && (
                            <ul className="missing-docs-list">
                                {missingDocs.map((doc, i) => <li key={i}>{doc}</li>)}
                            </ul>
                        )}
                    </div>
                )}
                {reviewStatus === 'pending' && (
                    <div className="review-banner pending">
                        <FaExclamationTriangle /> <strong>Under Review</strong> — Your portfolio has been submitted and is currently being reviewed by the administrator.
                    </div>
                )}
                {!submittedForReview && (
                    <div className="review-banner not-submitted">
                        <FaExclamationTriangle /> <strong>Not Submitted</strong> — Complete your portfolio and submit it for admin review when ready.
                    </div>
                )}

                {/* Submit for Review Button */}
                <div className="review-actions">
                    {!submittedForReview ? (
                        <button
                            className="btn-submit-review"
                            onClick={async () => {
                                if (progressPercentage < 30) {
                                    Swal.fire({ icon: 'warning', title: 'Portfolio Incomplete', text: 'Your portfolio progress is low. Please upload more documents before submitting.', confirmButtonColor: '#f59e0b' });
                                    return;
                                }
                                const result = await Swal.fire({
                                    icon: 'question',
                                    title: 'Submit Portfolio?',
                                    text: 'Once submitted, your portfolio will be sent to the administrator for review. You will not be able to make changes until it is reviewed.',
                                    showCancelButton: true,
                                    confirmButtonText: 'Yes, Submit',
                                    cancelButtonText: 'Cancel',
                                    confirmButtonColor: '#667eea'
                                });
                                if (!result.isConfirmed) return;
                                try {
                                    const token = await ensureToken();
                                    const res = await fetch(`/api/faculty-portfolio/${user.id}/submit`, {
                                        method: 'POST',
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    if (res.ok) {
                                        const data = await res.json();
                                        setSubmittedForReview(true);
                                        setReviewStatus('pending');
                                        setReviewMessage('');
                                        setMissingDocs([]);
                                        Swal.fire({ icon: 'success', title: 'Submitted!', text: 'Your portfolio has been submitted for review.', timer: 2000, showConfirmButton: false });
                                    } else {
                                        throw new Error('Failed to submit');
                                    }
                                } catch (err) {
                                    Swal.fire({ icon: 'error', title: 'Error', text: err.message });
                                }
                            }}
                        >
                            <FaCheckCircle /> Submit for Review
                        </button>
                    ) : reviewStatus === 'rejected' ? (
                        <button
                            className="btn-submit-review"
                            onClick={async () => {
                                const result = await Swal.fire({
                                    icon: 'question',
                                    title: 'Resubmit Portfolio?',
                                    text: 'Have you uploaded all the missing documents? Resubmitting will send your portfolio back for review.',
                                    showCancelButton: true,
                                    confirmButtonText: 'Yes, Resubmit',
                                    cancelButtonText: 'Cancel',
                                    confirmButtonColor: '#667eea'
                                });
                                if (!result.isConfirmed) return;
                                try {
                                    const token = await ensureToken();
                                    const res = await fetch(`/api/faculty-portfolio/${user.id}/submit`, {
                                        method: 'POST',
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    if (res.ok) {
                                        setReviewStatus('pending');
                                        setReviewMessage('');
                                        setMissingDocs([]);
                                        Swal.fire({ icon: 'success', title: 'Resubmitted!', text: 'Your portfolio has been resubmitted for review.', timer: 2000, showConfirmButton: false });
                                    } else {
                                        throw new Error('Failed to resubmit');
                                    }
                                } catch (err) {
                                    Swal.fire({ icon: 'error', title: 'Error', text: err.message });
                                }
                            }}
                        >
                            <FaCheckCircle /> Resubmit for Review
                        </button>
                    ) : (
                        <span className="review-locked">Portfolio submitted — awaiting administrator review.</span>
                    )}
                </div>
            </div>

            <div className="content-card">
                {/* Search Bar */}
                <div className="search-section">
                    <h3>Search Subject Portfolio</h3>
                    <div className="search-bar">
                        <input
                            type="text"
                            value={searchSubjectCode}
                            onChange={(e) => setSearchSubjectCode(e.target.value)}
                            placeholder="Enter subject code (e.g., CS101)"
                            onKeyPress={(e) => e.key === 'Enter' && handleSearchSubject()}
                        />
                        <button onClick={handleSearchSubject} className="search-button">
                            <FaSearch /> Search
                        </button>
                    </div>
                </div>

                {/* Faculty Information */}
                <div className="faculty-info-section">
                    <h3>Faculty Information</h3>
                    <div className="info-grid">
                        <div className="form-group">
                            <label>Faculty Name:</label>
                            <input
                                type="text"
                                value={user?.name || ''}
                                readOnly
                                className="readonly-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Department:</label>
                            <input
                                type="text"
                                value={user?.department || ''}
                                readOnly
                                className="readonly-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Email:</label>
                            <input
                                type="text"
                                value={user?.email || ''}
                                readOnly
                                className="readonly-input"
                            />
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="tab-navigation portfolio-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'Class' ? 'active' : ''}`}
                        onClick={() => setActiveTab('Class')}
                    >
                        Class Portfolio
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'L' ? 'active' : ''}`}
                        onClick={() => setActiveTab('L')}
                    >
                        L 1.0 - Sample Checked Activities
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'M' ? 'active' : ''}`}
                        onClick={() => setActiveTab('M')}
                    >
                        M 1.0 - Class Records & Grades
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'N' ? 'active' : ''}`}
                        onClick={() => setActiveTab('N')}
                    >
                        N 1.0 - Student Consultation & Others
                    </button>
                </div>

                {/* Faculty Portfolio Checklist */}
                <div className="portfolio-section">
                    <h3>Faculty Portfolio</h3>
                    <table className="portfolio-table faculty-portfolio-table">
                        <thead>
                            <tr>
                                <th>Item Code</th>
                                <th>Document Name</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>File</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facultyFileTypes.map((fileType) => (
                                <tr key={fileType.id}>
                                    <td className="item-code">{fileType.id}</td>
                                    <td className="item-name">{fileType.name}</td>
                                    <td className="item-description">{fileType.description}</td>
                                    <td className="item-status">
                                        {portfolioData.subjects.default.facultyPortfolio[fileType.id].uploaded ? (
                                            <span className="status-badge uploaded">
                                                <FaCheckCircle /> Uploaded
                                            </span>
                                        ) : (
                                            <span className="status-badge pending">
                                                <FaTimesCircle /> Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="item-file">
                                        {portfolioData.subjects.default.facultyPortfolio[fileType.id].uploaded ? (
                                            <div className="uploaded-file">
                                                <FaFile />
                                                <span>{portfolioData.subjects.default.facultyPortfolio[fileType.id].fileName}</span>
                                            </div>
                                        ) : (
                                            <span className="no-file">No file uploaded</span>
                                        )}
                                    </td>
                                    <td className="item-actions">
                                        {portfolioData.subjects.default.facultyPortfolio[fileType.id].uploaded ? (
                                            <button
                                                className="action-btn remove-btn"
                                                onClick={() => handleFacultyFileRemove(fileType.id)}
                                                title="Remove file"
                                            >
                                                <FaTimes /> Remove
                                            </button>
                                        ) : (
                                            <label className="action-btn upload-btn">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) handleFacultyFileUpload(fileType.id, file);
                                                    }}
                                                    hidden
                                                />
                                                <FaUpload /> Upload
                                            </label>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Tab Content */}
                <div className="portfolio-section">
                    <div className="class-info-grid">
                        <div className="form-group">
                            <label>Subject Code:</label>
                            <input
                                type="text"
                                value={portfolioData.subjects.default.subjectCode}
                                onChange={(e) => setPortfolioData(prev => ({
                                    ...prev,
                                    subjects: {
                                        ...prev.subjects,
                                        default: {
                                            ...prev.subjects.default,
                                            subjectCode: e.target.value
                                        }
                                    }
                                }))}
                                placeholder="Enter subject code"
                            />
                        </div>
                        <div className="form-group">
                            <label>Section Code:</label>
                            <input
                                type="text"
                                value={portfolioData.subjects.default.sectionCode}
                                onChange={(e) => setPortfolioData(prev => ({
                                    ...prev,
                                    subjects: {
                                        ...prev.subjects,
                                        default: {
                                            ...prev.subjects.default,
                                            sectionCode: e.target.value
                                        }
                                    }
                                }))}
                                placeholder="Enter section code"
                            />
                        </div>
                    </div>

                    {activeTab === 'Class' && (
                        <div className="tab-content-section">
                            <h3>Class Portfolio</h3>
                            
                            <table className="portfolio-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((classNum) => (
                                            <th key={classNum}>Class {classNum}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const descriptions = {
                                            'A': 'Instructional Load Report',
                                            'B': 'Official Class list (SIAS and Google Classroom)',
                                            'C': 'Syllabus (with Form 17 and 18 include draft)',
                                            'D': 'Instructional Materials',
                                            'E': 'Classroom Policies Acknowledgement Receipt',
                                            'F': 'Syllabus Acknowledgement Receipt',
                                            'G': 'Seat Plan',
                                            'H': 'Classroom Officers (with Signatures)',
                                            'I': 'Attendance',
                                            'J': 'Preliminary Test - Test Checker and Item Analyzer'
                                        };
                                        return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map((letter) => (
                                            <tr key={letter}>
                                                <td className="item-name">{letter} 1.0<br/><small>{descriptions[letter]}</small></td>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map((classNum) => {
                                                    const fileData = portfolioData.subjects.default.ClassPortfolio?.[`${letter}1`]?.[classNum];
                                                    return (
                                                        <td key={classNum} className="upload-cell">
                                                            {fileData?.uploaded ? (
                                                                <div className="uploaded-file small">
                                                                    <FaFile />
                                                                    <span>{fileData.fileName}</span>
                                                                    <button
                                                                        className="remove-file-btn small"
                                                                        onClick={() => setPortfolioData(prev => ({
                                                                            ...prev,
                                                                            subjects: {
                                                                                ...prev.subjects,
                                                                                default: {
                                                                                    ...prev.subjects.default,
                                                                                    ClassPortfolio: {
                                                                                        ...(prev.subjects.default.ClassPortfolio || {}),
                                                                                        [`${letter}1`]: {
                                                                                            ...(prev.subjects.default.ClassPortfolio?.[`${letter}1`] || {}),
                                                                                            [classNum]: { uploaded: false, fileName: '' }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }))}
                                                                    >
                                                                        <FaTimes />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <label className="upload-area small">
                                                                    <input
                                                                        type="file"
                                                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                                        hidden
                                                                        onChange={(e) => {
                                                                            const file = e.target.files[0];
                                                                            if (file) {
                                                                                setPortfolioData(prev => ({
                                                                                    ...prev,
                                                                                    subjects: {
                                                                                        ...prev.subjects,
                                                                                        default: {
                                                                                            ...prev.subjects.default,
                                                                                            ClassPortfolio: {
                                                                                                ...(prev.subjects.default.ClassPortfolio || {}),
                                                                                                [`${letter}1`]: {
                                                                                                    ...(prev.subjects.default.ClassPortfolio?.[`${letter}1`] || {}),
                                                                                                    [classNum]: { uploaded: true, fileName: file.name }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }));
                                                                            }
                                                                        }}
                                                                    />
                                                                    <FaUpload />
                                                                    <span>Upload</span>
                                                                </label>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ));
                                    })()}
                                    {/* K 1.0 Signed TOS - with sub-uploads */}
                                    <tr>
                                        <td className="item-name" rowSpan={2}>K 1.0<br/><small>Signed TOS</small></td>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((classNum) => (
                                            <td key={classNum} className="upload-cell">
                                                <div className="sub-upload-label">Midterm</div>
                                                {portfolioData.subjects.default.ClassPortfolio?.K1?.[classNum]?.midtermFile?.uploaded ? (
                                                    <div className="uploaded-file small">
                                                        <FaFile />
                                                        <span>{portfolioData.subjects.default.ClassPortfolio?.K1?.[classNum]?.midtermFile?.fileName}</span>
                                                        <button
                                                            className="remove-file-btn small"
                                                            onClick={() => setPortfolioData(prev => ({
                                                                ...prev,
                                                                subjects: {
                                                                    ...prev.subjects,
                                                                    default: {
                                                                        ...prev.subjects.default,
                                                                        ClassPortfolio: {
                                                                            ...(prev.subjects.default.ClassPortfolio || {}),
                                                                            K1: {
                                                                                ...(prev.subjects.default.ClassPortfolio?.K1 || {}),
                                                                                [classNum]: {
                                                                                    ...(prev.subjects.default.ClassPortfolio?.K1?.[classNum] || {}),
                                                                                    midtermFile: { uploaded: false, fileName: '' }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }))}
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="upload-area small">
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                            hidden
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    setPortfolioData(prev => ({
                                                                        ...prev,
                                                                        subjects: {
                                                                            ...prev.subjects,
                                                                            default: {
                                                                                ...prev.subjects.default,
                                                                                ClassPortfolio: {
                                                                                    ...(prev.subjects.default.ClassPortfolio || {}),
                                                                                    K1: {
                                                                                        ...(prev.subjects.default.ClassPortfolio?.K1 || {}),
                                                                                        [classNum]: {
                                                                                            ...(prev.subjects.default.ClassPortfolio?.K1?.[classNum] || {}),
                                                                                            midtermFile: { uploaded: true, fileName: file.name }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }));
                                                                }
                                                            }}
                                                        />
                                                        <FaUpload />
                                                        <span>Upload</span>
                                                    </label>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((classNum) => (
                                            <td key={classNum} className="upload-cell">
                                                <div className="sub-upload-label">Finalterm</div>
                                                {portfolioData.subjects.default.ClassPortfolio?.K1?.[classNum]?.finaltermFile?.uploaded ? (
                                                    <div className="uploaded-file small">
                                                        <FaFile />
                                                        <span>{portfolioData.subjects.default.ClassPortfolio?.K1?.[classNum]?.finaltermFile?.fileName}</span>
                                                        <button
                                                            className="remove-file-btn small"
                                                            onClick={() => setPortfolioData(prev => ({
                                                                ...prev,
                                                                subjects: {
                                                                    ...prev.subjects,
                                                                    default: {
                                                                        ...prev.subjects.default,
                                                                        ClassPortfolio: {
                                                                            ...(prev.subjects.default.ClassPortfolio || {}),
                                                                            K1: {
                                                                                ...(prev.subjects.default.ClassPortfolio?.K1 || {}),
                                                                                [classNum]: {
                                                                                    ...(prev.subjects.default.ClassPortfolio?.K1?.[classNum] || {}),
                                                                                    finaltermFile: { uploaded: false, fileName: '' }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }))}
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="upload-area small">
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                            hidden
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    setPortfolioData(prev => ({
                                                                        ...prev,
                                                                        subjects: {
                                                                            ...prev.subjects,
                                                                            default: {
                                                                                ...prev.subjects.default,
                                                                                ClassPortfolio: {
                                                                                    ...(prev.subjects.default.ClassPortfolio || {}),
                                                                                    K1: {
                                                                                        ...(prev.subjects.default.ClassPortfolio?.K1 || {}),
                                                                                        [classNum]: {
                                                                                            ...(prev.subjects.default.ClassPortfolio?.K1?.[classNum] || {}),
                                                                                            finaltermFile: { uploaded: true, fileName: file.name }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }));
                                                                }
                                                            }}
                                                        />
                                                        <FaUpload />
                                                        <span>Upload</span>
                                                    </label>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                    {/* L 1.0 Test Questionnaire - with sub-uploads */}
                                    <tr>
                                        <td className="item-name" rowSpan={2}>L 1.0<br/><small>Test Questionnaire</small></td>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((classNum) => (
                                            <td key={classNum} className="upload-cell">
                                                <div className="sub-upload-label">Midterm</div>
                                                {portfolioData.subjects.default.ClassPortfolio?.L1_Q?.[classNum]?.midtermFile?.uploaded ? (
                                                    <div className="uploaded-file small">
                                                        <FaFile />
                                                        <span>{portfolioData.subjects.default.ClassPortfolio?.L1_Q?.[classNum]?.midtermFile?.fileName}</span>
                                                        <button
                                                            className="remove-file-btn small"
                                                            onClick={() => setPortfolioData(prev => ({
                                                                ...prev,
                                                                subjects: {
                                                                    ...prev.subjects,
                                                                    default: {
                                                                        ...prev.subjects.default,
                                                                        ClassPortfolio: {
                                                                            ...(prev.subjects.default.ClassPortfolio || {}),
                                                                            L1_Q: {
                                                                                ...(prev.subjects.default.ClassPortfolio?.L1_Q || {}),
                                                                                [classNum]: {
                                                                                    ...(prev.subjects.default.ClassPortfolio?.L1_Q?.[classNum] || {}),
                                                                                    midtermFile: { uploaded: false, fileName: '' }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }))}
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="upload-area small">
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                            hidden
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    setPortfolioData(prev => ({
                                                                        ...prev,
                                                                        subjects: {
                                                                            ...prev.subjects,
                                                                            default: {
                                                                                ...prev.subjects.default,
                                                                                ClassPortfolio: {
                                                                                    ...(prev.subjects.default.ClassPortfolio || {}),
                                                                                    L1_Q: {
                                                                                        ...(prev.subjects.default.ClassPortfolio?.L1_Q || {}),
                                                                                        [classNum]: {
                                                                                            ...(prev.subjects.default.ClassPortfolio?.L1_Q?.[classNum] || {}),
                                                                                            midtermFile: { uploaded: true, fileName: file.name }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }));
                                                                }
                                                            }}
                                                        />
                                                        <FaUpload />
                                                        <span>Upload</span>
                                                    </label>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((classNum) => (
                                            <td key={classNum} className="upload-cell">
                                                <div className="sub-upload-label">Finalterm</div>
                                                {portfolioData.subjects.default.ClassPortfolio?.L1_Q?.[classNum]?.finaltermFile?.uploaded ? (
                                                    <div className="uploaded-file small">
                                                        <FaFile />
                                                        <span>{portfolioData.subjects.default.ClassPortfolio?.L1_Q?.[classNum]?.finaltermFile?.fileName}</span>
                                                        <button
                                                            className="remove-file-btn small"
                                                            onClick={() => setPortfolioData(prev => ({
                                                                ...prev,
                                                                subjects: {
                                                                    ...prev.subjects,
                                                                    default: {
                                                                        ...prev.subjects.default,
                                                                        ClassPortfolio: {
                                                                            ...(prev.subjects.default.ClassPortfolio || {}),
                                                                            L1_Q: {
                                                                                ...(prev.subjects.default.ClassPortfolio?.L1_Q || {}),
                                                                                [classNum]: {
                                                                                    ...(prev.subjects.default.ClassPortfolio?.L1_Q?.[classNum] || {}),
                                                                                    finaltermFile: { uploaded: false, fileName: '' }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }))}
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="upload-area small">
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                            hidden
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    setPortfolioData(prev => ({
                                                                        ...prev,
                                                                        subjects: {
                                                                            ...prev.subjects,
                                                                            default: {
                                                                                ...prev.subjects.default,
                                                                                ClassPortfolio: {
                                                                                    ...(prev.subjects.default.ClassPortfolio || {}),
                                                                                    L1_Q: {
                                                                                        ...(prev.subjects.default.ClassPortfolio?.L1_Q || {}),
                                                                                        [classNum]: {
                                                                                            ...(prev.subjects.default.ClassPortfolio?.L1_Q?.[classNum] || {}),
                                                                                            finaltermFile: { uploaded: true, fileName: file.name }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }));
                                                                }
                                                            }}
                                                        />
                                                        <FaUpload />
                                                        <span>Upload</span>
                                                    </label>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'L' && (
                        <div className="tab-content-section">
                            <h3>L 1.0 - Sample Checked Activities</h3>
                            
                            <div className="activity-section">
                                <h4>Instruction of the Activities (per Course Outcome)</h4>
                                <table className="portfolio-table">
                                    <thead>
                                        <tr>
                                            <th>Class</th>
                                            {[1, 2, 3, 4, 5].map((co) => (
                                                <th key={co}>CO {co}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((classNum) => (
                                            <tr key={classNum}>
                                                <td className="item-name">Class {classNum}</td>
                                                {[1, 2, 3, 4, 5].map((co) => {
                                                    const fileData = portfolioData.subjects.default.L1?.instruction?.[classNum]?.[`CO${co}File`];
                                                    return (
                                                        <td key={co} className="upload-cell">
                                                            {fileData?.uploaded ? (
                                                                <div className="uploaded-file small">
                                                                    <FaFile />
                                                                    <span>{fileData.fileName}</span>
                                                                    <button
                                                                        className="remove-file-btn small"
                                                                        onClick={() => setPortfolioData(prev => ({
                                                                            ...prev,
                                                                            subjects: {
                                                                                ...prev.subjects,
                                                                                default: {
                                                                                    ...prev.subjects.default,
                                                                                    L1: {
                                                                                        ...prev.subjects.default.L1,
                                                                                        instruction: {
                                                                                            ...(prev.subjects.default.L1?.instruction || {}),
                                                                                            [classNum]: {
                                                                                                ...(prev.subjects.default.L1?.instruction?.[classNum] || {}),
                                                                                                [`CO${co}File`]: { uploaded: false, fileName: '' }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }))}
                                                                    >
                                                                        <FaTimes />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <label className="upload-area small">
                                                                    <input
                                                                        type="file"
                                                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                                        hidden
                                                                        onChange={(e) => {
                                                                            const file = e.target.files[0];
                                                                            if (file) {
                                                                                setPortfolioData(prev => ({
                                                                                    ...prev,
                                                                                    subjects: {
                                                                                        ...prev.subjects,
                                                                                        default: {
                                                                                            ...prev.subjects.default,
                                                                                            L1: {
                                                                                                ...prev.subjects.default.L1,
                                                                                                instruction: {
                                                                                                    ...(prev.subjects.default.L1?.instruction || {}),
                                                                                                    [classNum]: {
                                                                                                        ...(prev.subjects.default.L1?.instruction?.[classNum] || {}),
                                                                                                        [`CO${co}File`]: { uploaded: true, fileName: file.name }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }));
                                                                            }
                                                                        }}
                                                                    />
                                                                    <FaUpload />
                                                                    <span>Upload</span>
                                                                </label>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="activity-section">
                                <h4>Sample of Checked Student Output (3 students with highest, middle and lowest score)</h4>
                                <table className="portfolio-table">
                                    <thead>
                                        <tr>
                                            <th>Class</th>
                                            {[1, 2, 3, 4, 5].map((co) => (
                                                <th key={co}>CO {co}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((classNum) => (
                                            <tr key={classNum}>
                                                <td className="item-name">Class {classNum}</td>
                                                {[1, 2, 3, 4, 5].map((co) => {
                                                    const fileData = portfolioData.subjects.default.L1?.sampleOutput?.[classNum]?.[`CO${co}File`];
                                                    return (
                                                        <td key={co} className="upload-cell">
                                                            {fileData?.uploaded ? (
                                                                <div className="uploaded-file small">
                                                                    <FaFile />
                                                                    <span>{fileData.fileName}</span>
                                                                    <button
                                                                        className="remove-file-btn small"
                                                                        onClick={() => setPortfolioData(prev => ({
                                                                            ...prev,
                                                                            subjects: {
                                                                                ...prev.subjects,
                                                                                default: {
                                                                                    ...prev.subjects.default,
                                                                                    L1: {
                                                                                        ...prev.subjects.default.L1,
                                                                                        sampleOutput: {
                                                                                            ...(prev.subjects.default.L1?.sampleOutput || {}),
                                                                                            [classNum]: {
                                                                                                ...(prev.subjects.default.L1?.sampleOutput?.[classNum] || {}),
                                                                                                [`CO${co}File`]: { uploaded: false, fileName: '' }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }))}
                                                                    >
                                                                        <FaTimes />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <label className="upload-area small">
                                                                    <input
                                                                        type="file"
                                                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                                        hidden
                                                                        onChange={(e) => {
                                                                            const file = e.target.files[0];
                                                                            if (file) {
                                                                                setPortfolioData(prev => ({
                                                                                    ...prev,
                                                                                    subjects: {
                                                                                        ...prev.subjects,
                                                                                        default: {
                                                                                            ...prev.subjects.default,
                                                                                            L1: {
                                                                                                ...prev.subjects.default.L1,
                                                                                                sampleOutput: {
                                                                                                    ...(prev.subjects.default.L1?.sampleOutput || {}),
                                                                                                    [classNum]: {
                                                                                                        ...(prev.subjects.default.L1?.sampleOutput?.[classNum] || {}),
                                                                                                        [`CO${co}File`]: { uploaded: true, fileName: file.name }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }));
                                                                            }
                                                                        }}
                                                                    />
                                                                    <FaUpload />
                                                                    <span>Upload</span>
                                                                </label>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="activity-section">
                                <h4>Answer Key or Rated Rubrics</h4>
                                <table className="portfolio-table">
                                    <thead>
                                        <tr>
                                            <th>Class</th>
                                            {[1, 2, 3, 4, 5].map((co) => (
                                                <th key={co}>CO {co}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((classNum) => (
                                            <tr key={classNum}>
                                                <td className="item-name">Class {classNum}</td>
                                                {[1, 2, 3, 4, 5].map((co) => {
                                                    const fileData = portfolioData.subjects.default.L1?.answerKey?.[classNum]?.[`CO${co}File`];
                                                    return (
                                                        <td key={co} className="upload-cell">
                                                            {fileData?.uploaded ? (
                                                                <div className="uploaded-file small">
                                                                    <FaFile />
                                                                    <span>{fileData.fileName}</span>
                                                                    <button
                                                                        className="remove-file-btn small"
                                                                        onClick={() => setPortfolioData(prev => ({
                                                                            ...prev,
                                                                            subjects: {
                                                                                ...prev.subjects,
                                                                                default: {
                                                                                    ...prev.subjects.default,
                                                                                    L1: {
                                                                                        ...prev.subjects.default.L1,
                                                                                        answerKey: {
                                                                                            ...(prev.subjects.default.L1?.answerKey || {}),
                                                                                            [classNum]: {
                                                                                                ...(prev.subjects.default.L1?.answerKey?.[classNum] || {}),
                                                                                                [`CO${co}File`]: { uploaded: false, fileName: '' }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }))}
                                                                    >
                                                                        <FaTimes />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <label className="upload-area small">
                                                                    <input
                                                                        type="file"
                                                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                                        hidden
                                                                        onChange={(e) => {
                                                                            const file = e.target.files[0];
                                                                            if (file) {
                                                                                setPortfolioData(prev => ({
                                                                                    ...prev,
                                                                                    subjects: {
                                                                                        ...prev.subjects,
                                                                                        default: {
                                                                                            ...prev.subjects.default,
                                                                                            L1: {
                                                                                                ...prev.subjects.default.L1,
                                                                                                answerKey: {
                                                                                                    ...(prev.subjects.default.L1?.answerKey || {}),
                                                                                                    [classNum]: {
                                                                                                        ...(prev.subjects.default.L1?.answerKey?.[classNum] || {}),
                                                                                                        [`CO${co}File`]: { uploaded: true, fileName: file.name }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }));
                                                                            }
                                                                        }}
                                                                    />
                                                                    <FaUpload />
                                                                    <span>Upload</span>
                                                                </label>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="activity-section">
                                <h4>Return Output Receipt</h4>
                                {portfolioData.subjects.default.L1?.returnOutputReceipt?.uploaded ? (
                                    <div className="uploaded-file">
                                        <FaFile />
                                        <span>{portfolioData.subjects.default.L1?.returnOutputReceipt?.fileName}</span>
                                        <button
                                            className="remove-file-btn"
                                            onClick={() => setPortfolioData(prev => ({
                                                ...prev,
                                                subjects: {
                                                    ...prev.subjects,
                                                    default: {
                                                        ...prev.subjects.default,
                                                        L1: {
                                                            ...prev.subjects.default.L1,
                                                            returnOutputReceipt: { uploaded: false, fileName: '' }
                                                        }
                                                    }
                                                }
                                            }))}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="upload-area">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            hidden
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setPortfolioData(prev => ({
                                                        ...prev,
                                                        subjects: {
                                                            ...prev.subjects,
                                                            default: {
                                                                ...prev.subjects.default,
                                                                L1: {
                                                                    ...prev.subjects.default.L1,
                                                                    returnOutputReceipt: { uploaded: true, fileName: file.name }
                                                                }
                                                            }
                                                        }
                                                    }));
                                                }
                                            }}
                                        />
                                        <FaUpload />
                                        <span>Upload Return Output Receipt</span>
                                    </label>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'M' && (
                        <div className="tab-content-section">
                            <h3>M 1.0 - Class Records and Official Grade</h3>
                            
                            <table className="portfolio-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((classNum) => (
                                            <th key={classNum}>Class {classNum}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="item-name">Raw score<br/><small>(class record) attached samples</small></td>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((classNum) => {
                                            const fileData = portfolioData.subjects.default.M1?.rawScore?.[classNum];
                                            return (
                                                <td key={classNum} className="upload-cell">
                                                    {fileData?.uploaded ? (
                                                        <div className="uploaded-file small">
                                                            <FaFile />
                                                            <span>{fileData.fileName}</span>
                                                            <button
                                                                className="remove-file-btn small"
                                                                onClick={() => setPortfolioData(prev => ({
                                                                    ...prev,
                                                                    subjects: {
                                                                        ...prev.subjects,
                                                                        default: {
                                                                            ...prev.subjects.default,
                                                                            M1: {
                                                                                ...prev.subjects.default.M1,
                                                                                rawScore: {
                                                                                    ...(prev.subjects.default.M1?.rawScore || {}),
                                                                                    [classNum]: { uploaded: false, fileName: '' }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }))}
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="upload-area small">
                                                            <input
                                                                type="file"
                                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                                hidden
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        setPortfolioData(prev => ({
                                                                            ...prev,
                                                                            subjects: {
                                                                                ...prev.subjects,
                                                                                default: {
                                                                                    ...prev.subjects.default,
                                                                                    M1: {
                                                                                        ...prev.subjects.default.M1,
                                                                                        rawScore: {
                                                                                            ...(prev.subjects.default.M1?.rawScore || {}),
                                                                                            [classNum]: { uploaded: true, fileName: file.name }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }));
                                                                    }
                                                                }}
                                                            />
                                                            <FaUpload />
                                                            <span>Upload</span>
                                                        </label>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    <tr>
                                        <td className="item-name">Grade sheet<br/><small>(class record) signed</small></td>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((classNum) => {
                                            const fileData = portfolioData.subjects.default.M1?.gradeSheetSigned?.[classNum];
                                            return (
                                                <td key={classNum} className="upload-cell">
                                                    {fileData?.uploaded ? (
                                                        <div className="uploaded-file small">
                                                            <FaFile />
                                                            <span>{fileData.fileName}</span>
                                                            <button
                                                                className="remove-file-btn small"
                                                                onClick={() => setPortfolioData(prev => ({
                                                                    ...prev,
                                                                    subjects: {
                                                                        ...prev.subjects,
                                                                        default: {
                                                                            ...prev.subjects.default,
                                                                            M1: {
                                                                                ...prev.subjects.default.M1,
                                                                                gradeSheetSigned: {
                                                                                    ...(prev.subjects.default.M1?.gradeSheetSigned || {}),
                                                                                    [classNum]: { uploaded: false, fileName: '' }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }))}
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="upload-area small">
                                                            <input
                                                                type="file"
                                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                                hidden
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        setPortfolioData(prev => ({
                                                                            ...prev,
                                                                            subjects: {
                                                                                ...prev.subjects,
                                                                                default: {
                                                                                    ...prev.subjects.default,
                                                                                    M1: {
                                                                                        ...prev.subjects.default.M1,
                                                                                        gradeSheetSigned: {
                                                                                            ...(prev.subjects.default.M1?.gradeSheetSigned || {}),
                                                                                            [classNum]: { uploaded: true, fileName: file.name }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }));
                                                                    }
                                                                }}
                                                            />
                                                            <FaUpload />
                                                            <span>Upload</span>
                                                        </label>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    <tr>
                                        <td className="item-name">Official Grade sheet<br/><small>(Registrar)</small></td>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((classNum) => {
                                            const fileData = portfolioData.subjects.default.M1?.officialGradeSheet?.[classNum];
                                            return (
                                                <td key={classNum} className="upload-cell">
                                                    {fileData?.uploaded ? (
                                                        <div className="uploaded-file small">
                                                            <FaFile />
                                                            <span>{fileData.fileName}</span>
                                                            <button
                                                                className="remove-file-btn small"
                                                                onClick={() => setPortfolioData(prev => ({
                                                                    ...prev,
                                                                    subjects: {
                                                                        ...prev.subjects,
                                                                        default: {
                                                                            ...prev.subjects.default,
                                                                            M1: {
                                                                                ...prev.subjects.default.M1,
                                                                                officialGradeSheet: {
                                                                                    ...(prev.subjects.default.M1?.officialGradeSheet || {}),
                                                                                    [classNum]: { uploaded: false, fileName: '' }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }))}
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="upload-area small">
                                                            <input
                                                                type="file"
                                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                                hidden
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        setPortfolioData(prev => ({
                                                                            ...prev,
                                                                            subjects: {
                                                                                ...prev.subjects,
                                                                                default: {
                                                                                    ...prev.subjects.default,
                                                                                    M1: {
                                                                                        ...prev.subjects.default.M1,
                                                                                        officialGradeSheet: {
                                                                                            ...(prev.subjects.default.M1?.officialGradeSheet || {}),
                                                                                            [classNum]: { uploaded: true, fileName: file.name }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }));
                                                                    }
                                                                }}
                                                            />
                                                            <FaUpload />
                                                            <span>Upload</span>
                                                        </label>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    <tr>
                                        <td className="item-name">Google Classroom<br/><small>Classwork Score</small></td>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((classNum) => {
                                            const fileData = portfolioData.subjects.default.M1?.googleClassroomScore?.[classNum];
                                            return (
                                                <td key={classNum} className="upload-cell">
                                                    {fileData?.uploaded ? (
                                                        <div className="uploaded-file small">
                                                            <FaFile />
                                                            <span>{fileData.fileName}</span>
                                                            <button
                                                                className="remove-file-btn small"
                                                                onClick={() => setPortfolioData(prev => ({
                                                                    ...prev,
                                                                    subjects: {
                                                                        ...prev.subjects,
                                                                        default: {
                                                                            ...prev.subjects.default,
                                                                            M1: {
                                                                                ...prev.subjects.default.M1,
                                                                                googleClassroomScore: {
                                                                                    ...(prev.subjects.default.M1?.googleClassroomScore || {}),
                                                                                    [classNum]: { uploaded: false, fileName: '' }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }))}
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="upload-area small">
                                                            <input
                                                                type="file"
                                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                                hidden
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        setPortfolioData(prev => ({
                                                                            ...prev,
                                                                            subjects: {
                                                                                ...prev.subjects,
                                                                                default: {
                                                                                    ...prev.subjects.default,
                                                                                    M1: {
                                                                                        ...prev.subjects.default.M1,
                                                                                        googleClassroomScore: {
                                                                                            ...(prev.subjects.default.M1?.googleClassroomScore || {}),
                                                                                            [classNum]: { uploaded: true, fileName: file.name }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }));
                                                                    }
                                                                }}
                                                            />
                                                            <FaUpload />
                                                            <span>Upload</span>
                                                        </label>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'N' && (
                        <div className="tab-content-section">
                            <h3>N 1.0 - Student Consultation and Other Requirements</h3>
                            
                            <table className="portfolio-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((classNum) => (
                                            <th key={classNum}>Class {classNum}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="item-name">Student Consultation Forms</td>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((classNum) => {
                                            const fileData = portfolioData.subjects.default.N1?.consultationForms?.[classNum];
                                            return (
                                                <td key={classNum} className="upload-cell">
                                                    {fileData?.uploaded ? (
                                                        <div className="uploaded-file small">
                                                            <FaFile />
                                                            <span>{fileData.fileName}</span>
                                                            <button
                                                                className="remove-file-btn small"
                                                                onClick={() => setPortfolioData(prev => ({
                                                                    ...prev,
                                                                    subjects: {
                                                                        ...prev.subjects,
                                                                        default: {
                                                                            ...prev.subjects.default,
                                                                            N1: {
                                                                                ...prev.subjects.default.N1,
                                                                                consultationForms: {
                                                                                    ...(prev.subjects.default.N1?.consultationForms || {}),
                                                                                    [classNum]: { uploaded: false, fileName: '' }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }))}
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="upload-area small">
                                                            <input
                                                                type="file"
                                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                                hidden
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        setPortfolioData(prev => ({
                                                                            ...prev,
                                                                            subjects: {
                                                                                ...prev.subjects,
                                                                                default: {
                                                                                    ...prev.subjects.default,
                                                                                    N1: {
                                                                                        ...prev.subjects.default.N1,
                                                                                        consultationForms: {
                                                                                            ...(prev.subjects.default.N1?.consultationForms || {}),
                                                                                            [classNum]: { uploaded: true, fileName: file.name }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }));
                                                                    }
                                                                }}
                                                            />
                                                            <FaUpload />
                                                            <span>Upload</span>
                                                        </label>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    <tr>
                                        <td className="item-name">Samples Screen shots<br/><small>online consultation platforms (with section code)</small></td>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((classNum) => {
                                            const fileData = portfolioData.subjects.default.N1?.consultationScreenshots?.[classNum];
                                            return (
                                                <td key={classNum} className="upload-cell">
                                                    {fileData?.uploaded ? (
                                                        <div className="uploaded-file small">
                                                            <FaFile />
                                                            <span>{fileData.fileName}</span>
                                                            <button
                                                                className="remove-file-btn small"
                                                                onClick={() => setPortfolioData(prev => ({
                                                                    ...prev,
                                                                    subjects: {
                                                                        ...prev.subjects,
                                                                        default: {
                                                                            ...prev.subjects.default,
                                                                            N1: {
                                                                                ...prev.subjects.default.N1,
                                                                                consultationScreenshots: {
                                                                                    ...(prev.subjects.default.N1?.consultationScreenshots || {}),
                                                                                    [classNum]: { uploaded: false, fileName: '' }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }))}
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="upload-area small">
                                                            <input
                                                                type="file"
                                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                                hidden
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        setPortfolioData(prev => ({
                                                                            ...prev,
                                                                            subjects: {
                                                                                ...prev.subjects,
                                                                                default: {
                                                                                    ...prev.subjects.default,
                                                                                    N1: {
                                                                                        ...prev.subjects.default.N1,
                                                                                        consultationScreenshots: {
                                                                                            ...(prev.subjects.default.N1?.consultationScreenshots || {}),
                                                                                            [classNum]: { uploaded: true, fileName: file.name }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }));
                                                                    }
                                                                }}
                                                            />
                                                            <FaUpload />
                                                            <span>Upload</span>
                                                        </label>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    <tr>
                                        <td className="item-name">Evidence of addressing<br/><small>student concerns (with section code)</small></td>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((classNum) => {
                                            const fileData = portfolioData.subjects.default.N1?.evidenceAddressing?.[classNum];
                                            return (
                                                <td key={classNum} className="upload-cell">
                                                    {fileData?.uploaded ? (
                                                        <div className="uploaded-file small">
                                                            <FaFile />
                                                            <span>{fileData.fileName}</span>
                                                            <button
                                                                className="remove-file-btn small"
                                                                onClick={() => setPortfolioData(prev => ({
                                                                    ...prev,
                                                                    subjects: {
                                                                        ...prev.subjects,
                                                                        default: {
                                                                            ...prev.subjects.default,
                                                                            N1: {
                                                                                ...prev.subjects.default.N1,
                                                                                evidenceAddressing: {
                                                                                    ...(prev.subjects.default.N1?.evidenceAddressing || {}),
                                                                                    [classNum]: { uploaded: false, fileName: '' }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }))}
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="upload-area small">
                                                            <input
                                                                type="file"
                                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                                hidden
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        setPortfolioData(prev => ({
                                                                            ...prev,
                                                                            subjects: {
                                                                                ...prev.subjects,
                                                                                default: {
                                                                                    ...prev.subjects.default,
                                                                                    N1: {
                                                                                        ...prev.subjects.default.N1,
                                                                                        evidenceAddressing: {
                                                                                            ...(prev.subjects.default.N1?.evidenceAddressing || {}),
                                                                                            [classNum]: { uploaded: true, fileName: file.name }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }));
                                                                    }
                                                                }}
                                                            />
                                                            <FaUpload />
                                                            <span>Upload</span>
                                                        </label>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </tbody>
                            </table>

                            <div className="activity-section">
                                <h4>O 1.0 INC Completion requirement outputs (Sample Activity of the students attached the assessment tools and accomplished INC Form)</h4>
                                {portfolioData.subjects.default.N1?.O1?.uploaded ? (
                                    <div className="uploaded-file">
                                        <FaFile />
                                        <span>{portfolioData.subjects.default.N1?.O1?.fileName}</span>
                                        <button
                                            className="remove-file-btn"
                                            onClick={() => setPortfolioData(prev => ({
                                                ...prev,
                                                subjects: {
                                                    ...prev.subjects,
                                                    default: {
                                                        ...prev.subjects.default,
                                                        N1: {
                                                            ...prev.subjects.default.N1,
                                                            O1: { uploaded: false, fileName: '' }
                                                        }
                                                    }
                                                }
                                            }))}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="upload-area">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            hidden
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setPortfolioData(prev => ({
                                                        ...prev,
                                                        subjects: {
                                                            ...prev.subjects,
                                                            default: {
                                                                ...prev.subjects.default,
                                                                N1: {
                                                                    ...prev.subjects.default.N1,
                                                                    O1: { uploaded: true, fileName: file.name }
                                                                }
                                                            }
                                                        }
                                                    }));
                                                }
                                            }}
                                        />
                                        <FaUpload />
                                        <span>Upload INC Completion Requirements</span>
                                    </label>
                                )}
                            </div>

                            <div className="activity-section">
                                <h4>P 1.0 Supervisory class observation result (Class observation rating of supervisors (chair/Dean))</h4>
                                {portfolioData.subjects.default.N1?.P1?.uploaded ? (
                                    <div className="uploaded-file">
                                        <FaFile />
                                        <span>{portfolioData.subjects.default.N1?.P1?.fileName}</span>
                                        <button
                                            className="remove-file-btn"
                                            onClick={() => setPortfolioData(prev => ({
                                                ...prev,
                                                subjects: {
                                                    ...prev.subjects,
                                                    default: {
                                                        ...prev.subjects.default,
                                                        N1: {
                                                            ...prev.subjects.default.N1,
                                                            P1: { uploaded: false, fileName: '' }
                                                        }
                                                    }
                                                }
                                            }))}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="upload-area">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            hidden
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setPortfolioData(prev => ({
                                                        ...prev,
                                                        subjects: {
                                                            ...prev.subjects,
                                                            default: {
                                                                ...prev.subjects.default,
                                                                N1: {
                                                                    ...prev.subjects.default.N1,
                                                                    P1: { uploaded: true, fileName: file.name }
                                                                }
                                                            }
                                                        }
                                                    }));
                                                }
                                            }}
                                        />
                                        <FaUpload />
                                        <span>Upload Supervisory Observation Result</span>
                                    </label>
                                )}
                            </div>

                            <div className="activity-section">
                                <h4>Q 1.0 Summary of student evaluation (QAMIS Ratings screen shots and Sample of comments (optional) and corrective actions if needed)</h4>
                                {portfolioData.subjects.default.N1?.Q1?.uploaded ? (
                                    <div className="uploaded-file">
                                        <FaFile />
                                        <span>{portfolioData.subjects.default.N1?.Q1?.fileName}</span>
                                        <button
                                            className="remove-file-btn"
                                            onClick={() => setPortfolioData(prev => ({
                                                ...prev,
                                                subjects: {
                                                    ...prev.subjects,
                                                    default: {
                                                        ...prev.subjects.default,
                                                        N1: {
                                                            ...prev.subjects.default.N1,
                                                            Q1: { uploaded: false, fileName: '' }
                                                        }
                                                    }
                                                }
                                            }))}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="upload-area">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            hidden
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setPortfolioData(prev => ({
                                                        ...prev,
                                                        subjects: {
                                                            ...prev.subjects,
                                                            default: {
                                                                ...prev.subjects.default,
                                                                N1: {
                                                                    ...prev.subjects.default.N1,
                                                                    Q1: { uploaded: true, fileName: file.name }
                                                                }
                                                            }
                                                        }
                                                    }));
                                                }
                                            }}
                                        />
                                        <FaUpload />
                                        <span>Upload Student Evaluation Summary</span>
                                    </label>
                                )}
                            </div>

                            <div className="activity-section">
                                <h4>R 1.0 Learning Contract</h4>
                                {portfolioData.subjects.default.N1?.R1?.uploaded ? (
                                    <div className="uploaded-file">
                                        <FaFile />
                                        <span>{portfolioData.subjects.default.N1?.R1?.fileName}</span>
                                        <button
                                            className="remove-file-btn"
                                            onClick={() => setPortfolioData(prev => ({
                                                ...prev,
                                                subjects: {
                                                    ...prev.subjects,
                                                    default: {
                                                        ...prev.subjects.default,
                                                        N1: {
                                                            ...prev.subjects.default.N1,
                                                            R1: { uploaded: false, fileName: '' }
                                                        }
                                                    }
                                                }
                                            }))}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="upload-area">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            hidden
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setPortfolioData(prev => ({
                                                        ...prev,
                                                        subjects: {
                                                            ...prev.subjects,
                                                            default: {
                                                                ...prev.subjects.default,
                                                                N1: {
                                                                    ...prev.subjects.default.N1,
                                                                    R1: { uploaded: true, fileName: file.name }
                                                                }
                                                            }
                                                        }
                                                    }));
                                                }
                                            }}
                                        />
                                        <FaUpload />
                                        <span>Upload Learning Contract</span>
                                    </label>
                                )}
                            </div>
                        </div>
                    )}
                </div>
        </div>

        {/* Subject Portfolio Modal */}
        {showSubjectModal && selectedSubject && (
            <div className="modal-overlay">
                <div className="modal-content large-modal">
                    <div className="modal-header">
                        <h3>Portfolio for Subject: {selectedSubject.subjectCode}</h3>
                        <button onClick={() => setShowSubjectModal(false)} className="close-modal">
                            <FaTimes />
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="subject-info">
                            <div className="form-group">
                                <label>Subject Code:</label>
                                <input
                                    type="text"
                                    value={selectedSubject.subjectCode}
                                    onChange={(e) => {
                                        const newSubjectCode = e.target.value.toUpperCase();
                                        setSelectedSubject(prev => ({ ...prev, subjectCode: newSubjectCode }));
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Section Code:</label>
                                <input
                                    type="text"
                                    value={selectedSubject.sectionCode}
                                    onChange={(e) => setSelectedSubject(prev => ({ ...prev, sectionCode: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="portfolio-section">
                            <h3>Faculty Portfolio Requirements</h3>
                            <div className="upload-grid">
                                {facultyFileTypes.map((fileType) => (
                                    <div key={fileType.id} className="upload-card">
                                        <div className="upload-card-header">
                                            <h4>{fileType.name}</h4>
                                            {selectedSubject.facultyPortfolio[fileType.id].uploaded && (
                                                <span className="upload-status uploaded">
                                                    <FaCheckCircle /> Uploaded
                                                </span>
                                            )}
                                        </div>
                                        <p className="upload-description">{fileType.description}</p>
                                        {selectedSubject.facultyPortfolio[fileType.id].uploaded ? (
                                            <div className="uploaded-file">
                                                <FaFile />
                                                <span>{selectedSubject.facultyPortfolio[fileType.id].fileName}</span>
                                                <button
                                                    className="remove-file-btn"
                                                    onClick={() => handleSubjectFileRemove(selectedSubject.subjectCode, fileType.id)}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="upload-area">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) handleSubjectFileUpload(selectedSubject.subjectCode, fileType.id, file);
                                                    }}
                                                    hidden
                                                />
                                                <FaUpload />
                                                <span>Click to upload file</span>
                                                <small>PDF, DOC, DOCX, JPG, PNG</small>
                                            </label>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
);
};

export default FacultyPortfolio;
