# Supabase Setup Instructions for Toko 360

## 📋 Step-by-Step Setup

### 1. Run the Database Schema (This includes seed data!)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your "Toko 360" project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `schema.sql` and paste it
6. Click **Run** (or press Ctrl/Cmd + Enter)

**Note:** The schema.sql file already includes all the seed data (departments, users, system config), so you don't need to run seed.sql separately!

### 2. Verify the Setup

1. Go to **Table Editor** in your Supabase Dashboard
2. You should see these tables:
   - users (9 rows)
   - departments (8 rows)
   - attendance_records (empty initially)
   - weekly_reports (empty)
   - messages (empty)
   - system_config (1 row)

### 3. Restart Your Development Server

```bash
npm run dev
```

## ✅ What's Next?

After completing these steps, I will:
1. Update the authentication system to use Supabase Auth
2. Replace all localStorage calls with Supabase database queries
3. Implement real-time features (optional)
4. Add proper error handling

## 🔐 Security Notes

- The current RLS policies allow public access for development
- Before going to production, you should implement proper authentication-based policies
- Never commit your `.env.local` file to version control (it's already in .gitignore)

## 📞 Need Help?

If you encounter any errors while running the SQL, please share the error message and I'll help you fix it!
