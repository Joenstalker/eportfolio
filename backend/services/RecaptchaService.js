const axios = require('axios');

class RecaptchaService {
  constructor() {
    this.secretKey = process.env.RECAPTCHA_SECRET_KEY;
    this.siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
    this.verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
  }

  // Verify reCAPTCHA response
  async verifyRecaptcha(responseToken, remoteIp = null) {
    try {
      if (!this.secretKey || !responseToken) {
        return {
          success: false,
          error: 'Missing reCAPTCHA configuration or response token'
        };
      }

      const params = new URLSearchParams();
      params.append('secret', this.secretKey);
      params.append('response', responseToken);
      
      if (remoteIp) {
        params.append('remoteip', remoteIp);
      }

      const response = await axios.post(this.verifyUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000 // 10 second timeout
      });

      const { data } = response;

      // Enhanced validation
      if (!data.success) {
        return {
          success: false,
          error: data['error-codes'] ? data['error-codes'][0] : 'Verification failed'
        };
      }

      // Additional security checks
      const securityChecks = this.performSecurityChecks(data);
      
      if (!securityChecks.passed) {
        return {
          success: false,
          error: `Security check failed: ${securityChecks.reason}`
        };
      }

      return {
        success: true,
        score: data.score || 0,
        action: data.action || 'unknown',
        challenge_ts: data.challenge_ts,
        hostname: data.hostname
      };

    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      
      return {
        success: false,
        error: 'Verification service unavailable'
      };
    }
  }

  // Perform additional security checks
  performSecurityChecks(recaptchaData) {
    const checks = {
      passed: true,
      reason: ''
    };

    // Check if response is too old (more than 2 minutes)
    if (recaptchaData.challenge_ts) {
      const challengeTime = new Date(recaptchaData.challenge_ts);
      const currentTime = new Date();
      const timeDiff = (currentTime - challengeTime) / 1000; // in seconds
      
      if (timeDiff > 120) {
        checks.passed = false;
        checks.reason = 'Response expired';
        return checks;
      }
    }

    // Check hostname if provided
    if (process.env.NODE_ENV === 'production' && recaptchaData.hostname) {
      const allowedHostnames = [
        'localhost',
        '127.0.0.1',
        process.env.FRONTEND_URL?.replace('http://', '').replace('https://', '')
      ].filter(Boolean);

      if (!allowedHostnames.includes(recaptchaData.hostname)) {
        checks.passed = false;
        checks.reason = 'Hostname mismatch';
        return checks;
      }
    }

    // Score-based validation (for v3)
    if (recaptchaData.score !== undefined) {
      const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE) || 0.5;
      
      if (recaptchaData.score < minScore) {
        checks.passed = false;
        checks.reason = `Score too low: ${recaptchaData.score} (minimum: ${minScore})`;
        return checks;
      }
    }

    return checks;
  }

  // Adaptive reCAPTCHA scoring
  getAdaptiveThreshold(userRiskLevel = 'normal') {
    const thresholds = {
      low: 0.3,
      normal: 0.5,
      high: 0.7,
      critical: 0.9
    };
    
    return thresholds[userRiskLevel] || thresholds.normal;
  }

  // Generate reCAPTCHA widget HTML
  generateWidget(action = 'submit') {
    return `
      <script src="https://www.google.com/recaptcha/api.js?render=${this.siteKey}"></script>
      <script>
        grecaptcha.ready(function() {
          grecaptcha.execute('${this.siteKey}', {action: '${action}'}).then(function(token) {
            document.getElementById('recaptcha-token').value = token;
          });
        });
      </script>
      <input type="hidden" id="recaptcha-token" name="recaptchaToken" />
    `;
  }

  // Client-side integration helper
  getClientScript() {
    return `
      <script>
        class RecaptchaManager {
          constructor(siteKey) {
            this.siteKey = siteKey;
            this.token = null;
          }
          
          async executeAction(action = 'submit') {
            try {
              this.token = await grecaptcha.execute(this.siteKey, { action });
              return this.token;
            } catch (error) {
              console.error('reCAPTCHA execution failed:', error);
              return null;
            }
          }
          
          getToken() {
            return this.token;
          }
          
          reset() {
            this.token = null;
          }
        }
        
        // Initialize reCAPTCHA manager
        window.recaptchaManager = new RecaptchaManager('${this.siteKey}');
      </script>
    `;
  }

  // Validate reCAPTCHA configuration
  validateConfiguration() {
    const issues = [];
    
    if (!this.secretKey) {
      issues.push('RECAPTCHA_SECRET_KEY is not configured');
    }
    
    if (!this.siteKey) {
      issues.push('REACT_APP_RECAPTCHA_SITE_KEY is not configured');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  // Mock verification for development/testing
  mockVerify(success = true, score = 0.9) {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return Promise.resolve({
        success,
        score,
        action: 'test',
        challenge_ts: new Date().toISOString(),
        hostname: 'localhost'
      });
    }
    
    return Promise.reject(new Error('Mock verification not allowed in production'));
  }
}

module.exports = new RecaptchaService();