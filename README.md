# Faculty E-Portfolio System

## Security Setup

This repo **does not** ship with hardcoded/demo login credentials or API keys.
Each collaborator must set up their own environment variables.

## Backend Setup

### 1) Create `backend/.env` locally (do not commit)

Copy `backend/.env.example` to `backend/.env` and fill in your values:

Required:
- `MONGODB_URI` = your MongoDB Atlas connection string
- `JWT_SECRET` = random strong secret (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `GOOGLE_CLIENT_ID` = your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` = your Google OAuth client secret
- `RECAPTCHA_SECRET_KEY` = your reCAPTCHA secret key
- `ENCRYPTION_KEY` = random encryption key (generate same way as JWT_SECRET)

Optional:
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_ADMIN_FIRST_NAME`
- `SEED_ADMIN_LAST_NAME`
- `SEED_ADMIN_DEPARTMENT`
- SMTP configuration for email notifications

### 2) Seed the admin into the database

From `backend/`:

```bash
npm run seed:admin
```

This will **create or update** the admin account in the DB and ensure its `role` is `admin`.

## Frontend Setup

### 1) Create `frontend/.env` locally (do not commit)

Copy `frontend/.env.example` to `frontend/.env` and fill in your values:

Required:
- `VITE_RECAPTCHA_SITE_KEY` = your reCAPTCHA site key

### 2) Install dependencies and run

```bash
npm install
npm run dev
```

## Collaborator Notes

- **Never commit `.env` files** - they contain sensitive information
- **Always use `.env.example` files** to document required environment variables
- **Each collaborator should generate their own keys** for security
- **Use the test reCAPTCHA keys only for local development**

## reCAPTCHA Troubleshooting

If you encounter a "Invalid key type" error when using reCAPTCHA:

1. **Ensure your keys are properly registered** with Google reCAPTCHA admin console
2. **Check domain restrictions** - make sure `localhost:3000` and your production domain are added to your reCAPTCHA settings
3. **Verify key compatibility** - ensure you're using reCAPTCHA v2 invisible keys
4. **Development mode** - reCAPTCHA validation is automatically skipped in development mode to avoid rate limiting issues

### Using Test Keys

For local development, you can use Google's test keys which always pass validation:
- Site key: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- Secret key: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

⚠️ **Warning**: These test keys should never be used in production.

### Production Keys

For production, register your site at [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin) and ensure your domain is properly configured.

## Available Admin Routes

After successful login, admin routes are available at:
- `/admin-dashboard`
- `/admin-faculty-management`
- `/admin-archived-users`
- `/admin-course-management`
- `/admin-class-assignments`
- `/admin-reports`
- `/admin-system-analytics`
- `/admin-system-settings`

