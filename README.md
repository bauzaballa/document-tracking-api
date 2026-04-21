# Document Tracking API

REST API for document tracking and task management. Handles tasks, checklists, file attachments, forms, requests, notifications, real-time chat, calendar events, and performance targets. Part of a larger multi-service architecture.

## Stack

- Node.js, Express
- Sequelize, PostgreSQL
- Socket.io (real-time)
- AWS S3 (file storage)
- SendGrid (email notifications)
- Google APIs (calendar integration)
- node-cron (scheduled jobs)

## Setup

```bash
cp .env.example .env
npm install
npm run migrate
npm run seeders
npm run dev
```

## Environment Variables

```ini
SERVER_PORT=
NODE_ENV=
API_KEY=

DB_NAME=
DB_USER=
DB_HOST=
DB_PASSWORD=
DB_PORT=

AUTH_API_URL=
AUTH_API_KEY=

SENDGRID_API_KEY=
MAIL_SENDER=

AWS_BUCKET_NAME=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

GOOGLE_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_API_URL=

MICROSERVICE_SOCKET_URL=
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run start` | Production server |
| `npm run migrate` | Run migrations |
| `npm run migrate:rollback` | Rollback last migration |
| `npm run seeders` | Run all seeders |
