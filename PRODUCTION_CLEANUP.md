# Production Database Cleanup Guide

## Overview

This document outlines the process of cleaning up seeded/demo data from the production database and preventing future seeding incidents.

## Problem Identified

User timestamps analysis revealed that multiple users were created within the same second with millisecond differences, which is characteristic of script-generated/seeded data rather than organic user signups.

This confirmed that the production database contained non-real data from the seeding process.

## Solution Implemented

### 1. **Cleanup Scripts Created**

#### `backend/scripts/cleanupProduction.js`
- Safely removes all seeded data while preserving the admin account
- Deletes in dependency order: Sessions → Payments → Reports → Users
- Preserves Admin account
- Generates detailed logs with before/after statistics
- **Usage**: `npm run cleanup-production`

#### `backend/scripts/verifyDatabase.js`
- Verifies that only real data exists in production
- Checks for demo data patterns (test emails, specific prefixes)
- Detects multiple users created in same second
- **Usage**: `npm run verify-db`

### 2. **Disabled Seeding in Codebase**

#### `backend/prisma/seed.js`
- **DISABLED** to prevent accidental seeding on production
- Now displays warning message instead of seeding

#### `backend/package.json` - Updated Scripts
```json
{
  "scripts": {
    "dev": "nodemon --exec node src/server.js",
    "build": "npx prisma generate && npx prisma migrate deploy",
    "start": "node src/server.js",
    "verify-db": "node scripts/verifyDatabase.js",
    "cleanup-production": "node scripts/cleanupProduction.js",
    "seed-admin": "node scripts/seedAdmin.js"
  }
}
```

**Important Changes:**
- Removed `"seed": "node prisma/seed.js"` (would delete all data)
- Added `"verify-db"` for production verification
- Added `"cleanup-production"` for safe cleanup
- Kept `"seed-admin"` for initial admin creation only

### 3. **Frontend Updates**

All dashboard pages now gracefully handle empty data states:

- **UserManagement.jsx**: Shows "No users found" when empty
- **LiveSessions.jsx**: Shows "No active sessions" when empty
- **PaymentsSubscriptions.jsx**: Shows "No transactions found" when empty
- **ReportsHandling.jsx**: Shows "No reports found" when empty
- **Dashboard.jsx**: Already had empty state handling

## Step-by-Step Cleanup Process

### Prerequisites
1. **Backup** the production database
2. **Notify** team that database cleanup is happening
3. **Stop** any background processes that might be running
4. **Ensure** no active API requests are being processed

### Execution

#### Step 1: Verify Current State
```bash
cd backend
npm run verify-db
```

This will show:
- Current row counts per table
- Potential demo data indicators
- Recommendations for cleanup

#### Step 2: Run Cleanup
```bash
npm run cleanup-production
```

The script will:
1. Show pre-cleanup statistics
2. Delete all Sessions
3. Delete all Payments
4. Delete all Reports
5. Delete all Users
6. **PRESERVE** Admin account
7. Show post-cleanup statistics
8. Generate a cleanup log file with timestamp

#### Step 3: Verify Cleanup Success
```bash
npm run verify-db
```

Expected output:
```
Users: 0
Sessions: 0
Payments: 0
Reports: 0
Admin accounts: 1
```

### Step 4: Test Dashboard
1. Access the admin dashboard
2. Verify all pages show empty states gracefully
3. Confirm no errors in browser console
4. Test that admin can still log in and navigate

## Database Schema

The application uses the following tables (Prisma models):

```
┌────────────┐
│   Admin    │ (Protected - never deleted)
└────────────┘
      ↓
┌────────────┐
│    User    │ (Deleted during cleanup)
├────────────┤
│   Report   │ (References User, deleted)
│  Session   │ (References User, deleted)
│  Payment   │ (References User, deleted)
└────────────┘
```

## Preventing Future Seeding Incidents

### 1. **Code Review Checklist**
- [ ] No `npm run seed` commands in production deployment scripts
- [ ] No seed scripts in CI/CD pipeline for production
- [ ] Seed files are development-only

### 2. **Environment Isolation**
```javascript
// Example in seed.js
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Cannot seed production database!')
  process.exit(1)
}
```

### 3. **Git Hooks**
Prevent seed scripts from being deployed:
```bash
# .git/hooks/pre-push
if grep -q "npm run seed" .github/workflows/*.yml; then
  echo "❌ Cannot push: seed script found in CI/CD"
  exit 1
fi
```

### 4. **Deployment Procedures**
- **Production Deployments**: Use `npm run build` only (no seed scripts)
- **Development**: Use `npm run dev` with local `.env` pointing to dev DB
- **Staging**: Use separate staging database with different credentials

### 5. **Database Access Control**
- Production database credentials should have restricted permissions
- Separate read-only credentials for admin dashboard
- No write access from development machines to production DB

## Monitoring and Verification

### Timestamp Analysis Query
To detect future seeding attempts, monitor for multiple users created in same second:

```sql
SELECT DATE_TRUNC('second', created_at) as second, COUNT(*) as count
FROM "User"
GROUP BY DATE_TRUNC('second', created_at)
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

### Real User Pattern
- Organic signups are spread throughout time
- Timestamps show natural distribution (hours/days apart)
- Different timezones and peak hours visible

### Seeded Data Pattern
- Multiple users in same millisecond
- Batch operations visible (50, 100, etc. records at once)
- Artificial pattern in email addresses (user1@test.com, user2@test.com)
- Identical or predictable usernames

## Rollback Procedures

If cleanup goes wrong:

1. **Stop Application**: Prevent further damage
2. **Restore Backup**: Use database backup from before cleanup
3. **Verify**: Run `npm run verify-db` on restored database
4. **Restart**: Bring application back online

## Post-Cleanup Checklist

- [ ] All demo data removed (verify with `npm run verify-db`)
- [ ] Admin account still present and functional
- [ ] Dashboard pages handle empty states gracefully
- [ ] No seeding scripts accessible in production environment
- [ ] Team trained on cleanup procedures
- [ ] Monitoring set up for future seeding detection
- [ ] Documentation updated
- [ ] Cleanup log archived for audit trail

## FAQ

**Q: Can I undo the cleanup?**
A: Only if you have a database backup from before cleanup. Use your backup restoration process.

**Q: What if the cleanup script fails?**
A: Check the generated log file for details. The script includes detailed error messages and stops at the first error.

**Q: How do I add admin users after cleanup?**
A: Use `npm run seed-admin` which only creates the admin account without touching other data.

**Q: Why not just truncate all tables?**
A: The cleanup script uses careful dependency ordering and preserves the admin account, which is safer than truncation.

**Q: Can seeding happen again?**
A: Only if someone manually runs the cleanup script or modifies the seeding scripts. The npm scripts have been updated to prevent accidental seeding.

## Support

If you have questions about the cleanup process or need assistance:

1. Check the generated cleanup logs
2. Review this documentation
3. Contact the development team
4. Check database backups if needed

---

**Last Updated**: January 12, 2026
**Version**: 1.0
**Status**: Production Ready
