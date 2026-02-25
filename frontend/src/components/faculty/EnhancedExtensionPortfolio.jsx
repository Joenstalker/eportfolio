import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './EnhancedExtensionPortfolio.css';

const EnhancedExtensionPortfolio = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  
  // Form states
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    description: '',
    type: 'research',
    category: '',
    tags: '',
    collaborators: '',
    externalLinks: '',
    attachments: [],
    isPublic: false,
    featured: false
  });

  const portfolioTypes = [
    { value: 'research', label: 'Research Paper' },
    { value: 'project', label: 'Project' },
    { value: 'publication', label: 'Publication' },
    { value: 'presentation', label: 'Presentation' },
    { value: 'award', label: 'Award/Achievement' },
    { value: 'certification', label: 'Certification' },
    { value: 'workshop', label: 'Workshop/Training' },
    { value: 'other', label: 'Other' }
  ];

  const categories = [
    'Academic Research',
    'Industry Collaboration',
    'Community Service',
    'Professional Development',
    'Innovation & Patents',
    'Teaching Excellence',
    'Student Mentorship',
    'International Collaboration',
    'Other'
  ];

  // Fetch portfolios
  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/faculty/extension-portfolios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPortfolios(data.portfolios || []);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      Swal.fire('Error', 'Failed to fetch portfolios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async () => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      Object.keys(portfolioForm).forEach(key => {
        if (key === 'tags' || key === 'collaborators' || key === 'externalLinks') {
          formData.append(key, portfolioForm[key].split(',').map(item => item.trim()));
        } else if (key === 'attachments') {
          portfolioForm.attachments.forEach(file => {
            formData.append('attachments', file);
          });
        } else {
          formData.append(key, portfolioForm[key]);
        }
      });

      const response = await fetch('/api/faculty/extension-portfolios', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        Swal.fire('Success', 'Portfolio created successfully', 'success');
        setShowCreateModal(false);
        resetForm();
        fetchPortfolios();
      } else {
        const error = await response.json();
        Swal.fire('Error', error.message || 'Failed to create portfolio', 'error');
      }
    } catch (error) {
      console.error('Error creating portfolio:', error);
      Swal.fire('Error', 'Failed to create portfolio', 'error');
    }
  };

  const handleUpdatePortfolio = async () => {
    if (!selectedPortfolio) return;
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      Object.keys(portfolioForm).forEach(key => {
        if (key === 'tags' || key === 'collaborators' || key === 'externalLinks') {
          formData.append(key, portfolioForm[key].split(',').map(item => item.trim()));
        } else if (key === 'attachments') {
          portfolioForm.attachments.forEach(file => {
            formData.append('attachments', file);
          });
        } else {
          formData.append(key, portfolioForm[key]);
        }
      });

      const response = await fetch(`/api/faculty/extension-portfolios/${selectedPortfolio._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        Swal.fire('Success', 'Portfolio updated successfully', 'success');
        setShowEditModal(false);
        resetForm();
        fetchPortfolios();
      } else {
        const error = await response.json();
        Swal.fire('Error', error.message || 'Failed to update portfolio', 'error');
      }
    } catch (error) {
      console.error('Error updating portfolio:', error);
      Swal.fire('Error', 'Failed to update portfolio', 'error');
    }
  };

  const handleDeletePortfolio = async (portfolioId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the portfolio item',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete'
    });
    
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/faculty/extension-portfolios/${portfolioId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          Swal.fire('Success', 'Portfolio deleted successfully', 'success');
          fetchPortfolios();
        } else {
          const error = await response.json();
          Swal.fire('Error', error.message || 'Failed to delete portfolio', 'error');
        }
      } catch (error) {
        console.error('Error deleting portfolio:', error);
        Swal.fire('Error', 'Failed to delete portfolio', 'error');
      }
    }
  };

  const handleToggleFeatured = async (portfolioId, featured) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/faculty/extension-portfolios/${portfolioId}/toggle-featured`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ featured: !featured })
      });
      
      if (response.ok) {
        fetchPortfolios();
      } else {
        const error = await response.json();
        Swal.fire('Error', error.message || 'Failed to update portfolio', 'error');
      }
    } catch (error) {
      console.error('Error toggling featured:', error);
      Swal.fire('Error', 'Failed to update portfolio', 'error');
    }
  };

  const handleTogglePublic = async (portfolioId, isPublic) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/faculty/extension-portfolios/${portfolioId}/toggle-public`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPublic: !isPublic })
      });
      
      if (response.ok) {
        fetchPortfolios();
      } else {
        const error = await response.json();
        Swal.fire('Error', error.message || 'Failed to update portfolio', 'error');
      }
    } catch (error) {
      console.error('Error toggling public:', error);
      Swal.fire('Error', 'Failed to update portfolio', 'error');
    }
  };

  const resetForm = () => {
    setPortfolioForm({
      title: '',
      description: '',
      type: 'research',
      category: '',
      tags: '',
      collaborators: '',
      externalLinks: '',
      attachments: [],
      isPublic: false,
      featured: false
    });
  };

  const openEditModal = (portfolio) => {
    setSelectedPortfolio(portfolio);
    setPortfolioForm({
      title: portfolio.title || '',
      description: portfolio.description || '',
      type: portfolio.type || 'research',
      category: portfolio.category || '',
      tags: portfolio.tags ? portfolio.tags.join(', ') : '',
      collaborators: portfolio.collaborators ? portfolio.collaborators.join(', ') : '',
      externalLinks: portfolio.externalLinks ? portfolio.externalLinks.join(', ') : '',
      attachments: portfolio.attachments || [],
      isPublic: portfolio.isPublic || false,
      featured: portfolio.featured || false
    });
    setShowEditModal(true);
  };

  const filteredAndSortedPortfolios = portfolios
    .filter(portfolio => {
      const matchesSearch = portfolio.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           portfolio.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           portfolio.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'featured' && portfolio.featured) ||
                           (filterStatus === 'public' && portfolio.isPublic) ||
                           (filterStatus === 'private' && !portfolio.isPublic);
      const matchesType = filterType === 'all' || portfolio.type === filterType;
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'views':
          return (b.views || 0) - (a.views || 0);
        default:
          return 0;
      }
    });

  const getPortfolioStatistics = () => {
    const totalPortfolios = portfolios.length;
    const featuredPortfolios = portfolios.filter(p => p.featured).length;
    const publicPortfolios = portfolios.filter(p => p.isPublic).length;
    const totalViews = portfolios.reduce((acc, p) => acc + (p.views || 0), 0);
    
    const typeDistribution = portfolioTypes.reduce((acc, type) => {
      acc[type.value] = portfolios.filter(p => p.type === type.value).length;
      return acc;
    }, {});
    
    return {
      totalPortfolios,
      featuredPortfolios,
      publicPortfolios,
      totalViews,
      typeDistribution
    };
  };

  const stats = getPortfolioStatistics();

  return (
    <div className="enhanced-extension-portfolio">
      <div className="dashboard-header">
        <h2>Extension Portfolio</h2>
        <p>Showcase your research, projects, and achievements</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button className={`tab-btn ${activeTab === 'portfolios' ? 'active' : ''}`} onClick={() => setActiveTab('portfolios')}>
          My Portfolios
        </button>
        <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          Analytics
        </button>
        <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          Settings
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="overview-tab">
          <div className="stats-section">
            <h3>Portfolio Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📁</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalPortfolios}</div>
                  <div className="stat-label">Total Portfolios</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.featuredPortfolios}</div>
                  <div className="stat-label">Featured Items</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🌐</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.publicPortfolios}</div>
                  <div className="stat-label">Public Portfolios</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👁️</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalViews}</div>
                  <div className="stat-label">Total Views</div>
                </div>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
              <button className="action-btn" onClick={() => setShowCreateModal(true)}>
                <span className="btn-icon">➕</span>
                Create Portfolio
              </button>
              <button className="action-btn" onClick={() => setActiveTab('portfolios')}>
                <span className="btn-icon">📂</span>
                View All Portfolios
              </button>
              <button className="action-btn" onClick={() => setActiveTab('analytics')}>
                <span className="btn-icon">📊</span>
                View Analytics
              </button>
            </div>
          </div>

          <div className="recent-portfolios">
            <h3>Recent Portfolios</h3>
            <div className="recent-grid">
              {portfolios.slice(0, 6).map(portfolio => (
                <div key={portfolio._id} className="recent-card" onClick={() => {
                  setSelectedPortfolio(portfolio);
                  setShowViewModal(true);
                }}>
                  <div className="card-header">
                    <h4>{portfolio.title}</h4>
                    <div className="card-badges">
                      {portfolio.featured && <span className="badge featured">Featured</span>}
                      {portfolio.isPublic && <span className="badge public">Public</span>}
                    </div>
                  </div>
                  <p className="card-description">{portfolio.description.substring(0, 100)}...</p>
                  <div className="card-meta">
                    <span className="type">{portfolio.type}</span>
                    <span className="date">{new Date(portfolio.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Portfolios Tab */}
      {activeTab === 'portfolios' && (
        <div className="portfolios-tab">
          <div className="tab-header">
            <h3>My Portfolios</h3>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              Create New Portfolio
            </button>
          </div>

          <div className="filters-section">
            <div className="filter-group">
              <input
                type="text"
                placeholder="Search portfolios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-group">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
                <option value="all">All Status</option>
                <option value="featured">Featured</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div className="filter-group">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
                <option value="all">All Types</option>
                {portfolioTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="type">Sort by Type</option>
                <option value="views">Sort by Views</option>
              </select>
            </div>
            <div className="view-toggle">
              <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                Grid
              </button>
              <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                List
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading portfolios...</p>
            </div>
          ) : filteredAndSortedPortfolios.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>No portfolios found</h3>
              <p>Try adjusting your search or filters, or create your first portfolio</p>
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                Create Your First Portfolio
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="portfolios-grid">
              {filteredAndSortedPortfolios.map(portfolio => (
                <div key={portfolio._id} className="portfolio-card">
                  <div className="card-header">
                    <h4>{portfolio.title}</h4>
                    <div className="card-actions">
                      <button className="actions-btn" onClick={(e) => e.stopPropagation()}>
                        ⋮
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <p className="description">{portfolio.description}</p>
                    <div className="portfolio-meta">
                      <span className="type">{portfolioTypes.find(t => t.value === portfolio.type)?.label}</span>
                      <span className="category">{portfolio.category}</span>
                    </div>
                    <div className="tags">
                      {portfolio.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                      {portfolio.tags.length > 3 && <span className="tag">+{portfolio.tags.length - 3}</span>}
                    </div>
                  </div>
                  <div className="card-footer">
                    <div className="stats">
                      <span className="views">👁️ {portfolio.views || 0}</span>
                      <span className="date">{new Date(portfolio.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="actions">
                      <button className="btn-view" onClick={() => {
                        setSelectedPortfolio(portfolio);
                        setShowViewModal(true);
                      }}>
                        View
                      </button>
                      <button className="btn-edit" onClick={() => openEditModal(portfolio)}>
                        Edit
                      </button>
                      <button className="btn-delete" onClick={() => handleDeletePortfolio(portfolio._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="card-badges">
                    {portfolio.featured && <span className="badge featured">Featured</span>}
                    {portfolio.isPublic && <span className="badge public">Public</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="portfolios-list">
              <div className="list-header">
                <div>Title</div>
                <div>Type</div>
                <div>Category</div>
                <div>Views</div>
                <div>Date</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {filteredAndSortedPortfolios.map(portfolio => (
                <div key={portfolio._id} className="list-item">
                  <div className="portfolio-title">
                    <h4>{portfolio.title}</h4>
                    <p>{portfolio.description.substring(0, 100)}...</p>
                  </div>
                  <div>{portfolioTypes.find(t => t.value === portfolio.type)?.label}</div>
                  <div>{portfolio.category}</div>
                  <div>{portfolio.views || 0}</div>
                  <div>{new Date(portfolio.createdAt).toLocaleDateString()}</div>
                  <div>
                    <div className="status-badges">
                      {portfolio.featured && <span className="badge featured">Featured</span>}
                      {portfolio.isPublic && <span className="badge public">Public</span>}
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="btn-view" onClick={() => {
                      setSelectedPortfolio(portfolio);
                      setShowViewModal(true);
                    }}>View</button>
                    <button className="btn-edit" onClick={() => openEditModal(portfolio)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDeletePortfolio(portfolio._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="analytics-tab">
          <h3>Portfolio Analytics</h3>
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>Type Distribution</h4>
              <div className="type-chart">
                {Object.entries(stats.typeDistribution).map(([type, count]) => (
                  <div key={type} className="type-stat">
                    <span className="type-name">{portfolioTypes.find(t => t.value === type)?.label}</span>
                    <div className="type-bar">
                      <div className="type-fill" style={{ width: `${(count / stats.totalPortfolios) * 100}%` }}></div>
                    </div>
                    <span className="type-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="analytics-card">
              <h4>View Statistics</h4>
              <div className="view-stats">
                <div className="view-stat">
                  <span className="stat-label">Total Views</span>
                  <span className="stat-value">{stats.totalViews}</span>
                </div>
                <div className="view-stat">
                  <span className="stat-label">Average Views</span>
                  <span className="stat-value">{stats.totalPortfolios > 0 ? Math.round(stats.totalViews / stats.totalPortfolios) : 0}</span>
                </div>
              </div>
            </div>
            <div className="analytics-card">
              <h4>Engagement Metrics</h4>
              <div className="engagement-chart">
                <p>Engagement metrics visualization would go here</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="settings-tab">
          <h3>Portfolio Settings</h3>
          <div className="settings-grid">
            <div className="setting-card">
              <h4>Privacy Settings</h4>
              <div className="setting-item">
                <label>
                  <input type="checkbox" />
                  Make new portfolios public by default
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input type="checkbox" />
                  Allow comments on public portfolios
                </label>
              </div>
            </div>
            <div className="setting-card">
              <h4>Notification Settings</h4>
              <div className="setting-item">
                <label>
                  <input type="checkbox" />
                  Email notifications for new views
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input type="checkbox" />
                  Email notifications for comments
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{showCreateModal ? 'Create New Portfolio' : 'Edit Portfolio'}</h3>
              <button className="close-btn" onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                resetForm();
              }}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={portfolioForm.title}
                    onChange={(e) => setPortfolioForm({...portfolioForm, title: e.target.value})}
                    placeholder="Enter portfolio title"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description *</label>
                  <textarea
                    value={portfolioForm.description}
                    onChange={(e) => setPortfolioForm({...portfolioForm, description: e.target.value})}
                    placeholder="Describe your portfolio item"
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={portfolioForm.type}
                    onChange={(e) => setPortfolioForm({...portfolioForm, type: e.target.value})}
                  >
                    {portfolioTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={portfolioForm.category}
                    onChange={(e) => setPortfolioForm({...portfolioForm, category: e.target.value})}
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Tags</label>
                  <input
                    type="text"
                    value={portfolioForm.tags}
                    onChange={(e) => setPortfolioForm({...portfolioForm, tags: e.target.value})}
                    placeholder="Enter tags separated by commas"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Collaborators</label>
                  <input
                    type="text"
                    value={portfolioForm.collaborators}
                    onChange={(e) => setPortfolioForm({...portfolioForm, collaborators: e.target.value})}
                    placeholder="Enter collaborator names separated by commas"
                  />
                </div>
                <div className="form-group full-width">
                  <label>External Links</label>
                  <input
                    type="text"
                    value={portfolioForm.externalLinks}
                    onChange={(e) => setPortfolioForm({...portfolioForm, externalLinks: e.target.value})}
                    placeholder="Enter URLs separated by commas"
                  />
                </div>
                <div className="form-group">
                  <label>Attachments</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setPortfolioForm({...portfolioForm, attachments: Array.from(e.target.files)})}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={portfolioForm.isPublic}
                      onChange={(e) => setPortfolioForm({...portfolioForm, isPublic: e.target.checked})}
                    />
                    Make Public
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={portfolioForm.featured}
                      onChange={(e) => setPortfolioForm({...portfolioForm, featured: e.target.checked})}
                    />
                    Featured Portfolio
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                resetForm();
              }}>Cancel</button>
              <button className="btn-primary" onClick={showCreateModal ? handleCreatePortfolio : handleUpdatePortfolio}>
                {showCreateModal ? 'Create Portfolio' : 'Update Portfolio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedPortfolio && (
        <div className="modal-overlay">
          <div className="modal-content view-modal">
            <div className="modal-header">
              <h3>{selectedPortfolio.title}</h3>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="portfolio-view">
                <div className="view-header">
                  <div className="portfolio-meta">
                    <span className="type">{portfolioTypes.find(t => t.value === selectedPortfolio.type)?.label}</span>
                    <span className="category">{selectedPortfolio.category}</span>
                    <span className="date">{new Date(selectedPortfolio.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="portfolio-badges">
                    {selectedPortfolio.featured && <span className="badge featured">Featured</span>}
                    {selectedPortfolio.isPublic && <span className="badge public">Public</span>}
                  </div>
                </div>
                <div className="view-content">
                  <p className="description">{selectedPortfolio.description}</p>
                  {selectedPortfolio.tags && selectedPortfolio.tags.length > 0 && (
                    <div className="tags-section">
                      <h4>Tags</h4>
                      <div className="tags">
                        {selectedPortfolio.tags.map((tag, index) => (
                          <span key={index} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedPortfolio.collaborators && selectedPortfolio.collaborators.length > 0 && (
                    <div className="collaborators-section">
                      <h4>Collaborators</h4>
                      <ul>
                        {selectedPortfolio.collaborators.map((collaborator, index) => (
                          <li key={index}>{collaborator}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedPortfolio.externalLinks && selectedPortfolio.externalLinks.length > 0 && (
                    <div className="links-section">
                      <h4>External Links</h4>
                      <ul>
                        {selectedPortfolio.externalLinks.map((link, index) => (
                          <li key={index}>
                            <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedPortfolio.attachments && selectedPortfolio.attachments.length > 0 && (
                    <div className="attachments-section">
                      <h4>Attachments</h4>
                      <div className="attachments">
                        {selectedPortfolio.attachments.map((attachment, index) => (
                          <div key={index} className="attachment">
                            <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                              📎 {attachment.filename}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
              <button className="btn-primary" onClick={() => {
                setShowViewModal(false);
                openEditModal(selectedPortfolio);
              }}>Edit Portfolio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedExtensionPortfolio;
