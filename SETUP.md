# Admin Panel Setup Guide

## Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn
- MongoDB (local or Atlas)

### 1. Install All Dependencies

```bash
npm run setup
```

This command installs dependencies for the root, frontend, and backend.

### 2. Environment Configuration

**Backend (.env)**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/flinxx-admin
JWT_SECRET=your-super-secret-key
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env)**
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```
VITE_API_URL=http://localhost:3001/api
```

### 3. Start Development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- API: http://localhost:3001/api

## Architecture

### Frontend Structure
```
src/
├── components/
│   ├── Sidebar.jsx       # Navigation sidebar
│   ├── Header.jsx        # Top header
│   ├── StatCard.jsx      # Statistics card
│   └── Modal.jsx         # Reusable modal
├── pages/
│   ├── Dashboard.jsx
│   ├── UserManagement.jsx
│   ├── ReportsHandling.jsx
│   ├── LiveSessions.jsx
│   ├── MatchmakingControls.jsx
│   ├── PaymentsSubscriptions.jsx
│   ├── ContentModeration.jsx
│   ├── ChatLogs.jsx
│   ├── Settings.jsx
│   ├── AdminRoles.jsx
│   ├── SecurityLogs.jsx
│   └── Login.jsx
├── layouts/
│   └── Layout.jsx
├── services/
│   └── api.js           # Axios instance
└── App.jsx
```

### Backend Structure
```
src/
├── routes/
│   ├── admin.js        # Authentication
│   ├── dashboard.js    # Dashboard stats
│   ├── users.js        # User management
│   ├── reports.js      # Report handling
│   └── settings.js     # Settings
├── middleware/
│   └── errorHandler.js
├── config/
│   └── database.js     # MongoDB connection
└── server.js
```

## Key Features Implementation

### 1. Authentication
- Login with email/password
- JWT token storage
- Automatic token attachment to API calls
- Token validation and refresh

### 2. Dashboard
- Real-time user statistics
- Activity charts (Line chart)
- Revenue tracking (Bar chart)
- User distribution (Pie chart)
- Recent activity feed

### 3. User Management
- Search users by ID, email, username
- View user profiles
- Ban/Unban users
- Send warnings
- Reset coins/balance
- View user history

### 4. Reports System
- List all reports
- View evidence (screenshots)
- Apply actions (warn, ban, close)
- Filter by status and reason

### 5. Live Sessions
- Monitor active video chats
- View connected users
- Track session duration
- Force disconnect option

### 6. Content Moderation
- AI nudity detection toggle
- Auto-ban settings
- Screenshot gallery
- Approval/rejection workflow

### 7. Admin Controls
- Role-based access (Super Admin, Moderator, Finance)
- Permission management
- Activity logging
- Admin management interface

## API Documentation

### Authentication
```javascript
POST /api/admin/login
Body: { email: string, password: string }
Response: { token: string, admin: object }
```

### Dashboard
```javascript
GET /api/admin/dashboard
Response: { stats: object, userActivity: array, revenueData: array }
```

### Users
```javascript
GET /api/admin/users?search=query
POST /api/admin/users/:userId/ban
POST /api/admin/users/:userId/unban
POST /api/admin/users/:userId/warn
POST /api/admin/users/:userId/reset-coins
```

## Database Schema (MongoDB)

### Admin Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: String, // 'Super Admin', 'Moderator', 'Finance'
  permissions: [String],
  createdAt: Date,
  lastLogin: Date
}
```

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  status: String, // 'active', 'banned', 'suspended'
  coins: Number,
  createdAt: Date,
  lastLogin: Date,
  deviceBans: [String],
  warnings: Number,
  reportHistory: [ObjectId]
}
```

### Reports Collection
```javascript
{
  _id: ObjectId,
  reportedUserId: ObjectId,
  reporterUserId: ObjectId,
  reason: String,
  description: String,
  evidence: [String], // URLs to screenshots
  status: String, // 'pending', 'investigated', 'closed'
  action: String, // 'warning', 'ban', 'none'
  createdAt: Date,
  resolvedAt: Date
}
```

## Customization Guide

### Add New Admin Page

1. Create page component in `frontend/src/pages/NewPage.jsx`
2. Add route in `frontend/src/App.jsx`
3. Add menu item in `frontend/src/components/Sidebar.jsx`
4. Create backend route in `backend/src/routes/newpage.js`
5. Add route to server.js

### Styling
- Using Tailwind CSS utility classes
- Dark theme with custom dark color palette
- Purple accent color (#9333ea)
- Responsive design (mobile-first)

### Adding Charts
- Using Recharts library
- Examples in Dashboard.jsx
- Supports: Line, Bar, Pie, Area charts

## Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy dist folder to Vercel
```

### Backend (Render/Heroku)
```bash
cd backend
npm run build
# Deploy to Render/Heroku
```

### Environment Variables
Set in deployment platform:
- Backend: PORT, MONGODB_URI, JWT_SECRET, FRONTEND_URL
- Frontend: VITE_API_URL

## Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env or:
lsof -i :3001  # Find process
kill -9 <PID>
```

### MongoDB Connection Error
- Ensure MongoDB is running locally or MongoDB URI is correct
- Check network access if using MongoDB Atlas

### CORS Error
- Verify FRONTEND_URL in backend .env
- Check VITE_API_URL in frontend .env

### JWT Issues
- Ensure JWT_SECRET is consistent
- Check token expiration in login route

## Performance Optimization

1. Code splitting: React Router lazy loading
2. Image optimization: Use WebP format
3. API caching: React Query implementation
4. Database indexing: Add indexes to frequently queried fields
5. Minification: Production builds

## Security Best Practices

1. Never commit .env files
2. Use strong JWT_SECRET
3. Implement rate limiting
4. Validate all inputs server-side
5. Use HTTPS in production
6. Regular security audits
7. Keep dependencies updated

## Support & Documentation

- GitHub: [flinxx/admin-panel](https://github.com/flinxx/admin-panel)
- Issues: Report bugs on GitHub Issues
- Email: support@flinxx.com
