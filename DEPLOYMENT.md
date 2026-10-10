# JakeResume Production Deployment Guide

This guide details the end-to-end procedure for deploying JakeResume to **Vercel** (Serverless Frontend + API) with **MongoDB Atlas** persistence and **Google OAuth 2.0** identity verification.

---

## 1. Environment Variables Reference

| Variable | Side | Required | Purpose & Sourcing |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Server | **Yes** | Set to `production`. Enables strict security, secure cookies, and suppresses error stack traces. |
| `JWT_SECRET` | Server | **Yes** | Cryptographic secret for signing session JWTs (`HS256`). Must be $\ge 32$ characters. Generate via `openssl rand -hex 32`. |
| `MONGODB_URI` | Server | **Yes** | MongoDB Atlas connection string (`mongodb+srv://...`). Includes dedicated credentials and database name. |
| `GOOGLE_CLIENT_ID` | Server | **Yes** | Google Cloud OAuth 2.0 Client ID for server-side token payload and audience verification. |
| `CLIENT_URL` | Server | Optional | Canonical production origin (e.g. `https://resume.yourdomain.com`). Used for CORS verification. Defaults to matching same-origin and `*.vercel.app`. |
| `LATEX_COMPILER_URL`| Server | Optional | Upstream LaTeX compilation service endpoint. Defaults to `https://latexonline.cc/compile`. |
| `PORT` | Server | Optional | Express listening port (used for local standalone server; Vercel serverless ignores this). Defaults to `5001`. |
| `VITE_GOOGLE_CLIENT_ID` | Client | **Yes** | Public Google Client ID exposed to browser for Google Identity Services initialization. Matches `GOOGLE_CLIENT_ID`. |

> **IMPORTANT**: In Vite, any client-side environment variable starting with `VITE_` is baked into static assets at build time. Whenever `VITE_GOOGLE_CLIENT_ID` is changed in Vercel settings, you **must trigger a full redeployment** for changes to take effect.

---

## 2. Google Cloud Setup (Authentication)

