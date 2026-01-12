# User Signup/Auth Endpoint - Testing Guide

## Problem Solved
Previously, there was no user registration endpoint in the backend. New users couldn't sign up because there was no API route to handle user creation.

## Solution
Created a new authentication route file (`backend/src/routes/auth.js`) with user signup, login, and profile endpoints.

## New API Endpoints

### 1. User Signup
**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securePassword123",
  "confirmPassword": "securePassword123"
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "verified": false
  }
}
```

**Error Responses:**
- Missing fields: `400 All fields are required`
- Passwords don't match: `400 Passwords do not match`
- Password too short: `400 Password must be at least 6 characters`
- Email/username taken: `409 Email already registered` or `409 Username already taken`

---

### 2. User Login
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "verified": false,
    "coins": 0
  }
}
```

---

### 3. Get Current User
**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "verified": false,
    "coins": 0,
    "banned": false
  }
}
```

---

## Testing with cURL

### Test Signup:
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Test Login:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## Features Implemented

✅ User registration with email validation
✅ Username uniqueness check
✅ Password hashing with bcryptjs (10 salt rounds)
✅ Password confirmation validation
✅ JWT token generation
✅ User login with password verification
✅ User profile retrieval with token authentication
✅ Account ban status checking
✅ Comprehensive error handling
✅ Logging for debugging

---

## Files Modified

1. **Created:** `backend/src/routes/auth.js`
   - New authentication routes
   
2. **Updated:** `backend/src/server.js`
   - Added auth route import
   - Registered `/api/auth` route

---

## Database Schema
Uses existing `User` model from Prisma schema:
```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  username  String   @unique
  password  String
  verified  Boolean  @default(false)
  banned    Boolean  @default(false)
  coins     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Next Steps (Optional)

1. **Email verification:** Send confirmation emails
2. **Password reset:** Add forgot password functionality
3. **Profile update:** Allow users to update their profile
4. **2FA:** Implement two-factor authentication
5. **Frontend integration:** Create signup/login UI components
