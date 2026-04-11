# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in ReadYourLabels, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, email: **hello@readyourlabels.in** *(or contact the repo owner directly via GitHub)*

Please include:
- A clear description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix (optional)

We will acknowledge your report within 48 hours and aim to resolve confirmed vulnerabilities within 14 days.

---

## Scope

The following are in scope for security reports:

- `ryl-six.vercel.app` (production web app)
- Vercel serverless API endpoints (`/api/*`)
- Firebase Firestore data exposure
- Authentication bypass (Firebase Auth)
- API key exposure or leakage

The following are out of scope:

- Denial of service attacks
- Rate limiting bypass (we have Vercel and Gemini API limits in place)
- Issues in third-party services (Firebase, Vercel, Google) — report those to the respective vendors

---

## Security Measures in Place

- All API keys stored exclusively in Vercel environment variables — never in source code
- Firebase Firestore security rules restrict client-side access; sensitive writes go through Admin SDK on the server
- Gemini API key restricted to Generative Language API only
- CORS headers enforced on all serverless endpoints
- No sensitive user data (passwords, payment info) stored — Firebase Auth handles authentication
- Admin dashboard protected by a secret token (`ADMIN_TOKEN`)

---

## Supported Versions

Only the latest production deployment at `ryl-six.vercel.app` is actively maintained and supported.
