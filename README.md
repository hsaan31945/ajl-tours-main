# AJL Tours

Clean monorepo layout for the AJL Tours website.

## Project Structure

```text
.
├── frontend/            # React/Vite customer and admin frontend
├── backend/             # Node/Express API, models, routes, controllers, config
├── docs/                # Reports, guides, setup notes, summaries, and analysis files
├── database-backups/    # Local database exports and generated backups
├── README.md
└── .gitignore
```

## Local Development

Install dependencies from each app folder:

```bash
cd frontend
npm install
npm run dev
```

```bash
cd backend
npm install
npm run dev
```

For production-style frontend verification:

```bash
cd frontend
npm run build
```

## Environment

Do not commit `.env` files. The frontend should read API settings from Vite environment variables, and the backend should read MongoDB and service credentials from backend environment variables.

## Deployment

This repository currently supports separate frontend and backend Vercel projects:

- Frontend project root: `frontend`
- Backend project root: `backend`

Keep production secrets in Vercel environment variables, not in source control.
