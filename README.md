# Smart Campus Lost & Found System (AI-Powered)

An autonomous, multimodal Lost & Found platform designed for university campuses. Built with React (Vite), Tailwind CSS, Node.js/Express, PostgreSQL, and Google's `@google/genai` SDK using `gemini-2.5-flash`.

---

## 🚀 Key Features

* **Multimodal Reporting (`/report/lost`, `/report/found`):** Submit reports with images, detailed descriptions, event locations, timestamps, and contact info.
* **Automated AI Matching Engine:** Compares candidates using Gemini 2.5 Flash multimodal reasoning across visual characteristics, text, location adjacency, and event timelines.
* **Confidence Scoring & Explanations:** Real-time 0–100% confidence scores with color-coded badges (Green >80%, Amber 50-80%, Rose <50%) and logical AI explanations.
* **Interactive Search & Discovery (`/search`):** Real-time text search with debounce, category filters (Electronics, Clothing, IDs & Wallets, Books, Keys, Accessories, Miscellaneous), and status filtering.
* **Item Match Dashboard (`/item/:id`):** Deep comparison view showing top candidate matches, confidence score badges, AI reasoning breakdown, and manual re-trigger button.

---

## 🛠️ Tech Stack

* **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, React Hook Form, Zod Resolver.
* **Backend:** Node.js, Express, TypeScript, Zod, CORS.
* **Database:** PostgreSQL with parameterized SQL queries (`pg` pool).
* **AI Model:** Google Gemini 2.5 Flash via `@google/genai` SDK with strict JSON `responseSchema`.

---

## 📂 Project Structure

```text
├── database/
│   └── schema.sql              # Production PostgreSQL schema (items & item_matches)
├── backend/
│   ├── src/
│   │   ├── controllers/        # Request handlers (item.controller.ts)
│   │   ├── routes/             # Express routes (item.routes.ts)
│   │   ├── services/           # DB service (db.service.ts) & AI engine (ai.service.ts)
│   │   ├── schemas/            # Zod validation schemas (item.schema.ts)
│   │   └── server.ts           # Express server with security limits & CORS
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Layout, ItemCard, MatchScoreBadge, ReportForm, MatchList, SearchBar
│   │   ├── pages/              # HomePage, ReportLostPage, ReportFoundPage, SearchPage, ItemDetailPage
│   │   ├── lib/                # API client (api.ts) & TypeScript types (types.ts)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── .env                        # Active environment configuration
├── .env.example                # Environment template
└── package.json                # Root package with unified dev runner
```

---

## ⚡ Quick Start

### 1. Database Setup
PostgreSQL database `campus_lost_found` is configured. To re-run migrations manually:
```bash
psql -d campus_lost_found -f database/schema.sql
```

### 2. Environment Variables
Edit `.env` (or copy from `.env.example`):
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/campus_lost_found
GEMINI_API_KEY=your_google_gemini_api_key_here
```
*(Note: If `GEMINI_API_KEY` is not provided, the system activates an analytical campus heuristic matcher fallback so the app functions seamlessly in offline/testing mode).*

### 3. Run Development Servers
From the root directory:
```bash
npm run dev
```
Or start each service independently:
```bash
# Start Backend (Port 3000)
cd backend && npm run dev

# Start Frontend (Port 5173)
cd frontend && npm run dev
```

* Frontend: `http://localhost:5173`
* Backend API: `http://localhost:3000`
* Health Check: `http://localhost:3000/health`

---

## 🌐 How to Deploy to Vercel

The application is fully pre-configured for Vercel with `vercel.json` and serverless database integration.

### Step 1: Set Up Cloud PostgreSQL Database (Free)
Because Vercel is a serverless platform, it connects to a hosted PostgreSQL instance:
1. Go to **[Neon.tech](https://neon.tech)** (or Supabase) and create a free account.
2. Create a new project (e.g., `smart-campus-lost-found`).
3. Copy your connection string (`postgresql://username:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`).
4. In the Neon SQL Editor, paste and run the contents of [`database/schema.sql`](database/schema.sql) (the backend will also auto-verify tables on first run).

### Step 2: Deploy on Vercel
1. Go to **[vercel.com](https://vercel.com)** and sign in with your GitHub account.
2. Click **"Add New..."** -> **"Project"**.
3. Select your repository: **`Smart-Campus-Lost-and-Found`**.
4. Configure the **Environment Variables** in Vercel:
   * `DATABASE_URL`: Your Neon/Supabase PostgreSQL connection string.
   * `GEMINI_API_KEY`: Your Google Gemini API key from [Google AI Studio](https://aistudio.google.com/).
   * `NODE_ENV`: `production`
5. Click **"Deploy"**.

Vercel will automatically build the Vite React frontend and route `/api/*` to the serverless Express backend. Your app will be live with an SSL-enabled `.vercel.app` URL!

