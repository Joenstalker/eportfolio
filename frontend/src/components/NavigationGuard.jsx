import React from 'react';
import Swal from 'sweetalert2';
import { validateProfileCompletion, validateAllPortfolios, checkNavigationPermission } from '../utils/validation';

/**
 * Higher-order component for navigation protection
 * Prevents navigation when required fields are incomplete
 */
const withNavigationGuard = (WrappedComponent, getValidationData, targetPath) => {
    return (props) => {
        const handleNavigationAttempt = (e) => {
            const validationData = getValidationData();
            const validation = validateProfileCompletion(validationData.user) || 
                           validateAllPortfolios(validationData);

            const permission = checkNavigationPermission(validation, targetPath);

            if (!permission.canNavigate) {
                e.preventDefault();
                Swal.fire({
                    title: 'Incomplete Profile!',
                    html: `
                        <div style="text-align: left; line-height: 1.6;">
                            <p><strong>⚠️ Navigation Blocked</strong></p>
                            <p>${permission.warningMessage}</p>
                            <p><em>${permission.suggestion}</em></p>
                            <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                                <strong>Missing:</strong> ${validation.missingFields ? validation.missingFields.join(', ') : 'Required fields'}
                            </div>
                        </div>
                    `,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#e74c3c',
                    cancelButtonColor: '#95a5a6',
                    confirmButtonText: 'Complete Profile Now',
                    cancelButtonText: 'Stay Here'
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Navigate to profile completion
                        window.location.href = '/profile-dashboard';
                    }
                });
            }
        };

        // Intercept navigation attempts
        React.useEffect(() => {
            const handleLinkClick = (e) => {
                const target = e.target.closest('a');
                if (target && target.href && target.href !== window.location.href) {
                    handleNavigationAttempt(e);
                }
            };

            const handleButtonClick = (e) => {
                const target = e.target.closest('button');
                if (target && target.onclick && !target.classList.contains('navigation-allowed')) {
                    handleNavigationAttempt(e);
                }
            };

            document.addEventListener('click', handleLinkClick);
            document.addEventListener('click', handleButtonClick);

            return () => {
                document.removeEventListener('click', handleLinkClick);
                document.removeEventListener('click', handleButtonClick);
            };
        }, []);

        return <WrappedComponent {...props} />;
    };
};

export default withNavigationGuard;
