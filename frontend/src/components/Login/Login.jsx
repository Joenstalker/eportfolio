import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import  AuthContext  from '../../contexts/AuthContext';
import './Login.css';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [createAccountData, setCreateAccountData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'faculty',
        department: ''
    });
    const [resetPasswordData, setResetPasswordData] = useState({
        email: '',
        code: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCreateAccount, setShowCreateAccount] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showCodeVerification, setShowCodeVerification] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    
    const { login, user } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleCreateAccountChange = (e) => {
        setCreateAccountData({
            ...createAccountData,
            [e.target.name]: e.target.value
        });
    };

    const handleResetPasswordChange = (e) => {
        setResetPasswordData({
            ...resetPasswordData,
            [e.target.name]: e.target.value
        });
    };

    const validatePassword = (password) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength) {
            return 'Password must be at least 8 characters long';
        }
        if (!hasUpperCase) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!hasLowerCase) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!hasNumbers) {
            return 'Password must contain at least one number';
        }
        if (!hasSpecialChar) {
            return 'Password must contain at least one special character';
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await login(formData.email, formData.password);
            
            // Redirect based on user role
            if (response.user.role === 'admin') {
                navigate('/admin-dashboard');
            } else {
                navigate('/dashboard');
            }
            
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validate passwords
        if (createAccountData.password !== createAccountData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        const passwordError = validatePassword(createAccountData.password);
        if (passwordError) {
            setError(passwordError);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(createAccountData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create account');
            }

            setSuccess('Account created successfully! Please sign in.');
            setShowCreateAccount(false);
            setCreateAccountData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                confirmPassword: '',
                role: 'faculty',
                department: ''
            });
            
        } catch (err) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        // Redirect to backend Google OAuth endpoint
        window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: resetPasswordData.email
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send reset code');
            }

            setSuccess('Reset code sent to your email!');
            setShowCodeVerification(true);
            
        } catch (err) {
            setError(err.message || 'Failed to send reset code');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        const passwordError = validatePassword(resetPasswordData.newPassword);
        if (passwordError) {
            setError(passwordError);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: resetPasswordData.email,
                    code: resetPasswordData.code,
                    newPassword: resetPasswordData.newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to reset password');
            }

            setSuccess('Password reset successfully! Please sign in.');
            setShowResetPassword(false);
            setShowCodeVerification(false);
            setResetPasswordData({
                email: '',
                code: '',
                newPassword: '',
                confirmPassword: ''
            });
            
        } catch (err) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const shouldShowCreateAccount = showCreateAccount || isAdminMode;

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>Faculty Portfolio System</h2>
                    <p>
                        {showResetPassword 
                            ? 'Reset Password'
                            : shouldShowCreateAccount 
                                ? 'Create New Account' 
                                : isAdminMode 
                                    ? 'Admin Sign In' 
                                    : 'Sign in to your account'
                        }
                    </p>
                </div>

                {/* Backend Status Check */}
                <div className="backend-status">
                    <button 
                        type="button"
                        className="status-check-btn"
                        onClick={async () => {
                            try {
                                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/health`);
                                if (response.ok) {
                                    const data = await response.json();
                                    alert(`✅ Backend is running!\nStatus: ${data.status}\nMessage: ${data.message}`);
                                } else {
                                    alert('❌ Backend is not responding. Please check if server is running on port 5000.');
                                }
                            } catch (error) {
                                alert('❌ Cannot connect to backend. Make sure the server is running on http://localhost:5000');
                            }
                        }}
                    >
                        Check Backend Status
                    </button>
                </div>

                {/* Admin Access Toggle - Only show when not in create account or reset password mode */}
                {!shouldShowCreateAccount && !showResetPassword && (
                    <div className="admin-access-toggle">
                        <button
                            type="button"
                            className={`toggle-btn ${isAdminMode ? 'active' : ''}`}
                            onClick={() => setIsAdminMode(!isAdminMode)}
                        >
                            {isAdminMode ? '← Back to Faculty Login' : 'Admin Access'}
                        </button>
                    </div>
                )}

                {/* Create Account Button for Admin Mode */}
                {isAdminMode && !showCreateAccount && !showResetPassword && (
                    <div className="admin-actions">
                        <button 
                            type="button"
                            className="create-account-btn"
                            onClick={() => setShowCreateAccount(true)}
                        >
                            + Create New Account
                        </button>
                    </div>
                )}

                {showResetPassword ? (
                    // Reset Password Form
                    <form onSubmit={showCodeVerification ? handleResetPassword : handleForgotPassword} className="login-form">
                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}
                        
                        <div className="form-group">
                            <label htmlFor="resetEmail">Email Address</label>
                            <input
                                type="email"
                                id="resetEmail"
                                name="email"
                                value={resetPasswordData.email}
                                onChange={handleResetPasswordChange}
                                required
                                placeholder="Enter your email address"
                                disabled={loading || showCodeVerification}
                            />
                        </div>

                        {showCodeVerification && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="resetCode">Verification Code</label>
                                    <input
                                        type="text"
                                        id="resetCode"
                                        name="code"
                                        value={resetPasswordData.code}
                                        onChange={handleResetPasswordChange}
                                        required
                                        placeholder="Enter verification code from email"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="newPassword">New Password</label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            name="newPassword"
                                            value={resetPasswordData.newPassword}
                                            onChange={handleResetPasswordChange}
                                            required
                                            placeholder="Enter new password"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="confirmNewPassword">Confirm Password</label>
                                        <input
                                            type="password"
                                            id="confirmNewPassword"
                                            name="confirmPassword"
                                            value={resetPasswordData.confirmPassword}
                                            onChange={handleResetPasswordChange}
                                            required
                                            placeholder="Confirm new password"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="form-actions">
                            <button 
                                type="submit" 
                                className="login-btn"
                                disabled={loading}
                            >
                                {loading 
                                    ? 'Processing...' 
                                    : showCodeVerification 
                                        ? 'Reset Password' 
                                        : 'Send Reset Code'
                                }
                            </button>
                            <button 
                                type="button"
                                className="cancel-btn"
                                onClick={() => {
                                    setShowResetPassword(false);
                                    setShowCodeVerification(false);
                                    setError('');
                                    setSuccess('');
                                }}
                                disabled={loading}
                            >
                                Back to Login
                            </button>
                        </div>
                    </form>
                ) : shouldShowCreateAccount ? (
                    // Create Account Form
                    <form onSubmit={handleCreateAccount} className="login-form">
                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName">First Name *</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={createAccountData.firstName}
                                    onChange={handleCreateAccountChange}
                                    required
                                    placeholder="First name"
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="lastName">Last Name *</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={createAccountData.lastName}
                                    onChange={handleCreateAccountChange}
                                    required
                                    placeholder="Last name"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="createEmail">Email Address *</label>
                            <input
                                type="email"
                                id="createEmail"
                                name="email"
                                value={createAccountData.email}
                                onChange={handleCreateAccountChange}
                                required
                                placeholder="Enter email address"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="department">Department *</label>
                            <input
                                type="text"
                                id="department"
                                name="department"
                                value={createAccountData.department}
                                onChange={handleCreateAccountChange}
                                required
                                placeholder="Enter department"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="role">Role *</label>
                            <select
                                id="role"
                                name="role"
                                value={createAccountData.role}
                                onChange={handleCreateAccountChange}
                                required
                                disabled={loading}
                            >
                                <option value="faculty">Faculty</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="password">Password *</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={createAccountData.password}
                                    onChange={handleCreateAccountChange}
                                    required
                                    placeholder="Enter password (min. 8 characters)"
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password *</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={createAccountData.confirmPassword}
                                    onChange={handleCreateAccountChange}
                                    required
                                    placeholder="Confirm password"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button 
                                type="submit" 
                                className="login-btn"
                                disabled={loading}
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                            <button 
                                type="button"
                                className="cancel-btn"
                                onClick={() => {
                                    setShowCreateAccount(false);
                                    setError('');
                                    setSuccess('');
                                }}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    // Login Form
                    <form onSubmit={handleSubmit} className="login-form">
                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}
                        
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder={isAdminMode ? "Enter admin email" : "Enter your email"}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Enter your password"
                                disabled={loading}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="login-btn"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : isAdminMode ? 'Admin Sign In' : 'Sign In'}
                        </button>

                        <div className="divider">
                            <span>OR</span>
                        </div>

                        <button 
                            type="button" 
                            className="google-signin-btn"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                        >
                            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Sign in with Google
                        </button>

                        <div className="forgot-password-link">
                            <button 
                                type="button"
                                className="text-link"
                                onClick={() => setShowResetPassword(true)}
                            >
                                Forgot your password?
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;