1. **Create/Select Project**: Open the [Google Cloud Console](https://console.cloud.google.com/) and navigate to **APIs & Services** > **Credentials**.
2. **OAuth Consent Screen**:
   - User Type: **External**.
   - App Name: `JakeResume Builder`.
   - User Support Email & Developer Contact Email: Admin email.
   - Scopes: Request standard `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
   - **Publishing Status**: Switch the app from **Testing** to **In Production** (or add authorized test accounts). If left in Testing mode, unlisted users cannot sign in.
3. **Create OAuth 2.0 Client ID**:
   - Application Type: **Web application**.
   - Name: `JakeResume Web Client`.
   - **Authorized JavaScript origins**:
     - Local: `http://localhost:5173`
     - Production: `https://<your-project>.vercel.app` (and custom domain if used).
   - **Authorized redirect URIs**: Leave empty (JakeResume uses Google Identity Services One Tap / popup credential callbacks).
4. **Copy Client ID**:
   - Provide to server as `GOOGLE_CLIENT_ID`.
   - Provide to client build as `VITE_GOOGLE_CLIENT_ID`.

---

## 3. MongoDB Atlas Configuration

1. **Cluster Provisioning**:
   - Choose a shared or dedicated cluster on MongoDB Atlas.
   - **Region selection**: Select the AWS/GCP region closest to your Vercel Function region (e.g., `us-east-1` / `iad1`) to minimize network latency on connection handshakes.
2. **Dedicated Database User**:
   - Navigate to **Security** > **Database Access**.
   - Click **Add New Database User**.
   - Authentication Method: **Password**.
   - User Privileges: Select **Built-in Role** > **Specific Privileges** -> Grant `readWrite` access **only** to the production database (e.g., `jakeresume_prod`). Do **not** grant `atlasAdmin`.
3. **Network Access**:
   - Navigate to **Security** > **Network Access**.
   - Click **Add IP Address**.
   - For Vercel Serverless Functions (dynamic egress IPs), add `0.0.0.0/0` (Allow Access from Anywhere) with strong password authentication, or configure Atlas AWS Peering if using an Enterprise Vercel plan.
4. **Connection String**:
   - Click **Connect** > **Drivers** (Node.js 5.5+).
   - Format: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/jakeresume_prod?retryWrites=true&w=majority`.
5. **Backups & Scaling**:
   - Automated continuous backups depend on Atlas tier (M0 free tier does not include point-in-time recovery; M10+ recommended for production reliability).

---

## 4. Vercel Project Setup

1. **Import Git Repository**:
   - In the Vercel dashboard, click **Add New** > **Project** and import the repository.
2. **Build & Output Settings**:
   - **Framework Preset**: Vite.
   - **Root Directory**: `./` (leave default).
   - **Build Command**: `cd client && npm run build` (handled automatically by `vercel.json`).
   - **Output Directory**: `client/dist`.
3. **Serverless Functions**:
   - `api/index.js` acts as the serverless Express entry point.
   - Configured in `vercel.json` with `maxDuration: 60` seconds to accommodate external LaTeX rendering latency.
4. **Environment Variables Configuration**:
   - Go to **Settings** > **Environment Variables**.
   - Add the following for **Production** and **Preview** environments:
     - `NODE_ENV` = `production`
     - `JWT_SECRET` = `<generated-32+-char-secret>`
     - `MONGODB_URI` = `mongodb+srv://...`
     - `GOOGLE_CLIENT_ID` = `...apps.googleusercontent.com`
     - `VITE_GOOGLE_CLIENT_ID` = `...apps.googleusercontent.com`
     - `CLIENT_URL` = `https://<your-domain>.vercel.app`
5. **Deploy**:
   - Trigger deployment from the branch or CLI (`vercel --prod`).

---

## 5. Post-Deployment Verification (Smoke Test)

Run the automated smoke test script against the deployed live URL:

```bash
node scripts/smoke.js https://<your-app>.vercel.app
```

The script verifies:
1. `GET /`: Returns `200 OK` with HTML content.
2. Security Headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and frame protection.
3. `GET /api/health`: Returns `200 OK` with `{ ok: true, time, db: "up", google: true }`.
4. `POST /api/auth/register`: Returns `404 Not Found` (legacy routes disabled).
5. `GET /api/resumes`: Returns `401 Unauthorized` without credentials.
6. `POST /api/compile`: Returns `400 Bad Request` on empty payload.
7. `POST /api/compile`: Returns `413 Payload Too Large` when body exceeds 200 KB limit.
8. `GET /api/unknown`: Returns `404 Not Found` JSON.

---

## 6. Rollback & Secret Rotation Procedures

### Instant Rollback
1. In the Vercel dashboard, go to the **Deployments** tab.
2. Find the previous healthy deployment.
3. Click the **...** menu and select **Instant Rollback** (or **Promote to Production**).

### Secret Rotation
1. **JWT Secret (`JWT_SECRET`)**:
   - Generate a new secret: `openssl rand -hex 32`.
   - Update `JWT_SECRET` in Vercel settings.
   - Redeploy.
   - *Impact*: Active user sessions will be invalidated and prompted to sign in again. Guest data is stored locally in client `localStorage` and is completely unaffected.
2. **MongoDB Credentials**:
   - In MongoDB Atlas, create a new user or update password.
   - Update `MONGODB_URI` in Vercel environment variables.
   - Trigger deployment redeploy.
   - Once verified healthy via `/api/health`, delete the old Atlas user credentials.
3. **Google Client ID (`GOOGLE_CLIENT_ID` & `VITE_GOOGLE_CLIENT_ID`)**:
   - Create a new Client ID in Google Cloud Console.
   - Update both `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` in Vercel.
   - **Trigger a full redeployment** (client bundle bake).

---

## 7. Known Production Architecture Limitations

1. **Per-Instance In-Memory Rate Limiting**:
   - Rate limiters (`express-rate-limit`) run in-memory within each serverless function instance. On serverless platforms with horizontal container autoscaling, distinct lambdas maintain independent memory counters. If stricter global rate limiting is required, configure Vercel Edge Middleware or Upstash Redis.
2. **Guest Mode Storage Isolation**:
   - Guest resumes live entirely within browser `localStorage` (`jakeresume:guest:v1`). Guest data is device-specific, does not sync across devices or browsers, and will be cleared if browser website storage is purged.
3. **Concurrent Multi-Tab Edits (Last-Write-Wins)**:
   - Account mode updates sync via debounced REST PUT requests. If a user edits the same profile across multiple open tabs simultaneously, the last written state overwrites earlier saves.
4. **Third-Party LaTeX Compilation Dependency**:
   - PDF compilation depends on the external compiler host (`latexonline.cc` by default). Outages or network latency on the upstream service will result in compilation failure/timeout modals. For enterprise stability, deploy a self-hosted LaTeX microservice container and point `LATEX_COMPILER_URL` to it.
