# Flinxx Admin Panel - Complete Documentation

## Project Overview

A full-featured Admin Panel for managing the Flinxx video chat platform. Built with React (frontend) and Node.js/Express (backend), it provides comprehensive tools for user management, content moderation, payments, and platform analytics.

## Complete Feature List

### ✅ 1. Dashboard
- **Live Metrics**: Active users, ongoing sessions, new signups, revenue, recent reports
- **Charts**: User activity timeline, revenue trends, user distribution pie chart
- **Real-time Updates**: Live user count with trend indicators
- **Quick Stats**: Color-coded statistic cards with percentage changes

### ✅ 2. User Management
- **Search Functionality**: Find users by ID, email, or username
- **User Profiles**: View join date, last login, IP logs
- **Moderation Actions**:
  - Temporary ban
  - Permanent ban
  - Warning system
  - Device ban
  - Coin/balance reset
- **Report History**: View all reports filed by/against user

### ✅ 3. Reports Handling
- **Report List**: Paginated list with filters
- **Evidence Viewer**: View attached screenshots and evidence
- **Report Tags**: Categorize by reason (inappropriate content, harassment, etc.)
- **Actions**:
  - Send warning to user
  - Temporary ban
  - Permanent ban
  - Close/resolve report
- **Status Tracking**: Pending, Investigating, Closed

### ✅ 4. Live Sessions Monitor
- **Active Sessions List**: Real-time list of ongoing video chats
- **Connection Details**: User 1 info, User 2 info, connection duration
- **Force Disconnect**: Admin can end sessions if needed
- **Session Info**: Start time, duration, connection quality

### ✅ 5. Matchmaking Controls
- **Country Priority**: Set matching preferences (same country, regional, global)
- **Age Filter**: Configure age range for matching
- **Gender Preference**: Toggle gender-based filtering
- **Queue Management**: Set queue wait times
- **Session Duration**: Configure max session length
- **Restrictions**: Enforce or disable certain matching criteria

### ✅ 6. Payments & Subscriptions
- **Transaction History**: Complete payment records
- **Subscription Management**: Active/expired subscriptions
- **Revenue Analytics**: Daily/monthly revenue tracking
- **Razorpay Integration**: View payment logs and gateway status
- **Refund Management**: Process and track refunds
- **Revenue Reports**: Download and export data

### ✅ 7. Content Moderation
- **AI Detection**: Nudity and inappropriate content detection
- **Screenshot Gallery**: Auto-captured frames for review
- **Approval Workflow**: Approve or reject flagged content
- **Auto-Ban Settings**: Configure automatic bans for violations
- **Evidence Review**: Detailed frame-by-frame analysis

### ✅ 8. Chat Logs
- **Message Viewer**: Browse text conversations
- **Search & Filter**: Find specific messages or users
- **Moderation**: Delete abusive messages
- **Chat Ban**: Ban users from chat-only
- **Timestamp Tracking**: See exact conversation times
- **Export**: Download chat logs for analysis

### ✅ 9. Settings & Configuration
- **General Settings**: Site name, logo, branding
- **Maintenance Mode**: Take platform offline for updates
- **Session Config**: Match duration, max reports allowed
- **Video Settings**: Quality defaults, codec settings
- **API Keys**: TURN server, Razorpay, Email service
- **Backup/Restore**: Database management options

### ✅ 10. Admin Roles & Permissions
- **Role Types**:
  - Super Admin (full access)
  - Moderator (reports, users, chat)
  - Finance Admin (payments, revenue)
- **Permission Control**: Granular per-action permissions
- **Admin Directory**: View all admins and their roles
- **Activity Logging**: Track all admin actions

### ✅ 11. Security & Audit Logs
- **Login Tracking**: User and admin login records
- **Failed Attempts**: Monitor failed login attempts
- **Banned Devices**: List and manage blocked devices
- **Admin Audit**: Complete admin activity log
- **IP Logs**: Track user IP addresses and locations
- **Database Backups**: Backup and restore options

## Tech Stack Details

### Frontend Technologies
```
React 18.2.0          - UI framework
React Router v6.20    - Client-side routing
Tailwind CSS 3.3.6    - Utility-first styling
Recharts 2.10.3       - Data visualization
Lucide React 0.294    - Icon library
Axios 1.6.2           - HTTP client
Zustand 4.4.1         - State management
React Query 3.39.3    - Server state management
React Hot Toast 2.4   - Toast notifications
```

### Backend Technologies
```
Node.js               - Runtime
Express 4.18.2        - Web framework
MongoDB 8.0           - Database
Mongoose              - ODM
JWT 9.1.2             - Authentication
bcryptjs 2.4.3        - Password hashing
CORS 2.8.5            - Cross-origin requests
Dotenv 16.3.1         - Environment config
```

## Project Structure

```
admin-panel/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── StatCard.jsx
│   │   │   └── Modal.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   ├── ReportsHandling.jsx
│   │   │   ├── LiveSessions.jsx
│   │   │   ├── MatchmakingControls.jsx
│   │   │   ├── PaymentsSubscriptions.jsx
│   │   │   ├── ContentModeration.jsx
│   │   │   ├── ChatLogs.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── AdminRoles.jsx
│   │   │   ├── SecurityLogs.jsx
│   │   │   └── Login.jsx
│   │   ├── layouts/
│   │   │   └── Layout.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── admin.js
│   │   │   ├── dashboard.js
│   │   │   ├── users.js
│   │   │   ├── reports.js
│   │   │   └── settings.js
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   ├── config/
│   │   │   └── database.js
│   │   └── server.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── package.json
├── README.md
├── SETUP.md
└── .gitignore
```

