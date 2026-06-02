<div align="center">

# 🚀 NestJS Sequelize Starter

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![NestJS](https://img.shields.io/badge/NestJS-v10-red.svg)](https://nestjs.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-v6-blue.svg)](https://sequelize.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-blue.svg)](https://www.typescriptlang.org/)

**A production-ready NestJS boilerplate with Sequelize ORM, email service, and complete user authentication system.**

*Jumpstart your backend development with pre-configured modules for building robust APIs.*

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-table-of-contents) • [API Endpoints](#-api-endpoints)

</div>

---

## ✨ Features

- **🚀 NestJS Framework** - Progressive Node.js framework for efficient server-side applications
- **🗄️ Sequelize ORM** - Full-featured ORM with PostgreSQL, MySQL, MariaDB, SQLite, and MSSQL support
- **🔐 Multiple Authentication Methods**
  - JWT-based authentication
  - Google OAuth 2.0 integration
  - **OTP (One-Time Password) login** - Passwordless authentication via email
- **📧 Email Service** - Professional SMTP email service with HTML templates
  - Login notifications with IP tracking
  - OTP delivery with styled templates
  - Async email sending
- **👤 User Management** - Complete user model with UUID primary keys
- **⚡ TypeScript** - Full TypeScript support for enhanced developer experience
- **🔧 Database Migrations** - Sequelize CLI integration for schema management
- **📝 Validation** - Built-in request validation with class-validator
- **🌐 Environment Configuration** - Dotenv-based configuration management
- **🛡️ Security** - JWT tokens, secure headers, and OTP expiration

---

## 📋 Table of Contents

<details>
<summary>Click to expand</summary>

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [⚙️ Configuration](#️-configuration)
  - [Google OAuth Setup](#getting-google-oauth-credentials)
  - [Gmail SMTP Setup](#gmail-smtp-setup)
- [🗄️ Database Setup](#️-database-setup)
- [🔐 Authentication](#-authentication)
- [📡 API Endpoints](#-api-endpoints)
- [📧 Email Templates](#-email-templates)
- [📁 Project Structure](#-project-structure)
- [🛠️ Development](#️-development)
- [🚀 Deployment](#-deployment)
- [🧪 Testing](#-testing)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)

</details>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Database**: PostgreSQL, MySQL, MariaDB, SQLite, or MSSQL
- **Git**

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/sofiatechnology/nestjs-sequelize-starter.git
cd nestjs-sequelize-starter
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env-example .env
```

4. **Configure your `.env` file** (see [Configuration](#-configuration))

5. **Run database migrations** (in development):
```bash
npm run start:dev
# Sequelize will auto-sync the schema in development mode
```

6. **Start the application:**
```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

---

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432                    # 5432 for PostgreSQL, 3306 for MySQL
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=nestjs_sequelize_starter

# Application Configuration
NODE_ENV=development            # development | production | test
PORT=3000
APP_NAME=EXETAT Test
APP_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com        # or your SMTP provider
SMTP_PORT=587
SMTP_SECURE=false               # true for port 465, false for other ports
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password     # Use app-specific password for Gmail
SMTP_FROM=noreply@yourapp.com
```

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

### Gmail SMTP Setup

For Gmail, you need to use an **App Password**:

1. Enable 2-Factor Authentication on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Use this password in `SMTP_PASS`

---

## 🗄️ Database Setup

### Supported Databases

This starter supports multiple databases through Sequelize:
- PostgreSQL (recommended)
- MySQL
- MariaDB
- SQLite
- Microsoft SQL Server

### Database Migration

In **development**, Sequelize will automatically sync your models:

```typescript
// Database auto-syncs on startup in development
await sequelize.sync({ alter: true });
```

For **production**, create proper migrations:

```sql
-- Add OTP columns to users table
ALTER TABLE users 
ADD COLUMN otp VARCHAR(255) NULL,
ADD COLUMN otpExpiry TIMESTAMP NULL;
```

### Database Schema

**Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  googleId VARCHAR(255) NULL,
  otp VARCHAR(255) NULL,
  otpExpiry TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔐 Authentication

This starter provides **three authentication methods**:

### 1. Google OAuth 2.0

**Flow:**
1. User clicks "Login with Google"
2. Redirects to Google consent screen
3. Google redirects back with user info
4. Server creates/finds user and returns JWT token

**Endpoints:**
- `GET /auth/google` - Initiates Google OAuth flow
- `GET /auth/google/callback` - Google callback handler

### 2. OTP (One-Time Password) Login

**Flow:**
1. User requests OTP with email
2. System validates email exists (returns 404 if not)
3. 6-digit OTP sent via email (valid for 10 minutes)
4. User submits OTP
5. System validates and returns JWT token

**Endpoints:**
- `POST /auth/otp/send` - Request OTP
- `POST /auth/otp/verify` - Verify OTP and login

### 3. JWT Token Authentication

All authenticated endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 📡 API Endpoints

### Authentication Endpoints

#### 🔹 Google OAuth Login

```http
GET /auth/google
```

**Description:** Initiates Google OAuth flow. Redirects to Google consent screen.

<br>

#### 🔹 Google OAuth Callback

```http
GET /auth/google/callback
```

**Description:** Handles Google OAuth callback. Returns JWT token and user info.

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

<br>

#### 🔹 Request OTP

```http
POST /auth/otp/send
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "OTP sent successfully"
}
```

**Error Response (404):**
```json
{
  "statusCode": 404,
  "message": "Email not found"
}
```

<br>

#### 🔹 Verify OTP

```http
POST /auth/otp/verify
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses:**
- `404` - Email not found
- `401` - Invalid OTP
- `401` - OTP expired (10 minutes)
- `401` - No OTP found (request new one)

<br>

#### 🔹 Get User Profile

```http
GET /auth/profile
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe"
}
```

---

## 📧 Email Templates

The starter includes professional HTML email templates:

### 1. OTP Email Template
- Clean, modern design
- Large, easy-to-read OTP code
- 10-minute expiration warning
- Mobile-responsive

### 2. Login Notification Email
- IP address tracking -> region Drc, Goma
- Timestamp of login
- Security alert styling
- Links to account security

### Customizing Email Templates

Email templates are located in `src/email/email.service.ts`:

```typescript
private getOTPTemplate(name: string, appName: string, otp: string, appUrl: string): string {
  // Customize HTML template here
}
```

---

## 📁 Project Structure

```
nestjs-sequelize-starter/
├── src/
│   ├── auth/                      # Authentication module
│   │   ├── guards/                # Auth guards (JWT, Google)
│   │   ├── auth.controller.ts     # Auth endpoints
│   │   ├── auth.service.ts        # Auth business logic
│   │   ├── auth.module.ts         # Auth module definition
│   │   ├── jwt.strategy.ts        # JWT strategy
│   │   └── google.strategy.ts     # Google OAuth strategy
│   ├── email/                     # Email service module
│   │   ├── email.service.ts       # Email sending & templates
│   │   └── email.module.ts        # Email module definition
│   ├── models/                    # Database models
│   │   └── user.model.ts          # User model (Sequelize)
│   ├── app.module.ts              # Root application module
│   └── main.ts                    # Application entry point
├── .env-example                   # Environment variables template
├── .gitignore                     # Git ignore rules
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # This file
```

---

## 🛠️ Development

### Available Scripts

```bash
# Development mode with hot reload
npm run start:dev

# Production build
npm run build

# Production mode
npm run start:prod

# Run tests
npm run test

# Run e2e tests
npm run test:e2e

# Test coverage
npm run test:cov

# Lint code
npm run lint

# Format code
npm run format

# Load Techniques Sociales test data
npm run seed:techniques-sociales
```

### Seed Test Data

To load ready-made test data for the `TECHNIQUES SOCIALES` section, including:

- `CULTURE GENERALE`
- `SCIENCES`
- `LANGUES`
- `COURS D'OPTIONS`

with multiple year blocks and many questions, run:

```bash
npm run seed:techniques-sociales
```

What this seed does:

- ensures the year blocks exist
- removes older seed rows created by the test seed
- inserts fresh test questions for the 4 branches
- for `LANGUES`, creates separate passage groups per year:
  - `francais` passage with its own related questions
  - `anglais` passage with its own related questions

Seed files:

- [scripts/seed-techniques-sociales.sh](/home/birusha/Documents/work/exetat/exetat-mastery-api/scripts/seed-techniques-sociales.sh)
- [scripts/seed-techniques-sociales.sql](/home/birusha/Documents/work/exetat/exetat-mastery-api/scripts/seed-techniques-sociales.sql)

### Adding New Features

1. **Create a new module:**
```bash
nest generate module feature-name
nest generate controller feature-name
nest generate service feature-name
```

2. **Create database model:**
```typescript
// src/models/feature.model.ts
import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'features' })
export class Feature extends Model {
  @Column({ type: DataType.UUID, primaryKey: true })
  id: string;
  
  // Add your columns here
}
```

3. **Register model in module:**
```typescript
import { SequelizeModule } from '@nestjs/sequelize';
import { Feature } from '../models/feature.model';

@Module({
  imports: [SequelizeModule.forFeature([Feature])],
  // ...
})
```

---

## 🚀 Deployment

### Environment Variables

Ensure all production environment variables are set:
- Use strong `JWT_SECRET` (minimum 32 characters)
- Set `NODE_ENV=production`
- Use production database credentials
- Configure production `APP_URL`

### Database Migration

Run migrations before deploying:
```sql
-- Production migration script
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS otp VARCHAR(255),
ADD COLUMN IF NOT EXISTS otpExpiry TIMESTAMP;
```

### Deployment Platforms

**Recommended platforms:**
- [Heroku](https://www.heroku.com/) - Easy deployment with PostgreSQL addon
- [Railway](https://railway.app/) - Modern platform with automatic deployments
- [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)
- [AWS Elastic Beanstalk](https://aws.amazon.com/elasticbeanstalk/)
- [Google Cloud Run](https://cloud.google.com/run)

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

---

## 🧪 Testing

### Testing OTP Flow

```bash
# 1. Request OTP
curl -X POST http://localhost:3000/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# 2. Check email for OTP code

# 3. Verify OTP
curl -X POST http://localhost:3000/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "otp": "123456"}'

# 4. Use JWT token
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - The progressive Node.js framework
- [Sequelize](https://sequelize.org/) - Promise-based ORM for Node.js
- [Passport](http://www.passportjs.org/) - Authentication middleware

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/sofiatechnology/nestjs-sequelize-starter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sofiatechnology/nestjs-sequelize-starter/discussions)

---

**Built with ❤️ using NestJS and TypeScript**
