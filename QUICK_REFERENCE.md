# Quick Reference Guide - Flinxx Admin Panel

## 🚀 Getting Started (5 minutes)

```bash
# 1. Install dependencies
npm run setup

# 2. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start development
npm run dev

# 4. Login
# URL: http://localhost:5173
# Email: admin@flinxx.com
# Password: password
```

## 📊 Dashboard Overview

| Component | Purpose |
|-----------|---------|
| Active Users | Real-time connected users |
| Live Sessions | Ongoing video chats |
| New Signups | Users joined today |
| Revenue | Money earned |
| Reports | Issues reported |

## 👥 User Management

**Quick Actions:**
- **Ban**: Permanent account suspension
- **Warn**: Send warning message
- **Unban**: Restore banned account
- **Reset Coins**: Clear user balance
- **View**: See full profile

**Search By:** ID | Email | Username

## 📋 Reports Handling

**Workflow:**
1. View report list
2. Click "View Evidence" for screenshots
3. Read report reason
4. Choose action (Warn/Ban/Close)
5. Confirm action

**Report Status:**
- 🟡 Pending: Needs review
- 🔵 Investigating: Under review
- ✅ Closed: Action taken

## 🎮 Live Sessions

**Monitor:**
- Both users connected
- Session duration
- Connection quality
- Video quality used

**Admin Actions:**
- Force disconnect session
- View user details
- Check IP addresses

## ⚙️ Matchmaking Config

**Settings:**
- Country priority (same/regional/global)
- Age range (18-65)
- Gender filter (on/off)
- Queue wait time (30 sec default)
- Session duration (10 min default)

## 💳 Payments

**View:**
- Transaction history
- Active subscriptions
- Revenue trends
- Razorpay logs
- Pending refunds

**Charts:**
- Daily revenue
- Subscription trends
- Refund analytics

## 🎬 Content Moderation

**Features:**
- AI nudity detection
- Screenshot viewer
- Auto-ban on violation
- Evidence gallery
- Approve/Reject workflow

## 💬 Chat Logs

**Tools:**
- Search messages
- Filter by date
- Delete abusive content
- Ban user from chat
- Export conversations

## ⚙️ Settings

**Configure:**
- Site name & logo
- Maintenance mode
- Match duration
- Max reports allowed
- API keys (TURN, Razorpay)
- Video quality defaults

## 👨‍💼 Admin Roles

**Types:**
- **Super Admin**: All permissions
- **Moderator**: Reports, users, chat
- **Finance**: Payments only

**Create Admin:**
1. Click "Add Admin"
2. Enter email & password
3. Select role
4. Check permissions
5. Save

## 🔐 Security Logs

**Monitor:**
- Admin logins
- Failed attempts
- Banned devices
- Activity history
- IP tracking

**Reports:**
- Suspicious activities
- Failed login attempts
- Device bans

## 🔧 API Quick Reference

```javascript
// Login
POST /api/admin/login
{ email, password }

// Get Dashboard
GET /api/admin/dashboard

// Search Users
GET /api/admin/users?search=query

// Ban User
POST /api/admin/users/:id/ban

// Close Report
POST /api/admin/reports/:id/close

// Update Settings
POST /api/admin/settings/update
```

## 📱 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+K` | Search |
| `Ctrl+,` | Settings |
| `Esc` | Close modal |
| `Enter` | Submit form |

## 🐛 Common Issues

**Port 3001 In Use?**
```bash
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

**MongoDB Won't Connect?**
- Check if MongoDB is running
- Verify URI in .env
- Check network for Atlas

**API Calls Failing?**
- Check token in localStorage
- Verify VITE_API_URL
- Check backend is running

**CORS Error?**
- Update FRONTEND_URL in backend .env
- Restart backend server

## 📞 Support

- **Docs**: Read README.md
- **Setup**: Follow SETUP.md
- **Issues**: Check DOCUMENTATION.md
- **Email**: support@flinxx.com

## 🎯 Key Metrics to Monitor

- **DAU** (Daily Active Users)
- **Sessions/Hour**: Video chat volume
- **Reports/Day**: Community health
- **Revenue/Day**: Monetization
- **Session Duration**: User engagement
- **Churn Rate**: User retention

## ✅ Daily Admin Checklist

- [ ] Check pending reports
- [ ] Review new user signups
- [ ] Monitor revenue
- [ ] Review security logs
- [ ] Check banned devices
- [ ] Update settings if needed
- [ ] Generate daily reports

## 🚨 Critical Actions

⚠️ **These require confirmation:**
- Ban user (permanent)
- Delete report
- Update API keys
- Maintenance mode
- Database restore

## 📊 Important Dates

- Next payment settlement: [Date]
- Security audit: [Date]
- Database backup: Daily 2 AM
- Maintenance window: [Day/Time]

## 💡 Pro Tips

1. **Search is case-insensitive** - any format works
2. **Sort tables by clicking headers** - organized view
3. **Export data** from payments for accounting
4. **Bulk actions** available on user list
5. **Auto-refresh** enabled on dashboard
6. **Dark theme** optimized for long sessions
7. **Responsive design** works on tablets
8. **Notifications** appear in top-right corner

---

**Last Updated**: December 4, 2025 | **Version**: 1.0.0
