# 🏛️ Information Is Wealth
### AI-Powered Government Welfare Scheme Discovery Platform

A mobile-first Progressive Web App that helps Indian citizens discover government welfare schemes they are eligible for — in Tamil, Hindi, or English, by voice or text.

---

## 🌟 What It Does

Over 500 central and state welfare schemes exist in India. Most eligible citizens never access them because information is hard to find, in complex language, or behind scam links.

**Information Is Wealth** fixes this by:
- Matching users to schemes using 6 non-sensitive profile attributes
- Accepting voice input in Tamil, Hindi, and English
- Linking only to verified official government URLs
- Working offline on slow 2G connections
- Never asking for Aadhaar, bank details, or any sensitive data

---

## 📱 Live Demo

> Coming soon — deploy instructions below

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + Tailwind CSS (PWA) |
| Backend | FastAPI (Python) |
| Database | PostgreSQL on Supabase |
| Voice NLP | Web Speech API + keyword map |
| Scraping | BeautifulSoup + Scrapy |
| Frontend hosting | Vercel |
| Backend hosting | Render |

---

## ✨ Features

### Built (Phase 1)
- **4-step onboarding** — state, gender/caste/age, income/occupation
- **Personal scheme feed** — matched schemes based on your profile
- **Scheme detail page** — eligibility criteria, documents needed, verified apply link
- **Voice search** — speak in Tamil, Hindi, or English to find schemes
- **Multilingual UI** — English, தமிழ், हिंदी
- **Offline support** — PWA installable on phone, works on 2G
- **Profile management** — view, edit, delete your profile

