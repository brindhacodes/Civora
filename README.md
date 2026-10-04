# Civora

Civora is a civic issue reporting and resolution platform that connects citizens with local government services. Citizens can report issues with evidence and location, confirm existing reports, follow resolution journeys, and explore a live civic map. Officers receive a dedicated operational dashboard for assignments, SLA monitoring, analytics, evidence, and status updates.

## Highlights

- Smart issue reporting with image upload, map location, AI routing insight, and duplicate detection
- Live civic feed with community confirmations and complaint discussion
- Interactive Leaflet map synchronized with issue cards
- End-to-end complaint tracking and citizen resolution verification
- Government officer portal with department, priority, SLA, and resolution workflows
- English and Tamil interface support with accessibility controls
- PostgreSQL 18 database with constraints, relationships, indexes, and pooled connections

## Technology

- React 19 and Vite 8
- React Router, Leaflet, React Leaflet, and Lucide icons
- Node.js and Express 5
- PostgreSQL 18 using the `pg` driver
- Optional Google Gemini integration

## Requirements

- Node.js 22 or newer
- PostgreSQL 18 running locally or on an accessible server

## Local setup

1. Install frontend dependencies:

   ```bash
   npm install
   ```

2. Install backend dependencies:

   ```bash
   npm --prefix backend install
   ```

3. Copy the environment template:

   ```bash
   copy backend\.env.example backend\.env
   ```

   On macOS or Linux, use `cp backend/.env.example backend/.env`.

4. Edit `backend/.env` with your PostgreSQL credentials, a long random `JWT_SECRET`, and private administrator credentials. Never commit this file.

5. Create the `civora` database and schema:

   ```bash
   npm --prefix backend run init-db
   ```

6. Start the backend:

   ```bash
   npm --prefix backend run dev
   ```

7. In another terminal, start the frontend:

   ```bash
   npm run dev
   ```

Open `http://localhost:5177`. The API health endpoint is `http://localhost:3000/api/health`.

## Environment variables

The complete template is in `backend/.env.example`.

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME` | PostgreSQL server and database |
| `DB_USER`, `DB_PASSWORD` | PostgreSQL credentials |
| `JWT_SECRET` | Signs authentication tokens; use a long random value |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Private officer account identity |
| `GEMINI_API_KEY` | Optional AI chatbot and description analysis |
| `DB_SSL` | Enables PostgreSQL TLS when set to `true` |

The frontend can use `VITE_API_URL` to override its default API URL of `http://localhost:3000/api`.

## Quality checks

```bash
npm run lint
npm test
npm run build
npm audit --omit=dev
npm --prefix backend audit
```

## Repository safety

Local environment files, database credentials, dependency folders, generated builds, uploaded files, logs, and coverage artifacts are excluded through `.gitignore`. Review staged files before every push and never commit private API keys or passwords.

## License

Licensed under the MIT License. See `LICENSE`.
