# Prompt: Offline-First Authentication with Email + OTP in Expo Router

## Context
I need to implement a complete authentication system in a React Native Expo app using Expo Router, following an **offline-first philosophy** similar to YouTube's mobile app authentication.

## Core Requirements

### Authentication Flow
1. User enters email → receives OTP via email
2. User enters OTP → authentication succeeds
3. **First-time users**: Immediately redirect to "Select your sections" screen
4. **Returning users**: Redirect directly to main dashboard
5. Session lasts **1 month** without re-authentication
6. When device comes online, tokens refresh **silently** (no user interaction)

### Offline-First Behavior
- User can access their last authenticated session even without internet
- All auth state persists locally (tokens, user info, first-login flag)
- Offline queuing: Any actions during offline sync when connection returns

### OTP Management
- OTP expires after X minutes (e.g., 10-15 min)
- Expired/unused OTPs automatically deleted via cron job (no unnecessary data storage)

## Technical Stack
- **Framework**: Expo SDK 50+ with Expo Router (file-based routing)
- **Storage**: `expo-secure-store` for tokens, `AsyncStorage` for flags
- **Network**: `react-native-netinfo` to detect online/offline status
- **Background tasks**: `expo-background-fetch` or app focus listeners for token refresh

## Backend Assumptions (Provide implementation structure)
- REST API endpoints:
  - `POST /auth/request-otp` → sends OTP to email
  - `POST /auth/verify-otp` → verifies OTP, returns `{ accessToken, refreshToken, user: { id, email, isFirstLogin, hasSelectedSections } }`
  - `POST /auth/refresh` → accepts refresh token, returns new access token
  - `GET /user/profile` → returns user data including `hasSelectedSections`
  - `PUT /user/sections` → saves selected sections (marks `hasSelectedSections: true`)
- Refresh token expiration: 30 days
- Access token expiration: 15 minutes
- OTP cleanup cron: Deletes expired/unused OTPs every hour