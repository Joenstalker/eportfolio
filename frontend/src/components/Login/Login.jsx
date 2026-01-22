import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import ReCAPTCHA from 'react-google-recaptcha';
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
    const [recaptchaValue, setRecaptchaValue] = useState(null);
    
    const { loginUser, user, isAuthenticated, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();

    // Logout any existing user when component mounts
    useEffect(() => {
        // Check if we should auto-logout (like when coming from logout)
        const urlParams = new URLSearchParams(window.location.search);
        const logoutParam = urlParams.get('logout');
        
        if (logoutParam === 'true') {
            console.log('🔓 Auto-logout triggered');
            handleAutoLogout();
        }
        
        // Check for Google auth errors
        const errorParam = urlParams.get('error');
        if (errorParam === 'unauthorized_email') {
            setError('Your email is not authorized. Please contact the administrator to add your email to the system before signing in with Google.');
        } else if (errorParam === 'account_inactive') {
            setError('Your account is inactive. Please contact the administrator to reactivate your account.');
        }
    }, []);

    // Redirect if already logged in
    useEffect(() => {
        if (user && isAuthenticated) {
            console.log('🔄 User already authenticated, redirecting...');
            console.log('🎭 Current user role:', user.role);
            
            const role = typeof user.role === 'string' ? user.role.toLowerCase() : user.role;
            if (role === 'admin') {
                navigate('/admin-dashboard');
            } else {
                navigate('/dashboard');
            }
        }
    }, [user, isAuthenticated, navigate]);

    const handleAutoLogout = async () => {
        try {
            await logoutUser();
            setSuccess('You have been logged out successfully.');
        } catch (error) {
            console.error('Auto-logout error:', error);
        }
    };

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

        // In development, we can skip reCAPTCHA validation to avoid rate limiting issues
        // but we'll still pass the token if it exists
        if (process.env.NODE_ENV !== 'development') {
            if (!recaptchaValue) {
                setError('Please complete the reCAPTCHA verification');
                setLoading(false);
                return;
            }
        } else {
            console.log('📝 Development mode: reCAPTCHA validation skipped');
        }

        console.log('🚀 Login form submitted');
        console.log('📧 Email:', formData.email);
        // Admin vs Faculty is determined by the user's role from the backend/JWT.

        try {
            // Call login with reCAPTCHA token through AuthContext
            const data = await loginUser(formData.email, formData.password, recaptchaValue);
            
            console.log('✅ Login successful in component');
            console.log('👤 Response user object:', data.user);
            console.log('🎭 User role from response:', data.user?.role);
            console.log('🔑 Raw token from response:', data.token ? 'present' : 'missing');
            
            // Prefer role from JWT payload if available, fallback to response.user.role
            const getRoleFromToken = (jwtToken) => {
                try {
                    if (!jwtToken || typeof jwtToken !== 'string') return null;
                    const [, payload] = jwtToken.split('.');
                    if (!payload) return null;
                    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
                    return typeof json.role === 'string' ? json.role.toLowerCase() : null;
                } catch {
                    return null;
                }
            };

            const roleFromJwt = getRoleFromToken(data.token);

            // Check if user role exists
            if (!data.user || (!data.user.role && !roleFromJwt)) {
                console.error('❌ No role found in response');
                setError('User role not found. Please contact administrator.');
                return;
            }
            
            // Determine redirect based on role
            const userRole = (roleFromJwt || data.user.role).toLowerCase();
            
            if (userRole === 'admin') {
                console.log('🎯 Redirecting to admin dashboard');
                navigate('/admin-dashboard');
            } else if (userRole === 'faculty') {
                console.log('🎯 Redirecting to faculty dashboard');
                navigate('/dashboard');
            } else {
                console.warn('⚠️ Unknown role, defaulting to faculty dashboard');
                navigate('/dashboard');
            }
            
        } catch (err) {
            console.error('❌ Login error in component:', err);
            
            // Enhanced error messages
            if (err.message.includes('network') || err.message.includes('Failed to fetch')) {
                setError('Cannot connect to server. Please check if the backend is running.');
            } else if (err.message.includes('Invalid credentials')) {
                setError('Invalid email or password. Please try again.');
            } else if (err.message.includes('admin')) {
                setError('Admin access required. Please use an admin account or contact administrator.');
            } else if (err.message.includes('reCAPTCHA')) {
                setError('reCAPTCHA verification failed. Please try again.');
            } else {
                setError(err.message || 'Login failed. Please check your credentials.');
            }
        } finally {
            setLoading(false);
            // Reset reCAPTCHA after submission
            setRecaptchaValue(null);
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
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/register`, {
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
        window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/google`;
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/forgot-password`, {
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
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/reset-password`, {
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

    const shouldShowCreateAccount = showCreateAccount;

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
                                : 'Sign in to your account'
                        }
                    </p>
                </div>

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
                                placeholder="Enter your email"
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

                        {/* reCAPTCHA Widget */}
                        <div className="form-group recaptcha-container">
                            <ReCAPTCHA
                                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                                onChange={(value) => setRecaptchaValue(value)}
                                onExpired={() => setRecaptchaValue(null)}
                                onErrored={() => setRecaptchaValue(null)}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="login-btn"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
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
                
                {/* Debug Instructions */}
                <div className="debug-instructions">
                    
                </div>
            </div>
        </div>
    );
};

export default Login;