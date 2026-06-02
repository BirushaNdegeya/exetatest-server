Read `AGENTS.md` first and follow it strictly.

### Authentication Flow
1. User requests OTP via email → system generates 6-digit code, stores it, sends via email
2. User submits OTP → system verifies, returns access + refresh tokens
3. **First-time users** are identified via `hasSelectedSections` flag in user profile
4. **Returning users** refresh tokens silently via refresh token endpoint

### OTP Management
- OTP expires after **10 minutes**
- OTP is **single-use** (deleted or marked used after verification)
- Expired/unused OTPs automatically deleted via **scheduled cron job** (prevents database bloat)
- Rate limiting: Max **3 OTP requests per email per 10 minutes**

### Token Strategy
- **Access Token**: JWT, short-lived (15 minutes), contains `userId`, `email`
- **Refresh Token**: JWT or random string, long-lived (30 days), stored in database (hashed)
- **Refresh token rotation** (optional but recommended): Issue new refresh token on each refresh, invalidate the old one
- Offline-first support: Refresh tokens must remain valid even if user doesn't connect frequently (up to 30 days)