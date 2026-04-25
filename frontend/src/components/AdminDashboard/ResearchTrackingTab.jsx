import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import { FaDownload, FaEye, FaChartBar, FaUsers, FaFileAlt, FaCalendarAlt, FaUpload, FaEdit, FaUserCheck } from 'react-icons/fa';

const FacultyTransactionTrackingTab = () => {
    const { user, ensureToken } = useContext(AuthContext);
    const [allTransactions, setAllTransactions] = useState([]);
    const [facultyStats, setFacultyStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedFaculty, setSelectedFaculty] = useState('all');
    const [selectedActivityType, setSelectedActivityType] = useState('all');
    const [selectedTimeRange, setSelectedTimeRange] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadAllTransactions();
        loadFacultyStats();
    }, []);

    const loadAllTransactions = async () => {
        try {
            const token = ensureToken();
            if (!token) return;

            // Load all types of transactions
            const [researchResponse, portfolioResponse, courseResponse] = await Promise.all([
                fetch('http://localhost:5000/api/admin/research', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/admin/faculty-portfolio', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/admin/assignments', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const transactions = [];

            if (researchResponse.ok) {
                const researchData = await researchResponse.json();
                researchData.forEach(paper => {
                    transactions.push({
                        id: paper._id,
                        type: 'research',
                        facultyName: paper.facultyName,
                        facultyId: paper.facultyId,
                        activity: 'Research Paper',
                        details: paper.title,
                        status: paper.status,
                        date: paper.publicationDate || paper.createdAt,
                        metadata: paper
                    });
                });
            }

            if (portfolioResponse.ok) {
                const portfolioData = await portfolioResponse.json();
                portfolioData.forEach(portfolio => {
                    transactions.push({
                        id: portfolio._id,
                        type: 'portfolio',
                        facultyName: portfolio.facultyName,
                        facultyId: portfolio.facultyId,
                        activity: 'Portfolio Update',
                        details: portfolio.subjectCode || 'General Portfolio',
                        status: 'completed',
                        date: portfolio.updatedAt || portfolio.createdAt,
                        metadata: portfolio
                    });
                });
            }

            if (courseResponse.ok) {
                const courseData = await courseResponse.json();
                courseData.forEach(assignment => {
                    transactions.push({
                        id: assignment._id,
                        type: 'course',
                        facultyName: assignment.facultyId?.firstName + ' ' + assignment.facultyId?.lastName,
                        facultyId: assignment.facultyId?._id,
                        activity: 'Course Assignment',
                        details: assignment.courseId?.courseCode + ' - ' + assignment.semester,
                        status: assignment.status,
                        date: assignment.assignedAt,
                        metadata: assignment
                    });
                });
            }

            setAllTransactions(transactions);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadFacultyStats = async () => {
        try {
            const token = ensureToken();
            if (!token) return;

            const response = await fetch('http://localhost:5000/api/admin/faculty/activity-stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setFacultyStats(data);
            }
        } catch (error) {
            console.error('Error loading faculty stats:', error);
        }
    };

    const filteredTransactions = allTransactions.filter(transaction => {
        const matchesFaculty = selectedFaculty === 'all' || transaction.facultyId === selectedFaculty;
        const matchesType = selectedActivityType === 'all' || transaction.type === selectedActivityType;
        const matchesSearch = transaction.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            transaction.facultyName.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesFaculty && matchesType && matchesSearch;
    });

    const getOverviewStats = () => {
        const totalTransactions = allTransactions.length;
        const researchCount = allTransactions.filter(t => t.type === 'research').length;
        const portfolioCount = allTransactions.filter(t => t.type === 'portfolio').length;
        const courseCount = allTransactions.filter(t => t.type === 'course').length;
        
        const uniqueFaculty = [...new Set(allTransactions.map(t => t.facultyName))].length;
        
        return {
            totalTransactions,
            researchCount,
            portfolioCount,
            courseCount,
            uniqueFaculty
        };
    };

    const stats = getOverviewStats();

    const exportReport = async () => {
        try {
            const token = ensureToken();
            const response = await fetch('http://localhost:5000/api/admin/transactions/export', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    faculty: selectedFaculty,
                    activityType: selectedActivityType,
                    timeRange: selectedTimeRange
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `faculty-transactions-${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                Swal.fire({
                    title: 'Success!',
                    text: 'Transaction report exported successfully!',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error exporting report:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to export report',
                icon: 'error'
            });
        }
    };

    if (loading) {
        return (
            <div className="admin-section">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading transaction data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-section">
            <div className="section-header">
                <h2>Faculty Transaction Tracking</h2>
                <p>Monitor all faculty activities including research, portfolio updates, and course assignments</p>
            </div>

            {/* Overview Statistics */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaFileAlt />
                    </div>
                    <div className="stat-content">
                        <h3>{stats.totalTransactions}</h3>
                        <p>Total Transactions</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon research">
                        <FaChartBar />
                    </div>
                    <div className="stat-content">
                        <h3>{stats.researchCount}</h3>
                        <p>Research Activities</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon portfolio">
                        <FaUpload />
                    </div>
                    <div className="stat-content">
                        <h3>{stats.portfolioCount}</h3>
                        <p>Portfolio Updates</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon course">
                        <FaUserCheck />
                    </div>
                    <div className="stat-content">
                        <h3>{stats.courseCount}</h3>
                        <p>Course Assignments</p>
                    </div>
                </div>
            </div>

            {/* Filters and Controls */}
            <div className="control-panel">
                <div className="filter-group">
                    <label>Faculty:</label>
                    <select 
                        value={selectedFaculty} 
                        onChange={(e) => setSelectedFaculty(e.target.value)}
                    >
                        <option value="all">All Faculty</option>
                        {[...new Set(allTransactions.map(t => t.facultyName))].map(faculty => (
                            <option key={faculty} value={faculty}>{faculty}</option>
                        ))}
                    </select>
                </div>
                
                <div className="filter-group">
                    <label>Activity Type:</label>
                    <select 
                        value={selectedActivityType} 
                        onChange={(e) => setSelectedActivityType(e.target.value)}
                    >
                        <option value="all">All Activities</option>
                        <option value="research">Research</option>
                        <option value="portfolio">Portfolio</option>
                        <option value="course">Course Assignment</option>
                    </select>
                </div>
                
                <div className="filter-group">
                    <label>Time Range:</label>
                    <select 
                        value={selectedTimeRange} 
                        onChange={(e) => setSelectedTimeRange(e.target.value)}
                    >
                        <option value="all">All Time</option>
                        <option value="this-year">This Year</option>
                        <option value="last-6-months">Last 6 Months</option>
                        <option value="last-3-months">Last 3 Months</option>
                    </select>
                </div>
                
                <div className="search-group">
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <button className="export-btn" onClick={exportReport}>
                    Export Report
                </button>
            </div>

            {/* Transactions Table */}
            <div className="data-table-container">
                <h3>All Faculty Transactions</h3>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Activity Type</th>
                                <th>Faculty</th>
                                <th>Activity</th>
                                <th>Details</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map(transaction => (
                                <tr key={transaction.id}>
                                    <td>
                                        <span className={`type-badge ${transaction.type}`}>
                                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                        </span>
                                    </td>
                                    <td>{transaction.facultyName}</td>
                                    <td>{transaction.activity}</td>
                                    <td className="details-cell">
                                        <strong>{transaction.details}</strong>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${transaction.status}`}>
                                            {transaction.status}
                                        </span>
                                    </td>
                                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button 
                                                className="action-btn view"
                                                onClick={() => {
                                                    Swal.fire({
                                                        title: transaction.activity,
                                                        html: `
                                                            <div style="text-align: left;">
                                                                <p><strong>Faculty:</strong> ${transaction.facultyName}</p>
                                                                <p><strong>Type:</strong> ${transaction.type}</p>
                                                                <p><strong>Details:</strong> ${transaction.details}</p>
                                                                <p><strong>Status:</strong> ${transaction.status}</p>
                                                                <p><strong>Date:</strong> ${new Date(transaction.date).toLocaleString()}</p>
                                                            </div>
                                                        `,
                                                        width: '600px'
                                                    });
                                                }}
                                                title="View Details"
                                            >
                                                <FaEye />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Faculty Performance Summary */}
            <div className="faculty-performance">
                <h3>Faculty Activity Summary</h3>
                <div className="performance-grid">
                    {Object.entries(facultyStats).map(([facultyName, facultyData]) => (
                        <div key={facultyName} className="performance-card">
                            <h4>{facultyName}</h4>
                            <div className="performance-stats">
                                <div className="perf-stat">
                                    <span className="label">Total Activities:</span>
                                    <span className="value">{facultyData.totalActivities || 0}</span>
                                </div>
                                <div className="perf-stat">
                                    <span className="label">Research:</span>
                                    <span className="value">{facultyData.researchCount || 0}</span>
                                </div>
                                <div className="perf-stat">
                                    <span className="label">Portfolio:</span>
                                    <span className="value">{facultyData.portfolioCount || 0}</span>
                                </div>
                                <div className="perf-stat">
                                    <span className="label">Courses:</span>
                                    <span className="value">{facultyData.courseCount || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FacultyTransactionTrackingTab;
