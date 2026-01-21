import React from 'react';
import './AdminTopbar.css';

const AdminTopbar = ({ pageTitle, user }) => {
  return (
    <header className="content-header admin-content-header">
      <div className="header-left">
        <h1>{pageTitle || 'Admin Dashboard'}</h1>
        <div className="year-badge admin-badge">Admin System</div>
      </div>
      <div className="header-right">
        <div className="user-menu admin-user-menu">
          <span>System Administrator</span>
          <div className="user-role">{user?.email || ''}</div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
