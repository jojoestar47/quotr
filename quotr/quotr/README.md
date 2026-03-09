# Quotr

A quoting web app for trade and retail businesses. Built with React + Vite, hosted on Vercel, database on Supabase.

---

## Deploy in 4 steps

### Step 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project**, give it a name (e.g. `quotr`), set a database password, choose a region close to you
3. Wait for the project to finish provisioning (about 1 minute)
4. In the left sidebar, click **SQL Editor**
5. Copy the entire contents of `supabase/migrations/001_initial_schema.sql` and paste it into the editor
6. Click **Run** — this creates all your tables, security rules, and seed products
7. Go to **Project Settings → API** and copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

---

### Step 2 — Push to GitHub

```bash
# In this project folder:
git init
git add .
git commit -m "Initial commit"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/quotr.git
git push -u origin main
```

---

### Step 3 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project** and import your `quotr` repo
3. Vercel will detect it as a Vite project automatically
4. Before deploying, click **Environment Variables** and add:
   - `VITE_SUPABASE_URL` — your Supabase Project URL from Step 1
   - `VITE_SUPABASE_ANON_KEY` — your anon public key from Step 1
5. Click **Deploy**

Your app will be live at `https://quotr-xxxx.vercel.app` in about 30 seconds.

---

### Step 4 — Create your first admin account

1. Open the live app
2. In the Supabase dashboard, go to **Authentication → Users**
3. Click **Invite user** and enter your email
4. Check your email and click the magic link to set your password
5. Back in Supabase, go to the **Table Editor → user_profiles**
6. Find your row and change the `role` column from `staff` to `admin`
7. Sign in to the app — you'll now see the Admin tab

From there, use the Users panel inside the app to invite your team (they'll get the role you assign automatically).

---

## Local development

```bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/quotr.git
cd quotr
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local and fill in your Supabase URL and anon key

# Start dev server
npm run dev
```

---

## Project structure

```
src/
  App.jsx              # Root — auth routing
  pages/
    Login.jsx          # Login screen
    QuoteTool.jsx      # Quote builder page
    Admin.jsx          # Admin panel (products, quotes, users, settings)
  components/
    Topbar.jsx         # Navigation bar
    ProductList.jsx    # Left panel — searchable product catalogue
    QuotePanel.jsx     # Right panel — quote builder
    AdminProducts.jsx  # Product CRUD
    AdminQuotes.jsx    # Quote history view
    AdminUsers.jsx     # Invite, promote, remove users
    AdminSettings.jsx  # Business settings
    ui.jsx             # Shared UI primitives
  hooks/
    useAuth.js         # Auth context and session
    useProducts.js     # Product data and mutations
    useQuotes.js       # Quote data and mutations
    useSettings.js     # Settings data and mutations
  lib/
    supabase.js        # Supabase client
    format.js          # Currency and date formatting
supabase/
  migrations/
    001_initial_schema.sql   # Full schema — run this once in Supabase
```

---

## Roles

| Role  | Access |
|-------|--------|
| staff | Quote Tool only — browse products, build quotes, email customers |
| admin | Everything above, plus: manage products, view all quotes, invite/manage users, settings |

---

## Upgrade path

- **More users or volume**: Upgrade Supabase to Pro ($25/mo) — no code changes needed
- **Custom domain**: Add a domain in Vercel Project Settings → Domains
- **Logo on PDFs**: PDF generation can be added as a Phase 2 feature using `@react-pdf/renderer`
- **Email sending**: Wire up [Resend](https://resend.com) via a Supabase Edge Function for sending quote PDFs
