# GramSeva — Village Loan Tracker
Full-stack app: HTML frontend + Node.js + Express + MongoDB

---

## 📁 Project Structure

```
gramseva/
├── backend/          ← Node.js API server
│   ├── server.js
│   ├── .env
│   ├── models/       ← MongoDB schemas
│   └── routes/       ← API endpoints
└── frontend/
    └── index.html    ← Complete frontend (open in browser)
```

---

## 🚀 Setup & Run

### Step 1 — Install Node.js
Download from https://nodejs.org and install (LTS version)

### Step 2 — Install MongoDB
**Option A: Local MongoDB**
- Download from https://www.mongodb.com/try/download/community
- Install and start the MongoDB service

**Option B: Free Cloud MongoDB (Recommended)**
- Go to https://cloud.mongodb.com
- Create free account → Create cluster (free M0)
- Click Connect → Drivers → Copy the connection string
- Replace MONGO_URI in .env with your connection string

### Step 3 — Setup Backend

```bash
cd gramseva/backend
npm install
```

Edit the `.env` file:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/gramseva
JWT_SECRET=your_secret_key_here_make_it_long
JWT_EXPIRES_IN=7d
```

### Step 4 — Start Backend

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

You should see:
```
✅ MongoDB connected
🚀 Server running on http://localhost:5000
```

### Step 5 — Open Frontend

- Open `frontend/index.html` in your browser
- OR deploy `frontend/index.html` to Netlify

---

## 🌐 Deploying for Multi-Device Access

### Backend — Deploy to Render (Free)
1. Go to https://render.com → Sign up
2. New → Web Service → Connect your GitHub repo
3. Set environment variables (PORT, MONGO_URI, JWT_SECRET)
4. Deploy → Get your URL like `https://gramseva.onrender.com`

### Frontend — Update API URL
In `frontend/index.html`, find this line near the top of the script:
```javascript
const API = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : '/api';
```
Change `'/api'` to your Render URL:
```javascript
  : 'https://gramseva.onrender.com/api';
```

Then deploy `frontend/index.html` to Netlify.

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create first account |
| POST | /api/auth/login | Login |
| POST | /api/auth/change-password | Change password |
| POST | /api/auth/reset-password | Reset forgotten password |
| GET | /api/auth/has-users | Check if accounts exist |
| GET | /api/loans | Get all loans |
| POST | /api/loans | Create loan |
| PUT | /api/loans/:id | Update loan |
| DELETE | /api/loans/:id | Delete loan |
| PATCH | /api/loans/:id/close | Close loan |
| POST | /api/loans/:id/renew | Renew loan |
| GET | /api/payments | Get all payments |
| POST | /api/payments | Add payment |
| PUT | /api/payments/:id | Edit payment |
| DELETE | /api/payments/:id | Delete payment |
| DELETE | /api/payments/loan/:id | Delete all payments for loan |
| GET | /api/expenses | Get expenses |
| POST | /api/expenses | Add expense |
| PUT | /api/expenses/:id | Edit expense |
| DELETE | /api/expenses/:id | Delete expense |
| GET | /api/capital | Get capital amount |
| POST | /api/capital | Set capital amount |
| GET | /api/users | List users |
| POST | /api/users | Add user |
| DELETE | /api/users/:id | Delete user |
