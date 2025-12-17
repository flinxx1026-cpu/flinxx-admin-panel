# Step-by-Step: Seed Admin User on Render

## 📋 Prerequisites
- Access to your Render dashboard
- Your service URL: `https://flinxx-admin-backend.onrender.com`

---

## 🔧 Step 1: Access Render Shell

1. Open your Render dashboard: https://dashboard.render.com
2. Click on your service: **flinxx-admin-backend** (or search for it)
3. In the top navigation, click the **Shell** tab
4. Wait for the shell to open (it will show a terminal prompt)

---

## ⚙️ Step 2: Run the Seed Command

In the shell terminal, type this command and press Enter:

```bash
npm run seed
```

---

## ✅ Step 3: Expected Output

You should see output like:

```
🌱 Seeding database with admin user...
✅ Admin user created successfully!
Email: Nikhilyadav1026@flinxx.com
Password: nkhlydv
```

If you see this, the admin user has been successfully created in PostgreSQL! ✅

---

## ❌ Troubleshooting

### If you get "command not found":
- Make sure you're in the correct directory
- Try: `cd /opt/render/project/src && npm run seed`

### If you get database connection error:
- Ensure DATABASE_URL is set in Environment Variables
- Check that PostgreSQL instance is running
- Verify the connection string is correct

### If you get "Admin user already exists":
- This is fine! It means the seed ran successfully before
- The script deletes and recreates, so you're good to go

---

## 🧪 Step 4: Verify Login Works

After seeding completes:

1. Go to: https://flinxx-admin-panel.vercel.app/login
2. Enter credentials:
   - Email: `Nikhilyadav1026@flinxx.com`
   - Password: `nkhlydv`
3. Click **Sign In**
4. You should be redirected to the dashboard ✅

---

## 📝 Notes

- The seed script automatically **deletes any existing admin** with this email before creating
- The password is **bcrypt hashed** (not plain text)
- Role is set to **ADMIN**
- The user will have full admin permissions

---

## ✨ Done!

Once you see the success message, your admin panel is ready for login!