### Coming (Phase 2)
- **Application tracker** — Save → Applied → History flow
- **Deadline SMS reminders** — Twilio alerts 7 days before schemes close
- **Nearby post office finder** — Geolocation-based India Post + CSC locator

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Git
- Chrome browser (for voice input)
- [Supabase](https://supabase.com) free account

---

### 1. Clone the repo

```bash
git clone https://github.com/monish-732004/Information-Is-Wealth.git
cd Information-Is-Wealth
```

---

### 2. Backend setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create your `.env` file inside `backend/`:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres
ALLOWED_ORIGINS=http://localhost:3000
APP_ENV=development
```

Get your `DATABASE_URL` from:
**Supabase → Settings → Database → Connection string → URI**

Start the backend:

```bash
py -m uvicorn app_main:app --reload
```

✅ Server runs at `http://localhost:8000`
✅ API docs at `http://localhost:8000/docs`

---

### 3. Database setup

1. Open [Supabase](https://supabase.com) → your project → **SQL Editor**
2. Run `database/schema.sql` — creates all tables and indexes
3. Run `database/seed.sql` — loads 10 real schemes

---

### 4. Frontend setup

```bash
cd frontend
npm install
```

Create `.env.local` inside `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

✅ App runs at `http://localhost:3000`

---

### 5. Test the full flow

1. Open `http://localhost:3000`
2. Click **Get Started** → complete 4-step onboarding
3. Click **See My Schemes** → matched schemes load from your Supabase DB
4. Click any scheme → view details and apply link
5. Try voice search — select Tamil and speak into the mic (Chrome only)

---

## 📁 Project Structure

```
Information-Is-Wealth/
├── backend/
│   ├── app_main.py          # FastAPI entry point
│   ├── database.py          # Supabase connection pool
│   ├── requirements.txt
│   ├── models/
│   │   └── scheme.py        # Pydantic models
│   ├── routers/
│   │   ├── health.py        # GET /health
│   │   └── schemes.py       # GET/POST /schemes/*
│   ├── services/
│   │   └── matcher.py       # is_eligible() core logic
│   └── scrapers/
│       ├── myscheme.py      # BeautifulSoup scraper
│       └── import_to_db.py  # Load scraped data to DB
│
├── frontend/
│   ├── app/
│   │   ├── page.jsx         # Home screen + voice widget
│   │   ├── onboarding/      # 4-step wizard
│   │   ├── schemes/         # Feed + [id] detail page
│   │   ├── profile/         # View/edit profile
│   │   └── search/          # Voice/text search
│   ├── components/
│   ├── lib/
│   │   └── api.js           # All fetch() calls
│   ├── package.json
│   └── next.config.js
│
└── database/
    ├── schema.sql           # CREATE TABLE statements
    └── seed.sql             # 10 initial schemes
```

---

## 🗄️ Database Schema

### Key design principle: **NULL = Universal**

A `NULL` value in any eligibility field means no restriction on that dimension.

```sql
-- Example: PM-KISAN (all farmers, any state, any caste)
applicable_states  = NULL   -- national scheme
gender             = NULL   -- any gender
caste_categories   = NULL   -- all categories
occupation_types   = ['farmer']
max_income         = NULL   -- no income cap
```

### Matching logic (Python)

```python
def is_eligible(user, scheme):
    if scheme.applicable_states and user.state not in scheme.applicable_states:
        return False
    if scheme.gender and scheme.gender != user.gender:
        return False
    if scheme.caste_categories and user.caste_category not in scheme.caste_categories:
        return False
    if scheme.min_age and user.age < scheme.min_age:
        return False
    if scheme.max_age and user.age > scheme.max_age:
        return False
    if scheme.max_income and user.income_annual > scheme.max_income:
        return False
    if scheme.occupation_types and user.occupation_type not in scheme.occupation_types:
        return False
    return True
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/schemes/match` | Match user profile to schemes |
| GET | `/schemes/{id}` | Full scheme details |
| GET | `/schemes/search?q=` | Text search schemes |
| POST | `/schemes/check/{id}` | Check eligibility + explain mismatches |
| GET | `/health` | API + DB health check |

### Example request

```bash
curl -X POST http://localhost:8000/schemes/match \
  -H "Content-Type: application/json" \
  -d '{
    "user_profile": {
      "state": "TN",
      "gender": "female",
      "caste_category": "OBC",
      "age": 28,
      "income_annual": 120000,
      "occupation_type": "unorganised_worker"
    },
    "language": "en"
  }'
```

---

## 🌱 Seeded Schemes

| Scheme | Benefit | Target |
|--------|---------|--------|
| PM-KISAN | ₹6,000/year | All farmers |
| Kalaignar Magalir Urimai Thogai | ₹1,000/month | TN women 21+ |
| NSP Post-Matric SC Scholarship | Variable | SC students |
| PMAY Gramin | ₹1.2L one-time | SC/ST/OBC/EWS |
| PM Shram Yogi Maan-Dhan | ₹3,000/month pension | Unorganised workers |
| PMEGP | Subsidy on loan | Unemployed/self-employed |
| Sukanya Samriddhi Yojana | Interest on savings | Girl child under 10 |
| NSP Pre-Matric OBC | Variable | OBC students |
| Amma Unavagam (TN) | Food subsidy | All TN residents |
| National Means-cum-Merit Scholarship | ₹12,000/year | EWS/OBC/SC/ST students |

---

## 🔒 Privacy & Trust

- ✅ No Aadhaar, PAN, bank account, or biometric data collected
- ✅ User profile stored only in localStorage on their device
- ✅ All application links verified to `.gov.in` or `.nic.in` domains
- ✅ No third-party data sharing
- ✅ Works offline — no data leaves the device after first load

---

## 🚢 Deployment

### Frontend → Vercel
1. Push code to GitHub
2. Connect repo to [Vercel](https://vercel.com)
3. Set environment variable: `NEXT_PUBLIC_API_URL=https://your-app.onrender.com`
4. Deploy

### Backend → Render
1. Connect repo to [Render](https://render.com)
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn app_main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables: `DATABASE_URL`, `ALLOWED_ORIGINS`
5. Deploy

---

## 👥 Team

| Role | Responsibilities |
|------|-----------------|
| Frontend | Home, onboarding, scheme feed, detail page, search, voice UI |
| Backend | FastAPI routes, eligibility matcher, Supabase, nearby API |
| Data / Scraping | Scraper, scheme quality, seed data, editorial review |
| Integrations | Twilio SMS, geolocation, India Post API, CSC locator |

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 🙏 Acknowledgements

- [myscheme.gov.in](https://www.myscheme.gov.in) — official scheme data source
- [Supabase](https://supabase.com) — database hosting
- [Vercel](https://vercel.com) — frontend hosting
- [Render](https://render.com) — backend hosting

---

*Built with ❤️ for the citizens of India*
