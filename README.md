# ExpenseFlow - Production Expense Management Web Application

A modern, pitch-black business expense management web application built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, and backed by **Supabase PostgreSQL**. Deployed seamlessly on **GitHub Pages** via **GitHub Actions**.

---

## 🏗️ Tech Stack & Architecture

- **Frontend Framework**: React 18, TypeScript, Vite
- **Styling & Aesthetics**: Tailwind CSS, Pitch Black glassmorphism design system
- **Icons & Visuals**: Lucide Icons, Recharts
- **Export Engines**: SheetJS (`xlsx`) for Excel reports, `html2pdf.js` for PDF reports
- **Backend & Database**: Supabase PostgreSQL, Supabase Authentication
- **Row Level Security (RLS)**: User-level data isolation for all tables
- **Hosting & CI/CD**: GitHub Pages deployed automatically via `.github/workflows/deploy.yml`

> **Note**: This application contains zero Vercel dependencies and uses Supabase PostgreSQL as its sole production database.

---

## 📊 Database Schema & Tables

The relational PostgreSQL schema inside `supabase/migrations/20260910_initial_schema.sql` consists of:

1. `profiles` - User profile, company entity metadata, currency configuration.
2. `clients` - Client directory with total billed, paid amount, status, and calculated balance.
3. `expenses` - Detailed expense logs with category, date, payment method, notes.
4. `income` - Revenue streams tied to clients with payment status.
5. `budgets` - Category budget allocation limits and spending utilization.

Every table includes primary key UUIDs, timestamps, foreign key relationships, auto-updating `updated_at` triggers, and Row Level Security (RLS) policies (`auth.uid() = user_id`).

---

## 🚀 Quick Start & Installation

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
npm install
```

### 2. Environment Variables Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Open `.env` and set your public Supabase URL and Publishable/Anon key:

```env
VITE_SUPABASE_URL=https://<your-supabase-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...
```

---

## 🗄️ Supabase Setup & Database Migrations

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Navigate to **SQL Editor** in your Supabase Dashboard.
3. Paste and execute the contents of [`supabase/migrations/20260910_initial_schema.sql`](./supabase/migrations/20260910_initial_schema.sql).
4. Go to **Project Settings -> API** to copy your **URL** and **anon / public key** into your `.env` file.

---

## 💻 Local Development & Build Commands

- **Run Local Development Server**:
  ```bash
  npm run dev
  ```
- **Type-Check & Build Production Bundle**:
  ```bash
  npm run build
  ```
- **Preview Production Build Locally**:
  ```bash
  npm run preview
  ```

---

## 🌐 Deploying to GitHub Pages

1. **Commit and Push to GitHub**:
   ```bash
   git add .
   git commit -m "Configure ExpenseFlow with React, TypeScript, Supabase, and GitHub Pages"
   git push origin main
   ```
2. **Configure GitHub Repository Secrets**:
   - Go to **Settings -> Secrets and variables -> Actions** in your GitHub repository.
   - Add Repository Secret `VITE_SUPABASE_URL` with your Supabase URL.
   - Add Repository Secret `VITE_SUPABASE_PUBLISHABLE_KEY` with your Supabase Anon Key.
3. **Enable GitHub Pages**:
   - Go to **Settings -> Pages** in your GitHub repository.
   - Under **Build and deployment -> Source**, select **GitHub Actions**.
4. The workflow inside `.github/workflows/deploy.yml` will automatically build and publish the web application to GitHub Pages on every push to `main`.