## Installation Instructions

### 1. Prerequisites
```bash
# Check versions
node --version  # v18+ required
npm --version   # v9+ required

# Install MongoDB locally or use MongoDB Atlas
```

### 2. Clone & Setup
```bash
# Navigate to workspace
cd "admin pannel"
cd admin-panel

# Install all dependencies
npm run setup
```

### 3. Environment Configuration
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your configuration

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with API URL
```

### 4. Database Setup (Optional)
```bash
# Start local MongoDB
mongod

# Or update .env with MongoDB Atlas URI
```

### 5. Run Application
```bash
# From root directory
npm run dev

# Or individually
npm run dev:frontend  # Terminal 1
npm run dev:backend   # Terminal 2
```

## Usage Guide

### Login
- **URL**: http://localhost:5173/login
- **Email**: admin@flinxx.com
- **Password**: password

### Navigation
- **Dashboard**: Overview and analytics
- **Users**: User management and moderation
- **Reports**: Handle user reports
- **Live Sessions**: Monitor active chats
- **Matchmaking**: Configure matching algorithm
- **Payments**: Revenue and subscriptions
- **Content Mod**: Moderate content
- **Chat Logs**: View message history
- **Settings**: Configure platform
- **Admin Roles**: Manage admins
- **Security**: View audit logs

## API Endpoints

### Authentication
```
POST /api/admin/login
- Email and password login
- Returns JWT token
```

### Dashboard
```
GET /api/admin/dashboard
- Returns stats, charts, activity data
```

### Users
```
GET /api/admin/users?search=query
- List and search users
POST /api/admin/users/:id/ban
- Ban user
POST /api/admin/users/:id/warn
- Send warning
POST /api/admin/users/:id/reset-coins
- Reset balance
```

### Reports
```
GET /api/admin/reports
- List all reports
POST /api/admin/reports/:id/ban
- Ban user from report
POST /api/admin/reports/:id/close
- Close report
```

### Settings
```
GET /api/admin/settings
- Get all settings
POST /api/admin/settings/update
- Update settings
```

## Key Features Explained

### Dashboard Analytics
- Real-time user statistics
- Multiple chart types (line, bar, pie)
- Revenue tracking and trends
- User activity visualization
- Quick action cards

### User Management System
- Comprehensive search across 3 fields
- Multi-action button interface
- User status indicators
- Account management options
- Confirmation dialogs for critical actions

### Report Handling Workflow
1. Admin views pending reports
2. Examines evidence (screenshots)
3. Reviews report reason
4. Takes action (warn/ban/close)
5. System tracks all actions

### Matchmaking Algorithm Control
- Geographic filtering (country-level)
- Age range customization
- Gender-based preferences
- Queue timing adjustments
- Session duration limits

### Security Features
- JWT-based authentication
- Password hashing (bcryptjs)
- Token validation on API calls
- Error handling middleware
- Audit logging for all admin actions

## Customization Guide

### Add New Menu Item
Edit `frontend/src/components/Sidebar.jsx`:
```javascript
{ icon: Icon, label: 'New Item', path: '/new-path', section: 'section' }
```

### Add New Page
1. Create `frontend/src/pages/NewPage.jsx`
2. Add route in `frontend/src/App.jsx`
3. Create backend routes in `backend/src/routes/newpage.js`
4. Add route to `backend/src/server.js`

### Change Colors
Edit `frontend/tailwind.config.js` and `frontend/src/index.css`

### Add API Endpoint
Create new route file in `backend/src/routes/` and add to server.js

## Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy dist folder
```

### Backend (Render/Heroku)
```bash
cd backend
npm run build
npm start
```

### Environment Variables (Production)
- Backend: Set all .env variables in platform settings
- Frontend: Set VITE_API_URL to production API

## Performance Optimization

1. **Code Splitting**: React Router lazy loading
2. **Image Optimization**: WebP format
3. **API Caching**: React Query implementation  
4. **Database Indexing**: MongoDB indexes
5. **Bundle Size**: Webpack optimization
6. **Lazy Components**: React.lazy() usage

## Security Measures

1. JWT Authentication
2. Password Hashing
3. Input Validation
4. CORS Configuration
5. Error Handling
6. SQL Injection Prevention (using Mongoose)
7. XSS Protection
8. HTTPS Enforcement (production)

## Troubleshooting

### Issue: Port 3001 Already in Use
```bash
# Kill process on port
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Issue: MongoDB Connection Error
- Check if MongoDB is running
- Verify URI in .env
- Check network access for Atlas

### Issue: CORS Error
- Verify FRONTEND_URL in backend .env
- Check VITE_API_URL in frontend .env

### Issue: Login Not Working
- Check JWT_SECRET is set
- Verify credentials are correct
- Check browser console for errors

## Future Enhancements

1. Two-factor authentication
2. Real-time notifications
3. Video evidence playback
4. Advanced analytics
5. ML-based moderation
6. Mobile app
7. Multi-language support
8. Dark/Light theme toggle
9. Advanced reporting
10. Integration APIs

## Support & Community

- **Documentation**: See README.md and SETUP.md
- **Issues**: Report on GitHub
- **Email**: support@flinxx.com
- **Discord**: Join community server

## License

MIT License - Free for commercial and personal use

## Contributors

- Development Team
- UI/UX Designers
- QA Team

---

**Last Updated**: December 4, 2025
**Version**: 1.0.0
