# 📬 AI Email Assistant (Backend)

An autonomous personal AI Email Assistant built with **Node.js, Express, MongoDB Atlas, Gmail API, Gemini API, and Telegram Bot API**, designed for deployment on **Render** with **cron-job.org** scheduling at ₹0 cost.

---

## 🌟 Key Features

1. **Morning Digest (7:30 AM IST):** Summarizes your recent emails, highlights critical updates and deadlines, and sends a formatted breakdown on Telegram.
2. **Periodic Detection & Urgent Alerts:** Periodically polls Gmail and immediately delivers Telegram alerts for emails classified as `important`.
3. **Conversational Natural Language Interface:** Chat with your Telegram bot naturally:
   - *"Did I receive anything from Amazon today?"*
   - *"What emails did I get from college?"*
   - *"Do I have any emails requiring action?"*
   - *"What deadlines were mentioned?"*
4. **7-Day Automatic Data Retention:** MongoDB documents automatically expire after ~7 days using **MongoDB TTL Indexes**.
5. **Absolute Email Safety:** Only uses the narrow `gmail.readonly` scope. Your original Gmail emails are **never** modified or deleted.
6. **Privacy-First AI Pipeline:** Only `subject + snippet` metadata is sent to Gemini (never full permanent email bodies).
7. **Prompt Injection Defense:** Strict system prompt isolation treats email text as untrusted data and enforces valid JSON schemas.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MongoDB Atlas (M0 Free Tier)
- **Email Source:** Gmail API via Google OAuth 2.0 (`gmail.readonly`)
- **Intelligence:** Google Gemini API (`gemini-2.0-flash`)
- **Messaging:** Telegram Bot API (Webhooks)
- **Hosting:** Render Free Web Service
- **Scheduler:** cron-job.org (Free external HTTP cron)

---

## 📁 Project Structure

```
d:/EmailAutomation/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection manager
│   │   └── env.js               # Startup environment validation
│   ├── models/
│   │   ├── Email.js             # Email metadata schema with 7-day TTL
│   │   ├── GmailState.js        # Gmail historyId tracker
│   │   └── DigestLog.js         # Daily digest idempotency log (7-day TTL)
│   ├── integrations/
│   │   ├── gmail/
│   │   │   ├── auth.js          # Google OAuth2 client & consent generator
│   │   │   ├── client.js        # Authenticated Gmail API client
│   │   │   ├── fetcher.js       # Search, fetch, and history.list operations
│   │   │   └── parser.js        # Lightweight metadata & snippet parser
│   │   ├── gemini/
│   │   │   ├── client.js        # Google Gen AI client
│   │   │   ├── classifier.js    # Classification with prompt injection defense
│   │   │   ├── intentParser.js  # Natural language intent extractor
│   │   │   └── summarizer.js    # Conversational answer generator
│   │   └── telegram/
│   │       ├── client.js        # Telegram HTTP client
│   │       ├── sender.js        # Telegram message dispatcher with retry
│   │       └── formatter.js     # Formatted digest & alert templates
│   ├── services/
│   │   ├── emailProcessor.js    # Ingestion, deduplication, AI classification
│   │   ├── digestService.js     # Morning digest compiler & idempotency
│   │   ├── queryService.js      # Dual-layer query router (MongoDB / Gmail)
│   │   └── notificationService.js # Immediate alert dispatcher
│   ├── jobs/
│   │   ├── digestJob.js         # Morning digest job handler
│   │   └── pollJob.js           # Incremental email polling job handler
│   ├── controllers/
│   │   ├── authController.js    # OAuth initiation and callback view
│   │   ├── commandHandler.js    # /start, /today, /important, /help
│   │   ├── intentHandler.js     # Natural language query controller
│   │   ├── webhookController.js # Fast-ack Telegram webhook dispatcher
│   │   └── jobController.js     # Scheduled HTTP cron endpoints
│   ├── routes/
│   │   ├── health.js            # GET /health (zero cost)
│   │   ├── auth.js              # /auth/google, /auth/google/callback
│   │   ├── webhook.js           # POST /webhook/telegram
│   │   └── jobs.js              # /jobs/digest, /jobs/poll-emails
│   ├── middleware/
│   │   ├── validateWebhook.js   # Telegram secret & chat ID whitelist
│   │   ├── validateJobSecret.js # X-Job-Secret header authenticator
│   │   └── errorHandler.js      # Global error handler
│   ├── utils/
│   │   ├── logger.js            # Structured logger with redaction
│   │   ├── retry.js             # Exponential backoff retry utility
│   │   ├── dateHelpers.js       # IST timezone calculations
│   │   └── textHelpers.js       # HTML stripping, sanitization & truncate
│   ├── app.js                   # Express application setup
│   └── server.js                # Server entrypoint
├── .env.example
├── .gitignore
└── package.json
```

---

## 🚀 Setup & Local Development

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas Free Cluster
- Google Cloud Console Project (with Gmail API enabled)
- Gemini API Key (Google AI Studio)
- Telegram Bot Token (from `@BotFather`)

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your configuration:
```env
PORT=3000
NODE_ENV=development

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GMAIL_REFRESH_TOKEN=

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_telegram_numeric_chat_id
TELEGRAM_WEBHOOK_SECRET=your_random_webhook_secret

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/ai_email_assistant?retryWrites=true&w=majority

# Scheduler Secret
JOB_SECRET=your_random_32_char_job_secret_key
```

### 3. Install & Start
```bash
npm install
npm run dev
```

### 4. One-Time Google OAuth Authorization
1. Start the server and visit `http://localhost:3000/auth/google` in your browser.
2. Sign in with your Gmail account and grant read-only permissions.
3. On the success screen, copy the `GMAIL_REFRESH_TOKEN`.
4. Paste it into your `.env` file as `GMAIL_REFRESH_TOKEN=...` and restart the server.

---

## 🌐 Render & Production Deployment

### 1. Deploy on Render
1. Create a **New Web Service** connected to your repository.
2. Set:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
3. Add all environment variables in the Render Dashboard (ensure `GOOGLE_REDIRECT_URI` matches your Render URL: `https://<your-app>.onrender.com/auth/google/callback`).

### 2. Register Telegram Webhook
Run the following curl command in your terminal:
```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://<your-app>.onrender.com/webhook/telegram" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

### 3. Configure Free Schedulers on [cron-job.org](https://cron-job.org)

Set Timezone in cron-job.org to **Asia/Kolkata**:

| Job Name | Schedule | Endpoint URL | Custom Headers |
|---|---|---|---|
| **Render Keep-Alive** | `*/10 * * * *` (Every 10 min) | `https://<your-app>.onrender.com/health` | *(None)* |
| **Morning Digest** | `30 7 * * *` (7:30 AM IST) | `https://<your-app>.onrender.com/jobs/digest` | `X-Job-Secret: <JOB_SECRET>` |
| **Email Poll** | `0 * * * *` (Hourly) | `https://<your-app>.onrender.com/jobs/poll-emails` | `X-Job-Secret: <JOB_SECRET>` |

---

## 🔒 Security Highlights

- **Principle of Least Privilege:** Requests strictly `https://www.googleapis.com/auth/gmail.readonly`.
- **Zero Exposure:** Webhook requests reject any sender other than your whitelisted `TELEGRAM_CHAT_ID`.
- **Scheduled Job Authentication:** `/jobs/*` endpoints strictly require `X-Job-Secret`.
- **Prompt Injection Defense:** Email text is isolated as untrusted data with strict JSON schema parsing and fallback handling.
- **Redacted Logging:** Tokens, passwords, and sensitive headers are censored from application logs.
