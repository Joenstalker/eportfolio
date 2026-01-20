import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import './SystemSettingsTab.css';

const STORAGE_KEY = 'adminSystemSettings.v1';

const defaultSettings = {
  userManagement: {
    // UI-only toggles for now (until you wire these to backend policies)
    allowAdminRolePromotion: true,
    allowUserArchiving: true
  },
  rbac: {
    defaultNewUserRole: 'faculty', // enforced on backend register route today
    allowSelfRegistration: true,
    requireAdminApprovalForNewAccounts: false
  },
  facultyAccessControls: {
    // Faculty modules (frontend routes)
    dashboard: true,
    teachingPortfolio: true,
    classPortfolio: true,
    research: true,
    syllabus: true,
    instructionalMaterials: true,
    seminarsCertificates: true,
    // Additional controls
    canUploadFiles: true,
    canEditOwnProfile: true
  }
};

const SystemSettingsTab = ({ onNavigate }) => {
  const [settings, setSettings] = useState(defaultSettings);

  const routes = useMemo(() => ([
    { id: 'faculty', label: 'Faculty Management', icon: '👨‍🏫' },
    { id: 'archive', label: 'Archived Users', icon: '🗄️' },
    { id: 'courses', label: 'Course Management', icon: '📚' }
  ]), []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setSettings(prev => ({ ...prev, ...parsed }));
    } catch {
      // ignore corrupted settings
    }
  }, []);

  const setNested = (path, value) => {
    setSettings(prev => {
      const next = structuredClone(prev);
      let cur = next;
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
      cur[path[path.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    await Swal.fire({
      icon: 'success',
      title: 'Saved',
      text: 'System settings saved locally. (Backend enforcement can be added next.)',
      timer: 2500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  const handleReset = async () => {
    const result = await Swal.fire({
      title: 'Reset settings?',
      text: 'This will restore defaults for System Settings (local only).',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, reset',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;

    localStorage.removeItem(STORAGE_KEY);
    setSettings(defaultSettings);
    await Swal.fire({
      icon: 'success',
      title: 'Reset',
      text: 'System settings reset to defaults.',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };

  return (
    <div className="system-settings">
      <div className="settings-container">
        <h3>System Settings</h3>
        <p className="settings-subtitle">
          Admin-only configuration for user management, RBAC, and faculty access controls.
        </p>

        <div className="settings-group">
          <h4>👥 User Management</h4>
          <p className="settings-help">
            Manage users, archive/unarchive accounts, and promote faculty to admin roles.
          </p>

          <div className="settings-actions-row">
            {routes.map(r => (
              <button
                key={r.id}
                type="button"
                className="settings-link-btn"
                onClick={() => onNavigate?.(r.id)}
              >
                <span className="settings-link-icon">{r.icon}</span>
                Open {r.label}
              </button>
            ))}
          </div>

          <div className="settings-grid">
            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={settings.userManagement.allowUserArchiving}
                onChange={(e) => setNested(['userManagement', 'allowUserArchiving'], e.target.checked)}
              />
              <span className="toggle-text">
                <strong>Enable user archiving</strong>
                <small>When enabled, admins can archive users (inactive, cannot log in).</small>
              </span>
            </label>

            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={settings.userManagement.allowAdminRolePromotion}
                onChange={(e) => setNested(['userManagement', 'allowAdminRolePromotion'], e.target.checked)}
              />
              <span className="toggle-text">
                <strong>Allow admin role promotion</strong>
                <small>Admins can promote a faculty user to admin.</small>
              </span>
            </label>
          </div>
        </div>

        <div className="settings-group">
          <h4>🔐 Roles &amp; Permissions (RBAC)</h4>
          <p className="settings-help">
            Control role defaults and onboarding flow. Backend enforcement can be wired to these settings.
          </p>

          <div className="settings-grid">
            <div className="setting-field">
              <label>Default role for new accounts</label>
              <select
                value={settings.rbac.defaultNewUserRole}
                onChange={(e) => setNested(['rbac', 'defaultNewUserRole'], e.target.value)}
              >
                <option value="faculty">faculty</option>
                <option value="admin">admin</option>
              </select>
              <small>
                Recommended: <strong>faculty</strong>. (Your backend currently forces public registration to faculty.)
              </small>
            </div>

            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={settings.rbac.allowSelfRegistration}
                onChange={(e) => setNested(['rbac', 'allowSelfRegistration'], e.target.checked)}
              />
              <span className="toggle-text">
                <strong>Allow self-registration</strong>
                <small>Allow faculty to create their own account from the login page.</small>
              </span>
            </label>

            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={settings.rbac.requireAdminApprovalForNewAccounts}
                onChange={(e) => setNested(['rbac', 'requireAdminApprovalForNewAccounts'], e.target.checked)}
              />
              <span className="toggle-text">
                <strong>Require admin approval for new accounts</strong>
                <small>Newly registered users stay inactive until approved by an admin.</small>
              </span>
            </label>
          </div>
        </div>

        <div className="settings-group">
          <h4>🎛️ Faculty Access Controls</h4>
          <p className="settings-help">
            Define which modules faculty users can access. (UI settings today; can be enforced via route guards + backend checks.)
          </p>

          <div className="settings-grid two-col">
            {Object.entries(settings.facultyAccessControls).map(([key, value]) => (
              <label key={key} className="setting-toggle compact">
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(e) => setNested(['facultyAccessControls', key], e.target.checked)}
                />
                <span className="toggle-text">
                  <strong>{key}</strong>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="settings-actions">
          <button type="button" className="btn-secondary" onClick={handleReset}>
            Reset to Defaults
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsTab;

