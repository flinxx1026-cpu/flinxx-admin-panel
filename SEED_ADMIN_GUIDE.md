# How to Seed Admin User on Render Backend

## Problem
The admin user `Nikhilyadav1026@flinxx.com` needs to be created in the PostgreSQL database on Render.

## Solution

### Option 1: Using Render Shell (Easiest)

1. Go to your Render service dashboard: https://dashboard.render.com
2. Navigate to your `flinxx-admin-backend` service
3. Click on the **Shell** tab
4. Run the following command:

```bash
npm run seed
```

This will execute the seed script and create the admin user in your database.

**Expected Output:**
```
✅ Admin user created successfully!
Email: Nikhilyadav1026@flinxx.com
Password: nkhlydv
```

---

### Option 2: Using Render's One-Off Job (If Shell doesn't work)

1. Go to your Render service: https://dashboard.render.com/services/prs_...
2. Click **Settings** → **Create One-Off Job**
3. In the command field, enter:
```bash
npx prisma generate && npm run seed
```
4. Click **Run**

---

### Option 3: Direct Database Query (Via psql)

If you have direct database access:

1. Get your DATABASE_URL from Render environment variables
2. Run this SQL command:

```sql
INSERT INTO "Admin" (email, password, role, "createdAt", "updatedAt") 
VALUES (
  'Nikhilyadav1026@flinxx.com',
  '$2a$10$hw//L5nGXC7fMrTjFOWnHOZJ5XTPJ9PhabzGX4GqLwYClj0haZFae',
  'ADMIN',
  NOW(),
  NOW()
);
```

---

## Admin Credentials After Seeding

| Field | Value |
|-------|-------|
| **Email** | `Nikhilyadav1026@flinxx.com` |
| **Password** | `nkhlydv` |
| **Role** | `ADMIN` |

---

## Verification

After seeding, you can verify the admin was created by:

1. Going to the admin panel: https://flinxx-admin-panel.vercel.app/login
2. Entering the credentials above
3. You should be logged in and redirected to the dashboard

---

## If Seeding Fails

1. **Check DATABASE_URL** - Ensure it's set in Render environment variables
2. **Check Migrations** - Ensure all Prisma migrations have been applied:
   ```bash
   npx prisma migrate deploy
   ```
3. **Check Logs** - Review Render service logs for connection errors
4. **Re-run Seed** - Try the seed command again

---

## Alternative: Create Multiple Admin Users

To add more admin users, modify the seed script or run:

```bash
node scripts/seedAdmin.js
```

This will check if the admin exists first, or create a new one.
