# GitHub Release Notification API

An API that allows users to subscribe to email notifications about new releases of a chosen GitHub repository.

## Features

- Subscribe to release notifications for any public GitHub repository
- Email confirmation flow (double opt-in)
- One-click unsubscribe via email link
- Background scanner polls GitHub for new releases
- Deduplicates API calls — one fetch per repo regardless of subscriber count
- Rate-limit handling for GitHub API (429 backoff)
- HTML-escaped email templates to prevent injection

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/subscribe` | Subscribe to release notifications |
| `GET` | `/api/confirm/:token` | Confirm email subscription |
| `GET` | `/api/unsubscribe/:token` | Unsubscribe from notifications |
| `GET` | `/api/subscriptions?email=` | List active subscriptions for an email |

Full API documentation is available in [swagger.yaml](swagger.yaml).

## Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/denystretiak745-rgb/github-release-notifier)

The repo includes a `render.yaml` blueprint that provisions:
- **Web service** (free tier) — runs the Node.js API
- **PostgreSQL database** (free tier) — stores subscriptions

After deploying, set these environment variables in the Render dashboard:
- `APP_BASE_URL` — your Render service URL (e.g. `https://github-release-notifier-xxxx.onrender.com`)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` — your SMTP credentials for sending emails
- `GITHUB_TOKEN` (optional) — raises GitHub API rate limit from 60 to 5000 req/hr

## Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/denystretiak745-rgb/github-release-notifier.git
cd github-release-notifier

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your SMTP credentials and optional GitHub token

# Start the application
docker compose up --build
```

The API will be available at `http://localhost:3000`.

## Local Development

### Prerequisites

- Node.js 22+
- PostgreSQL 16+

### Setup

```bash
npm install

# Start PostgreSQL (via Docker or locally)
docker compose up -d db

# Create .env from example
cp .env.example .env
# Update DATABASE_URL if needed

# Run in development mode (with auto-reload)
npm run dev
```

### Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the production server |
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm test` | Run unit tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run migrate` | Run database migrations manually |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `HOST_PORT` | Docker host port mapping | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `GITHUB_TOKEN` | GitHub API token (raises rate limit from 60 to 5000 req/hr) | — |
| `SMTP_HOST` | SMTP server hostname | — |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username / from address | — |
| `SMTP_PASS` | SMTP password | — |
| `APP_BASE_URL` | Base URL for confirm/unsubscribe links in emails | `http://localhost:3000` |
| `SCAN_INTERVAL_MS` | Release scanner polling interval in milliseconds | `300000` (5 min) |

## Architecture

```
src/
├── config/          # Environment, database, and migration config
├── middlewares/      # Request logging and error handling
├── repositories/     # Database access layer (SQL queries)
├── routes/           # Express route handlers
├── services/         # Business logic
│   ├── subscriptionService.js   # Subscribe/confirm/unsubscribe logic
│   ├── githubService.js         # GitHub API integration
│   ├── emailService.js          # Email sending via nodemailer
│   └── releaseScanner.js        # Background release polling job
├── utils/            # Validators, HTML escaping
├── app.js            # Express app setup
└── server.js         # Entry point (migrations + server start)
```

**Data flow:**

1. User subscribes via `POST /api/subscribe`
2. Service validates input, checks repo on GitHub, saves to DB
3. Confirmation email is sent with a unique token
4. User clicks confirm link → subscription becomes active
5. Background scanner polls GitHub for new releases every 5 minutes
6. On new release: notification email sent, `last_seen_tag` updated

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

Tests use Jest with mocked dependencies (no database or external services needed).

## License

ISC
