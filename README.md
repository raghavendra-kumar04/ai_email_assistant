# 📬 AI Email Assistant — Autonomous Personal Intelligence Engine

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18+-68a063?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-4.21-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB_Atlas-7--Day_TTL-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Google_Gemini-3.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Groq_LPU-Llama_3.3_70B-F55036?style=for-the-badge&logo=groq&logoColor=white" alt="Groq" />
  <img src="https://img.shields.io/badge/Telegram_Bot-Interactive_UI-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram" />
  <img src="https://img.shields.io/badge/Cost-%E2%82%B90_Free_Forever-brightgreen?style=for-the-badge" alt="Free Tier" />
</p>

An autonomous personal AI Email Intelligence Assistant that continuously monitors your Gmail inbox, classifies emails with **Google Gemini 3.5 Flash** and **Groq LPU (Llama 3.3 70B)** (with automatic fallback to **Gemini 3.5 Flash Lite**), sends smart **Telegram Digests & Alerts**, tracks **Campus Placement & Career Opportunities**, generates **1-Tap AI Reply Drafts**, and answers natural language questions conversationally — **100% within free-tier cloud limits at ₹0/month**.

---

## 📑 Table of Contents
- [✨ Key Superpowers](#-key-superpowers)
- [🏛️ System Architecture](#️-system-architecture)
- [🤖 Interactive Telegram Experience](#-interactive-telegram-experience)
- [📋 Slash Commands & Natural Language](#-slash-commands--natural-language)
- [💰 Zero-Cost Quota Analysis](#-zero-cost-quota-analysis)
- [📁 Project Structure](#-project-structure)
- [🚀 Quickstart & Local Setup](#-quickstart--local-setup)
- [🛡️ Security Checklist & Vulnerability Mitigations](#️-security-checklist--vulnerability-mitigations)
- [🌐 24/7 Cloud Deployment](#-247-cloud-deployment)
- [🔒 Security & Privacy Guarantees](#-security--privacy-guarantees)

---

## ✨ Key Superpowers

* **📬 Daily Morning Digest (7:30 AM IST):** A structured, executive summary of all incoming communications, priority categorization, action items, and due dates delivered directly to Telegram.
* **🚨 Real-Time Urgent Action Alerts:** Immediate push notifications for critical security alerts, high-priority matters, and urgent action items.
* **🔘 Interactive Inline Action Buttons:** Every Telegram alert includes direct interactive buttons:
  * `[ 🔗 Open in Gmail ]` — Deep-links directly to the exact email thread in Gmail.
  * `[ ✅ Mark Done ]` — Instantly marks pending tasks resolved in MongoDB with 1 tap.
  * `[ ✍️ Draft Quick Reply ]` — Triggers Gemini to draft 3 tailored response options.
* **✍️ 1-Tap AI Reply Drafter (`/reply`):** Automatically drafts 3 distinct, professional email replies (Acceptance, Request Details, Polite Decline) formatted in monospace tap-to-copy code blocks.
* **🎓 Campus Placement & Career Tracker (`/placements`):** Intelligent entity resolution for Training & Placement Office (TPO) notices, internship drives, eligibility criteria, and deadlines.
* **🌙 Smart Night Mode (DND Window):** Silences non-urgent alerts between **11:00 PM and 7:00 AM IST**, cleanly bundling them into your 7:30 AM Morning Digest.
* **📊 Weekly Executive Retrospective (`/weekly`):** Retrospective delivered every **Sunday at 8:00 PM IST** analyzing 7-day volume, completed tasks, and upcoming deadlines.
* **⚡ Sub-Second Intent Routing with Groq LPU:** Natural conversational chat powered by Llama 3.3 70B with automatic fallback to Gemini 3.5 Flash.
* **🔒 Privacy-First Zero-Body Permanent Storage:** Stores only sanitized metadata & snippets in MongoDB with an automatic **7-Day TTL (Time-To-Live)**. Original Gmail emails are never altered or deleted (`gmail.readonly` scope).

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    A["Gmail API (OAuth 2.0 - Read-Only)"] -->|Incremental Sync via history.list| B["Email Fetcher & Metadata Parser"]
    B -->|Sanitize & Extract Snippet| C["Google Gemini 3.5 Flash Classifier"]
    
    C -->|Structured JSON Assessment| D{"Category & Priority"}
    
    D -->|Important / High Action| E["Immediate Telegram Alert (with Action Buttons)"]
    D -->|Informational / General| F["Database Ingestion Queue"]
    
    E --> F
    F --> G[("MongoDB Atlas (M0 Free Tier)<br/>7-Day TTL Auto-Purge")]
    
    G -->|Morning 7:30 AM & Sunday 8:00 PM Digests| H["Telegram Bot (Owner Chat ID)"]
    E -->|Push Alert with Interactive Buttons| H
    
    H -->|User Questions & Slash Commands| I["Groq LPU (Llama 3.3 70B) Intent Parser"]
    I -->|MongoDB Query + Live Gmail Search| J["Gemini Conversational Summarizer"]
    J -->|Natural Answers & 3-Option Reply Drafts| H
```

---

## 🤖 Interactive Telegram Experience

### 1. Real-Time Important Email Alerts
```text
🚨 Important Email Alert

👤 From: Training & Placement Officer
📌 Subject: Campus Recruitment Drive — Registration Link
🕒 Received: 10:45 AM IST

📝 AI Summary:
Registration is open for the upcoming campus recruitment drive for final year students. Mandatory registration required before the deadline.

⚡ Action Needed: Fill out the application form
⏰ Deadline: 2026-10-10

[ 🔗 Open in Gmail ]   [ ✅ Mark Done ]
[ ✍️ Draft Quick Reply ]
```

### 2. 1-Tap AI Reply Drafter (`/reply`)
```text
📬 AI Reply Suggestions for: "Campus Recruitment Drive"
To: Placement Office

━━━━━━━━━━━━━━━━━━━━━
Option 1: Quick Acceptance / Confirmation
```text
Dear Placement Team,

Thank you for sharing the details regarding the recruitment drive. I have successfully submitted my registration form along with the required documents.

Best regards,
[Your Name]
```

━━━━━━━━━━━━━━━━━━━━━
Option 2: Acknowledgement / Request Details
```text
Dear Sir/Madam,

Thank you for the update. Could you please clarify the eligibility criteria and reporting timeline for this drive?

Best regards,
[Your Name]
```
💡 Tap any block to copy, then paste directly into Gmail!
```

---

## 📋 Slash Commands & Natural Language

### 🎮 Available Slash Commands
| Command | Description | What It Does |
| :--- | :--- | :--- |
| **`/today`** | Today's Overview | Displays a breakdown and count of all emails received today. |
| **`/important`** | High-Priority Mails | Lists all flagged critical communications from the last 7 days. |
| **`/actions`** | Pending Action Items | Shows all active emails requiring a reply, submission, or payment. |
| **`/done <keyword>`** | Resolve Action Item | Marks matching task resolved in MongoDB (e.g. `/done Project` or `/done Application`). |
| **`/reply <keyword>`** | Draft AI Replies | Generates 3 professional response options for any matching email. |
| **`/placements`** | Campus / TPO Tracker | Aggregates campus recruitment circulars, deadlines, and drive links. |
| **`/weekly`** | 7-Day Retrospective | Comprehensive review of processed volume, completed items, and upcoming dates. |
| **`/summary`** | Inbox Stats | Statistical overview across important, action, and informational categories. |
| **`/sync`** | Manual Refresh | Forces an instant live sync of recent Gmail messages. |
| **`/help`** | Help Menu | Comprehensive command reference and guide. |

### 💬 Natural Language Questions You Can Ask
You don't need strict syntax! Just type naturally:
* *"Did the placement office send any updates today?"*
* *"What deadlines do I have approaching this week?"*
* *"Did I receive an invoice or receipt from Amazon?"*
* *"Show me emails that require my immediate reply"*
* *"Summarize all updates from professors or project leads today"*

---

## 💰 Zero-Cost Quota Analysis

Designed specifically for **100+ emails/day** with massive headroom on free tiers:

| Provider | Metric | Free Tier Daily Limit | App Daily Usage | Headroom % |
| :--- | :--- | :--- | :--- | :--- |
| **Gmail API** | Quota Units | **1,000,000 units/day** | ~600 units/day | **99.94% Free** 🟢 |
| **Google Gemini API** | AI Calls | **1,500 requests/day** | ~125 requests/day | **91.70% Free** 🟢 |
| **Groq Cloud** | Intent Parsing | **14,400 requests/day** | ~30 requests/day | **99.79% Free** 🟢 |
| **Telegram API** | Bot Messages | **Unlimited** | ~35–50 msgs/day | **100% Free** 🟢 |
| **MongoDB Atlas** | Storage | **512 MB Storage** | ~3.1 MB (with 7-Day TTL) | **99.40% Free** 🟢 |

---

## 📁 Project Structure

```text
EmailAutomation/
├── scripts/
│   └── check-build.js               # Automated build & configuration sanity checks
├── src/
│   ├── config/
│   │   ├── database.js              # MongoDB Atlas connection lifecycle
│   │   └── env.js                   # Strict environment variable validator
│   ├── controllers/
│   │   ├── authController.js        # Google OAuth2 authorization & token display
│   │   ├── callbackHandler.js       # Telegram inline button handler ([Done], [Reply])
│   │   ├── commandHandler.js        # Slash command router (/today, /actions, /placements, etc.)
│   │   ├── intentHandler.js         # Natural language conversational controller
│   │   ├── jobController.js         # Scheduled HTTP cron endpoints with secret auth
│   │   └── webhookController.js     # Fast-ack Telegram webhook router
│   ├── integrations/
│   │   ├── gemini/
│   │   │   ├── client.js            # Gemini SDK client with stable fallback cascade
│   │   │   ├── classifier.js        # AI classification with prompt injection defense
│   │   │   ├── intentParser.js      # Gemini fallback intent extraction engine
│   │   │   └── summarizer.js        # Conversational answer & digest synthesis
│   │   ├── gmail/
│   │   │   ├── auth.js              # OAuth2 consent URL & token exchange
│   │   │   ├── client.js            # Authenticated Google OAuth client
│   │   │   ├── fetcher.js           # Search, fetch, and paginated history.list operations
│   │   │   └── parser.js            # Zero-payload attachment name & metadata parser
│   │   ├── groq/
│   │   │   ├── client.js            # Groq LPU SDK client
│   │   │   └── intentParser.js      # Sub-second Llama 3.3 70B intent parser
│   │   └── telegram/
│   │       ├── client.js            # Telegram Bot API client & setMyCommands menu
│   │       ├── formatter.js         # Alert templates, inline keyboards & digest formats
│   │       ├── polling.js           # Local dev long-poller (no ngrok required)
│   │       └── sender.js            # Telegram dispatcher with auto 4096-char chunking
│   ├── jobs/
│   │   ├── digestJob.js             # Morning digest job handler
│   │   ├── pollJob.js               # Incremental email polling job handler
│   │   └── scheduler.js             # Internal timer scheduler (Hourly, 7:30 AM, Sunday 8 PM)
│   ├── middleware/
│   │   ├── errorHandler.js          # Global centralized error handler
│   │   ├── validateJobSecret.js     # X-Job-Secret header authenticator
│   │   └── validateWebhook.js       # Telegram secret & chat ID whitelist firewall
│   ├── models/
│   │   ├── DigestLog.js             # Idempotency digest log (7-Day TTL)
│   │   ├── Email.js                 # Structured email schema (7-Day TTL index)
│   │   └── GmailState.js            # Incremental historyId pointer & bot statistics
│   ├── routes/
│   │   ├── auth.js                  # /auth/google, /auth/google/callback
│   │   ├── health.js                # GET /health (zero-cost keep-alive)
│   │   ├── jobs.js                  # /jobs/digest, /jobs/poll-emails
│   │   └── webhook.js               # POST /webhook/telegram
│   ├── services/
│   │   ├── digestService.js         # Morning digest compiler with idempotency
│   │   ├── emailProcessor.js        # Batch ingestion, classification, and urgent alerts
│   │   ├── notificationService.js   # Immediate alert dispatcher with DND window check
│   │   ├── placementService.js      # Campus recruitment & career notices aggregator
│   │   ├── queryService.js          # Dual-layer query engine (MongoDB + Gmail fallback)
│   │   ├── replyService.js          # 3-option AI quick reply generator
│   │   └── weeklyService.js         # 7-day retrospective & deadline compiler
│   ├── utils/
│   │   ├── dateHelpers.js           # IST timezone, formatters & isDndActive()
│   │   ├── logger.js                # Pino structured logging with token redaction
│   │   ├── retry.js                 # Exponential backoff with jitter
│   │   └── textHelpers.js           # HTML strip, sanitization & truncate utilities
│   ├── app.js                       # Express app configuration & middleware
│   └── server.js                    # Server startup & shutdown lifecycle
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- **Node.js (v18+)**
- **MongoDB Atlas Free Cluster (M0)** (or local MongoDB instance)
- **Google Cloud Console Project** (with Gmail API enabled)
- **Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))
- **Groq API Key** (from [Groq Console](https://console.groq.com/))
- **Telegram Bot Token** (from `@BotFather` on Telegram)

### 2. Generate Cryptographically Secure Secrets
Before setting up your `.env`, generate high-entropy random secrets:

```bash
# Generate high-entropy 32-byte hexadecimal strings
openssl rand -hex 32
```
*Use one generated value for `JOB_SECRET` and another for `TELEGRAM_WEBHOOK_SECRET`.*

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Populate the configuration values (never commit `.env` to Git):
```env
PORT=3000
NODE_ENV=development

# Google OAuth2 Credentials (Google Cloud Console)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GMAIL_REFRESH_TOKEN=

# AI Provider Keys
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_numeric_chat_id
TELEGRAM_WEBHOOK_SECRET=your_generated_32_byte_webhook_secret

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@cluster0.mongodb.net/ai_email_assistant?retryWrites=true&w=majority

# External Cron Security Header
JOB_SECRET=your_generated_32_byte_job_secret
```

### 4. Install & Launch
```bash
# 1. Install dependencies
npm install

# 2. Run local sanity checks
npm run check

# 3. Start local development server (includes Telegram dev polling)
npm run dev
```

### 5. Authorize Gmail (One-Time Local Flow)
1. Open your browser and navigate to `http://localhost:3000/auth/google`.
2. Sign in with your Gmail account and approve read-only permissions (`gmail.readonly`).
3. Copy the generated `GMAIL_REFRESH_TOKEN` displayed on the local confirmation screen.
4. Add it to your local `.env` and your production deployment environment variables.
5. Restart your server. The assistant will now autonomously synchronize and process incoming emails.

---

## 🛡️ Security Checklist & Vulnerability Mitigations

| Vulnerability Risk | Threat Scenario | Mitigation in Place |
| :--- | :--- | :--- |
| **Exposed OAuth Setup Routes** | Unauthorized users visiting `/auth/google` in production | Run the one-time OAuth consent flow **locally on `localhost`**. In production, keep `GMAIL_REFRESH_TOKEN` in environment variables and restrict or remove public access to `/auth/*` endpoints. |
| **Shell History Credential Leakage** | Running `curl` commands with tokens in the terminal leaves secrets in shell history files (`.bash_history`) | Use environment variables, secure interactive prompts, or standard configuration scripts rather than typing raw tokens in shell command strings. |
| **Unauthenticated Webhook Triggers** | Attackers spoofing Telegram updates to inject fake messages | `validateTelegramWebhook` validates the `X-Telegram-Bot-Api-Secret-Token` header and verifies that `message.chat.id` strictly matches the owner's `TELEGRAM_CHAT_ID`. |
| **Unauthorized Cron Triggering** | Malicious actors exhausting API quotas by repeatedly calling `/jobs/*` | `validateJobSecret` requires an `X-Job-Secret` HTTP header matching your configured `JOB_SECRET`, returning `403 Forbidden` for unauthorized calls. |
| **Credential & Key Leakage via Logs** | Accidental logging of API keys, bearer tokens, or user passwords | Centralized Pino logger uses built-in redaction paths to mask tokens, passwords, and sensitive headers as `[REDACTED]`. |
| **Accidental Secret Check-in** | Committing `.env` or temporary credential dumps to GitHub | `.env`, `*.log`, and temporary directories are strictly excluded via `.gitignore`. Verify with `git status` prior to committing. |
| **Prompt Injection Attacks** | Malicious email content attempting to override AI instructions | Email content is treated as untrusted text, truncated, sanitized, and enclosed in strictly bounded prompt fences requiring structured JSON schema replies. |
| **Over-Privileged OAuth Scopes** | Compromised tokens gaining write or delete access to mailbox | OAuth scope is strictly limited to `https://www.googleapis.com/auth/gmail.readonly`. The app cannot modify, delete, or send emails. |

---

## 🌐 24/7 Cloud Deployment

### 1. Deploy on Cloud Host (e.g. Render / Railway)
1. Create a **New Web Service** connected to your repository.
2. Build & Start Settings:
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node src/server.js`
3. Add all environment variables from your local `.env` into the host dashboard.
   * Set `GOOGLE_REDIRECT_URI=https://<your-app>.onrender.com/auth/google/callback`
   * Set `NODE_ENV=production`

### 2. Register Telegram Webhook Securely
To prevent storing bot tokens and secrets in terminal history, use environment variables:

**Linux / macOS:**
```bash
read -s -p "Enter Telegram Bot Token: " BOT_TOKEN && echo
read -s -p "Enter Webhook Secret: " WEBHOOK_SEC && echo
APP_URL="https://<your-app>.onrender.com"

curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -d "url=${APP_URL}/webhook/telegram" \
  -d "secret_token=${WEBHOOK_SEC}"

unset BOT_TOKEN WEBHOOK_SEC
```

**Windows PowerShell:**
```powershell
$BotToken = Read-Host "Enter Telegram Bot Token" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($BotToken)
$PlainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$Secret = Read-Host "Enter Webhook Secret"
$AppUrl = "https://<your-app>.onrender.com"

Invoke-RestMethod -Uri "https://api.telegram.org/bot$PlainToken/setWebhook" `
  -Method Post `
  -Body @{ url = "$AppUrl/webhook/telegram"; secret_token = $Secret }
```

### 3. Configure Free Schedulers on [cron-job.org](https://cron-job.org)
*(Set Timezone to **Asia/Kolkata (IST)**)*

| Job Name | Schedule | Target URL | Custom Headers |
| :--- | :--- | :--- | :--- |
| **Keep-Alive Ping** | `*/10 * * * *` (Every 10 min) | `https://<your-app>.onrender.com/health` | *(None)* |
| **Morning Digest** | `30 7 * * *` (Daily 7:30 AM IST) | `https://<your-app>.onrender.com/jobs/digest` | `X-Job-Secret: <YOUR_JOB_SECRET>` |
| **Email Poll** | `0 * * * *` (Hourly) | `https://<your-app>.onrender.com/jobs/poll-emails` | `X-Job-Secret: <YOUR_JOB_SECRET>` |

---

## 🔒 Security & Privacy Guarantees

* 🛡️ **Read-Only Scope (`gmail.readonly`):** The application cannot alter, delete, draft, or send emails on your behalf.
* 🛡️ **Zero-Exposure Firewall:** The Telegram webhook strictly filters updates, discarding any message or callback that does not originate from your authenticated `TELEGRAM_CHAT_ID`.
* 🛡️ **Protected Cron Endpoints:** `/jobs/*` endpoints reject any request lacking the valid `X-Job-Secret` header with `403 Forbidden`.
* 🛡️ **7-Day Auto-Purge:** MongoDB uses native TTL indexes (`expireAfterSeconds: 0`) to automatically purge processed records after 7 days.
* 🛡️ **Zero Permanent Email Body Storage:** Only lightweight, sanitized metadata and brief snippets are temporarily cached for query resolution.
* 🛡️ **Prompt Injection Defenses:** AI system prompts isolate email content as untrusted input, strictly enforcing structured JSON output validation.
* 🛡️ **Structured Log Redaction:** OAuth tokens, passwords, and sensitive HTTP headers are automatically censored in Pino logs.

---

<p align="center">
  Built with ❤️ for intelligent, secure, and stress-free email productivity.
</p>
