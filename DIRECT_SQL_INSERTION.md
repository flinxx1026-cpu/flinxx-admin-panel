# Direct Database Insertion - Create Admin User

If `npm run seed` didn't work on Render, use this method to create the admin user directly in PostgreSQL.

## 🔧 Option 1: Using Render Database Console (Easiest)

1. Go to https://dashboard.render.com
2. Find your PostgreSQL database instance (not the backend service)
3. Click on it → **Query Editor** tab (or **Dashboard** → **Query**)
4. Paste this SQL command:

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

5. Click **Run Query**
6. You should see: **"1 row inserted"** ✅

---

## 🔧 Option 2: Using psql Command Line

If you have psql installed locally, run:

```bash
psql "your_database_url_here" -c "INSERT INTO \"Admin\" (email, password, role, \"createdAt\", \"updatedAt\") VALUES ('Nikhilyadav1026@flinxx.com', '\$2a\$10\$hw//L5nGXC7fMrTjFOWnHOZJ5XTPJ9PhabzGX4GqLwYClj0haZFae', 'ADMIN', NOW(), NOW());"
```

---

## ✅ Verify Admin Was Created

After insertion, you can verify:

```sql
SELECT * FROM "Admin" WHERE email = 'Nikhilyadav1026@flinxx.com';
```

You should see:
```
id | email                           | password                                                     | role  | createdAt | updatedAt
---|---                              |---|---|---|
1  | Nikhilyadav1026@flinxx.com      | $2a$10$hw//L5nGXC7fMrTjFOWnHOZJ5XTPJ9PhabzGX4GqLwYClj0haZFae | ADMIN | ...       | ...
```

---

## 🧪 Test Login After Insertion

1. Go to: https://flinxx-admin-panel.vercel.app/login
2. Enter:
   - Email: `Nikhilyadav1026@flinxx.com`
   - Password: `nkhlydv`
3. Click **Sign In**
4. You should be logged in! ✅

---

## 📝 Admin Details

| Field | Value |
|-------|-------|
| Email | Nikhilyadav1026@flinxx.com |
| Password (hashed) | $2a$10$hw//L5nGXC7fMrTjFOWnHOZJ5XTPJ9PhabzGX4GqLwYClj0haZFae |
| Password (plain text) | nkhlydv |
| Role | ADMIN |

---

## ⚠️ If You Get an Error

### "duplicate key value violates unique constraint"
- The admin already exists. Delete and recreate:
```sql
DELETE FROM "Admin" WHERE email = 'Nikhilyadav1026@flinxx.com';
INSERT INTO "Admin" (email, password, role, "createdAt", "updatedAt") 
VALUES ('Nikhilyadav1026@flinxx.com', '$2a$10$hw//L5nGXC7fMrTjFOWnHOZJ5XTPJ9PhabzGX4GqLwYClj0haZFae', 'ADMIN', NOW(), NOW());
```

### "relation \"Admin\" does not exist"
- The migrations haven't been run. Contact Render support or redeploy the backend with migrations.

---

## 🎉 Done!

Once you see "1 row inserted", the admin user is ready and you can login!
