# Student Expense Tracker — Supabase Edition

This version replaces browser LocalStorage with Supabase Postgres and Supabase Auth.

## Setup
1. Create a project at https://supabase.com/.
2. In the Supabase dashboard, open **SQL Editor**, create a query, paste `supabase-schema.sql`, and run it. This creates the expenses table, index, and Row Level Security policies.
3. Open **Project Settings → API** (or API Keys). Copy the **Project URL** and the **publishable key** (or legacy `anon` key). Never use the `service_role` or secret key in browser code.
4. Open `supabase-config.js` and replace `YOUR_PROJECT_ID` and `YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY` with your values.
5. In **Authentication → URL Configuration**, set your local development URL in Site URL / Redirect URLs if prompted (for example `http://localhost:5500`).
6. Open the folder in VS Code and run `index.html` with the Live Server extension. Use `http://localhost`, not a `file://` URL.
7. Create an account with your email and a password of at least 6 characters. If email confirmation is enabled, confirm the email before signing in.

## Features
- Sign up, sign in and sign out
- Save, load and delete expenses in Supabase
- User-specific records protected by Row Level Security
- Total and current-month spending
- Category chart, search and category filter
- Clear all expenses for the signed-in user

## Files
- `index.html` — app layout and Supabase JS CDN
- `style.css` — app styling
- `script.js` — authentication and database operations
- `supabase-config.js` — project URL and public key placeholders
- `supabase-schema.sql` — database table and RLS policies

## Security note
The browser uses only the Supabase publishable/anon key. The RLS policies enforce that each authenticated user can access only rows whose `user_id` matches their authenticated user ID. Never expose a Supabase `service_role` or secret key in frontend code.
