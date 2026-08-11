# NeighborCare — Community Senior Assistance

Full implementation of the NeighborCare blueprint: a MERN-style app connecting Seniors,
Volunteers, and an Admin through city + 2–4 km spatial matching, voice-assisted requests,
and a 4-digit PIN handshake for safe task verification.

```
neighborcare/
├── backend/     Express + MongoDB (Mongoose) REST API
└── frontend/    React (Vite) app — Landing, Auth, Senior, Volunteer, Admin portals
```

## 1. Prerequisites

- Node.js 18+
- A MongoDB database (MongoDB Atlas free tier works well — geospatial `2dsphere` indexes
  are created automatically by the Mongoose schemas on first run)
- A Google Cloud OAuth 2.0 **Web application** Client ID (for the "Sign in with Google" button)
  - Google Cloud Console → APIs & Services → Credentials → Create Credentials → OAuth client ID
  - Authorized JavaScript origin: `http://localhost:5173` (dev) and your production domain
  - Authorized redirect isn't needed for the `@react-oauth/google` implicit flow used here

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, GOOGLE_CLIENT_ID
npm run dev      # starts on http://localhost:5000
```

## 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
# edit .env: set VITE_GOOGLE_CLIENT_ID to the SAME Google Client ID as the backend
npm run dev      # starts on http://localhost:5173, proxies /api to the backend
```

Open http://localhost:5173.

## 4. Becoming the Admin

Register (manually or via Google) using the email **`ranjithrachna6@gmail.com`**. The backend
automatically assigns `role: 'ADMIN'` for that exact email, per the blueprint's special role logic,
and routes you straight to `/admin`. Any other email registers as `SENIOR` or `VOLUNTEER`
depending on which tab was selected on the Auth Portal.

## 5. Core flows implemented

- **Landing (`/`)** — hero, trust/safety cards, live impact bar (real counts from `/api/public/stats`)
- **Auth Portal (`/login-register`)** — role tabs, Google OAuth (`GoogleLogin`) with first-login
  onboarding prompt for city/phone/address/GPS, manual email/password registration & login,
  GPS capture via `navigator.geolocation`
- **Senior Portal (`/senior`)** — category cards, Web Speech API voice-to-text, request creation,
  live status card with assigned volunteer + large 4-digit PIN display, polling every 8s
- **Volunteer Portal (`/volunteer`)** — city-scoped + 1–4 km radius feed (MongoDB `$near` on a
  `2dsphere` index), claim flow, masked contact via `tel:` links, on-site PIN verification,
  karma stats (hours, tasks completed, badges)
- **Admin Portal (`/admin`)** — user verification/moderation table, live task monitor with status
  override, SOS/incident log (high-urgency tasks with emergency contacts), city coverage &
  response-time analytics

## 6. Notes & things to configure for production

- The **SOS 911 button** is a `tel:911` link everywhere in the UI — update the number if deploying
  outside a region where 911 is correct.
- Volunteer government ID upload (`idProofUrl`) is modeled in the schema but the upload UI is not
  wired up — add a file-upload step (e.g. to S3/Cloudinary) and set `idProofUrl` at registration,
  then surface it in the Admin "User Verification" table for review before calling `PATCH
  /api/admin/users/:id/verify`.
- JWTs are stored in `localStorage`; move to httpOnly cookies if you need CSRF-hardened sessions.
- The PIN-verification flow in this implementation moves a task directly from `ASSIGNED` →
  `COMPLETED` (the spec's `IN_PROGRESS` state exists in the schema and admin overrides, but the
  volunteer flow treats PIN entry as "job's done" — split this into two calls if you want an
  explicit in-progress window).
