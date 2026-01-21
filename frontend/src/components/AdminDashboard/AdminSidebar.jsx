import React from 'react';
import './AdminSidebar.css';

const AdminSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  adminMenuItems,
  activeSection,
  facultyMenuOpen,
  user,
  handleMenuItemClick,
  handleSubItemClick,
  handleLogout,
  isMenuItemActive
}) => {
  return (
    <div className={`sidebar admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header admin-header">
        {sidebarOpen && <h2>👑 Admin Portal</h2>}
        <button 
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
      </div>
      
      {sidebarOpen && (
        <>
          <nav className="sidebar-nav">
            {adminMenuItems.map(item => {
              const isActive = isMenuItemActive(item);
              const showChildren = sidebarOpen && item.children && (facultyMenuOpen || isActive);
              return (
                <div key={item.id} className={`nav-group ${item.children ? 'has-children' : ''}`}>
                  <button
                    className={`nav-item admin-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleMenuItemClick(item)}
                  >
                    <span className="nav-label">{item.label}</span>
                    {item.children && (
                      <span className="nav-chevron">{showChildren ? '▾' : '▸'}</span>
                    )}
                  </button>
                  {showChildren && (
                    <div className="subnav">
                      {item.children.map(child => (
                        <button
                          key={child.id}
                          className={`subnav-item ${activeSection === child.id ? 'active' : ''}`}
                          onClick={() => handleSubItemClick(item, child)}
                        >
                          <span className="nav-label">{child.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <div className="admin-info">
              <div className="admin-name">{user?.name || user?.firstName || 'Admin'}</div>
              <div className="admin-role">System Administrator</div>
            </div>
            <button 
              className="logout-btn admin-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminSidebar;
