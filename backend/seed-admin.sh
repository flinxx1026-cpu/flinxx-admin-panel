#!/bin/bash
# Manual seeding script for Render backend
# Run this script on your Render instance to seed the admin user

echo "🌱 Seeding admin user into Render PostgreSQL database..."
echo ""
echo "This will create admin user:"
echo "  Email: Nikhilyadav1026@flinxx.com"
echo "  Password: nkhlydv"
echo ""

# Option 1: Using Render's built-in psql
# If you have access to your database credentials, run:
# psql $DATABASE_URL << EOF
# INSERT INTO "Admin" (email, password, role, "createdAt", "updatedAt") 
# VALUES ('Nikhilyadav1026@flinxx.com', '\$2a\$10\$hw//L5nGXC7fMrTjFOWnHOZJ5XTPJ9PhabzGX4GqLwYClj0haZFae', 'ADMIN', NOW(), NOW());
# EOF

# Option 2: Using Node.js seed script (recommended for Render)
# SSH into your Render service and run:
# npm run seed

echo "✅ Seed script ready"
