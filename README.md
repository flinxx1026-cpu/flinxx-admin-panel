# Flinxx Admin Panel

A comprehensive admin dashboard for managing the Flinxx video chat platform with advanced features for user management, content moderation, payments, and security.

## Features

### 1. Dashboard
- Real-time analytics of active users and live sessions
- New signups tracking
- Revenue summary
- Reports received (24-hour window)
- User activity charts
- Revenue analytics

### 2. User Management
- Advanced search (ID, email, username)
- User profile viewing with join date and login history
- Temporary/Permanent ban options
- Device ban capability
- User coin/balance reset
- Warning system
- Report history viewer

### 3. Reports Handling
- Complete report list with evidence viewer
- Screenshot attachment support
- Report reason tags
- Actions: Warn, Ban, Close Report
- Priority levels

### 4. Live Sessions
- Active video chat monitoring
- Force disconnect capability
- Connection details
- Session duration tracking

### 5. Matchmaking Controls
- Country-based priority settings
- Age filter configuration
- Gender preference toggles
- Queue delay customization
- Session duration limits

### 6. Payments & Subscriptions
- User payment history
- Active/expired subscription tracking
- Razorpay integration logs
- Refund management
- Revenue analytics

### 7. Content Moderation
- Auto-captured frame viewer
- AI nudity detection flagging
- Content approval/rejection
- Auto-ban settings
- Screenshot gallery

### 8. Chat Logs
- Text message viewer
- Abusive message deletion
- Chat-specific banning
- Search and filter options
- Timestamp tracking

### 9. Settings
- Website configuration
- Logo and branding
- Maintenance mode toggle
- Match duration settings
- Max report limits
- Camera/quality settings
- API key management (TURN, Razorpay, Email)

### 10. Admin Roles & Permissions
- Super Admin, Moderator, Finance Admin roles
- Granular permission control
- Admin activity logging
- Role-based access

### 11. Security Logs
- User login tracking
- Admin login monitoring
- Failed attempt detection
- Banned device management
- Database backup/restore options

## Tech Stack

### Frontend
- React 18
- React Router v6
- Tailwind CSS
- Recharts (data visualization)
- Lucide React (icons)
- Axios (API client)
- Zustand (state management)

### Backend
- Node.js + Express
- MongoDB
- JWT Authentication
- bcryptjs (password hashing)

### Deployment
- Frontend: Vercel/Netlify
- Backend: Render/Heroku
- Database: MongoDB Atlas

## Installation

### Clone Repository
\`\`\`bash
git clone https://github.com/flinxx/admin-panel.git
cd admin-panel
\`\`\`

### Install Dependencies
\`\`\`bash
npm run setup
\`\`\`

### Environment Setup

**Frontend (.env)**
\`\`\`
VITE_API_URL=http://localhost:3001/api
\`\`\`

**Backend (.env)**
\`\`\`
PORT=3001
MONGODB_URI=mongodb://localhost:27017/flinxx-admin
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
\`\`\`

## Running the Application

### Development Mode
\`\`\`bash
npm run dev
\`\`\`

This runs both frontend (port 5173) and backend (port 3001) concurrently.

### Individual Development
\`\`\`bash
npm run dev:frontend  # Frontend only
npm run dev:backend   # Backend only
\`\`\`

### Production Build
\`\`\`bash
npm run build
npm start
\`\`\`

## API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login

### Dashboard
- `GET /api/admin/dashboard` - Get dashboard stats and charts

### Users
- `GET /api/admin/users` - List users with search
- `POST /api/admin/users/:userId/ban` - Ban user
- `POST /api/admin/users/:userId/unban` - Unban user
- `POST /api/admin/users/:userId/warn` - Send warning
- `POST /api/admin/users/:userId/reset-coins` - Reset coins

### Reports
- `GET /api/admin/reports` - List reports
- `POST /api/admin/reports/:reportId/close` - Close report
- `POST /api/admin/reports/:reportId/ban` - Ban user from report
- `POST /api/admin/reports/:reportId/warn` - Warn user

### Settings
- `GET /api/admin/settings` - Get settings
- `POST /api/admin/settings/update` - Update settings

## Login Credentials

**Demo Account:**
- Email: `admin@flinxx.com`
- Password: `password`

## File Structure

\`\`\`
admin-panel/
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── layouts/        # Layout components
│   │   ├── services/       # API services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── config/         # Configuration
│   │   └── server.js
│   └── package.json
├── package.json
└── README.md
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT

## Support

For support, email support@flinxx.com or create an issue in the repository.
