# Database Cleanup Quick Reference

## 🚨 CRITICAL: Read PRODUCTION_CLEANUP.md Before Proceeding

## Quick Start

### 1️⃣ Verify Current Database State
```bash
cd backend
npm run verify-db
```

**Expected Output** (if seeded):
```
📊 Current Database State:
   Users: 100
   Sessions: 50
   Payments: 30
   Reports: 25
   Admin accounts: 1

🔎 Checking for seeded/demo data patterns...
⚠️ DATABASE CONTAINS POTENTIAL SEEDED DATA
Issues found:
   ⚠️ Found 100 potential demo users (emails/usernames containing 'user' or 'test')
   ⚠️ Found 10 timestamps with multiple user creations (typical of seeded data)
```

### 2️⃣ Execute Cleanup (After Backup!)
```bash
npm run cleanup-production
```

**Expected Output**:
```
========== PRODUCTION CLEANUP STARTED ==========
Timestamp: 2026-01-12T...

📊 Getting pre-cleanup statistics...
Pre-cleanup counts:
  - Users: 100
  - Sessions: 50
  - Payments: 30
  - Reports: 25
  - Admins: 1

🗑️ Starting data deletion (reverse dependency order)...
Deleting Sessions...
✅ Deleted 50 sessions
Deleting Payments...
✅ Deleted 30 payments
Deleting Reports...
✅ Deleted 25 reports
Deleting Users...
✅ Deleted 100 users
Preserving Admin account...
✅ Admin account preserved (1 admin(s) remain)

📊 Getting post-cleanup statistics...
Post-cleanup counts:
  - Users: 0
  - Sessions: 0
  - Payments: 0
  - Reports: 0
  - Admins: 1

✅ CLEANUP COMPLETED SUCCESSFULLY
Log file: cleanup_log_2026-01-12T...txt
```

### 3️⃣ Verify Cleanup Success
```bash
npm run verify-db
```

**Expected Output**:
```
📊 Current Database State:
   Users: 0
   Sessions: 0
   Payments: 0
   Reports: 0
   Admin accounts: 1

🔎 Checking for seeded/demo data patterns...
✅ DATABASE VERIFICATION PASSED
   - Database appears clean and production-ready
   - No obvious seeded/demo data detected
```

### 4️⃣ Test Admin Dashboard
1. Restart backend: `npm run start`
2. Access dashboard at `http://localhost:3000` (or your frontend URL)
3. Verify empty states display correctly:
   - User Management: "No users found"
   - Live Sessions: "No active sessions"
   - Payments: "No transactions found"
   - Reports: "No reports found"

## ⚠️ Pre-Cleanup Checklist

- [ ] **BACKUP DATABASE** (absolutely critical!)
- [ ] Backend process stopped (or will be stopped)
- [ ] No active user requests to API
- [ ] Team notified of maintenance window
- [ ] You have database restoration procedure ready

## ✅ Post-Cleanup Checklist

- [ ] Cleanup completed successfully
- [ ] Verification script confirms clean database
- [ ] Admin can still log in
- [ ] Dashboard shows empty states (no errors)
- [ ] Cleanup log archived
- [ ] Team notified that cleanup is complete
- [ ] Monitor for any issues in next 24 hours

## 📊 What Gets Deleted

| Table | Count | Status | Notes |
|-------|-------|--------|-------|
| User | All | ❌ Deleted | Demo users removed |
| Session | All | ❌ Deleted | Demo sessions removed |
| Payment | All | ❌ Deleted | Demo payments removed |
| Report | All | ❌ Deleted | Demo reports removed |
| Admin | Preserved | ✅ Kept | Essential for access |

## 🔧 Troubleshooting

### Script Fails With "Database Connection Error"
```
❌ Error: Could not connect to database
```
**Solution**: Check `.env` has correct `DATABASE_URL`

### Cleanup Hangs
**Solution**: Press Ctrl+C and check database logs. May indicate locks.

### Can't Find Cleanup Log
```bash
# Logs are created in backend/ directory
ls -la backend/cleanup_log_*.txt
```

### Want to Undo?
```bash
# Restore from backup
# Consult with DBA or DevOps team
```

## 🎯 Commands Summary

```bash
# Verify database state
npm run verify-db

# Execute cleanup (ONLY AFTER BACKUP!)
npm run cleanup-production

# Create admin user (if needed)
npm run seed-admin

# View cleanup logs
ls -la cleanup_log_*.txt
```

## 🛡️ Prevention

**After cleanup, never run:**
```bash
npm run seed  # ❌ DISABLED - will warn and exit
```

**Safe alternatives:**
```bash
npm run seed-admin        # ✅ Creates/verifies admin only
npm run verify-db         # ✅ Check database state
npm run cleanup-production # ✅ Remove demo data
```

## 📝 Important Notes

1. **Admin Account is Protected**: Never deleted by cleanup script
2. **Irreversible Without Backup**: Cannot undo without database backup
3. **Production Only**: Use separate development database
4. **No User Data Preserved**: All user-generated content will be deleted

## 📞 Need Help?

1. Check logs: `cat cleanup_log_*.txt`
2. Read full guide: [PRODUCTION_CLEANUP.md](./PRODUCTION_CLEANUP.md)
3. Contact DevOps or Database Administrator
4. Review Git commit history for seed script changes

---

**Generated**: January 12, 2026  
**Status**: Ready for Production  
**Safety Level**: ⚠️ Critical Data Operation
