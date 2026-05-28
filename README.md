<p align="center">
    <img src="doc/demo/logo.png" width="80px" />
    <h1 align="center">Cloud Mail</h1>
    <p align="center">A simple, responsive email service designed to run on Cloudflare Workers 🎉</p>
</p>

## Description

With only one domain, you can create multiple different email addresses, similar to major email platforms. This project deploys entirely on Cloudflare Workers — no server required.

## Features

- **💰 Low-Cost**: No server required — runs entirely on Cloudflare's free tier.
- **💻 Responsive Design**: Adapts to desktop and mobile browsers.
- **📧 Email Sending**: Send emails via Resend API or Cloudflare Email Sending, with attachment support.
- **📥 Email Receiving**: Receive emails via Cloudflare Email Routing.
- **🛡️ Admin Panel**: User and email management with RBAC-based access control.
- **📦 Attachment Support**: Send and receive attachments stored via R2 object storage.
- **🔔 Email Push**: Forward received emails to Telegram bots or external email addresses.
- **📡 Open API**: Batch user creation via API and multi-condition email queries.
- **🔢 Verification Code Recognition**: Auto-detect codes via Workers AI.
- **📈 Analytics**: Visualize system data with ECharts.
- **🎨 Personalization**: Customize title, login background, and transparency.
- **🤖 CAPTCHA**: Cloudflare Turnstile integration.
- **🌐 Multilingual**: English, 中文, Bahasa Indonesia.

## Installation

### Prerequisites

- Cloudflare account with a domain added and proxied through Cloudflare
- Fork of [github.com/imrosyd/cloud-mail](https://github.com/imrosyd/cloud-mail)

---

### Step 1 — Create Cloudflare Resources

Create the following in your Cloudflare Dashboard before deploying:

**D1 Database** — Workers & Pages → D1 → Create database (name: `cloud-mail`)

**KV Namespace** — Workers & Pages → KV → Create namespace (name: `cloud-mail`)

**R2 Bucket** *(optional, for attachments)* — R2 → Create bucket

---

### Step 2 — Deploy via GitHub Actions

Add the following **Secrets** in your forked repo → Settings → Secrets and variables → Actions:

| Secret | Required | Description |
|--------|----------|-------------|
| `CLOUDFLARE_API_TOKEN` | ✅ | Cloudflare API token with Workers, D1, KV, R2 permissions |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ | Your Cloudflare account ID |
| `DOMAIN` | ✅ | JSON array of domains, e.g. `["example.com"]` |
| `ADMIN` | ✅ | Admin email, e.g. `admin@example.com` |
| `JWT_SECRET` | ✅ | Any random string (avoid `?`, `%`, `#`, `/`, `\`) |
| `D1_DATABASE_ID` | ✅ | D1 database ID from Step 1 |
| `KV_NAMESPACE_ID` | ✅ | KV namespace ID from Step 1 |
| `R2_BUCKET_NAME` | ➖ | R2 bucket name (required for attachments) |
| `CUSTOM_DOMAIN` | ➖ | Custom domain for your worker, e.g. `mail.example.com` |
| `NAME` | ➖ | Worker name (default: `cloud-mail`) |

Push to `main` branch to trigger deployment. The workflow will automatically create D1/KV resources if IDs are not provided.

---

### Step 3 — Set Up Email Routing (Receiving)

To receive emails, configure **Cloudflare Email Routing**:

1. Go to **Cloudflare Dashboard** → select your domain → **Email** → **Email Routing**
2. Click **Get started** and let Cloudflare add the required DNS records automatically
3. Under **Routing rules** → **Catch-all** → set action to **Send to a Worker** → select your worker
4. Save

Cloudflare will add the following DNS records to your domain:

| Type | Name | Value |
|------|------|-------|
| MX | `@` | `route1.mx.cloudflare.net` |
| MX | `@` | `route2.mx.cloudflare.net` |
| MX | `@` | `route3.mx.cloudflare.net` |
| TXT | `@` | `v=spf1 include:_spf.mx.cloudflare.net ~all` |

---

### Step 4 — Set Up Email Sending

Choose one of the following methods:

#### Option A — Resend API (Recommended)

1. Sign up at [resend.com](https://resend.com) and create an API key
2. Verify your domain in Resend
3. In Cloud Mail → **System Settings** → **Email** → **Resend Token** → enter your API key

#### Option B — Cloudflare Email Sending

Uncomment the following in `wrangler.toml`:

```toml
[[send_email]]
name = "email"
```

Then redeploy. Cloudflare Email Sending requires Email Routing to be active on the same domain.

---

### Step 5 — Initialize Database

After deployment, open the following URL in your browser:

```
https://<your-worker-domain>/api/init/<jwt_secret>
```

You should see `success`. This creates all database tables and initializes the cache.

---

### Step 6 — Sign In

Visit your worker domain, register using the admin email configured in `ADMIN`, and start using Cloud Mail.

---

## Configuration Reference

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `domain` | — | JSON array of email domains, e.g. `["example.com"]` |
| `admin` | — | Admin email address |
| `jwt_secret` | — | JWT signing secret |
| `ai_model` | `@cf/meta/llama-3.1-8b-instruct` | Workers AI model for code recognition |
| `analysis_cache` | `false` | Enable analytics data caching |

### Bindings

| Binding | Variable | Required | Description |
|---------|----------|----------|-------------|
| D1 Database | `db` | ✅ | Main database |
| KV Namespace | `kv` | ✅ | Cache and session storage |
| R2 Bucket | `r2` | ➖ | Attachment storage |
| Workers AI | `ai` | ➖ | Verification code recognition |
| Email Sending | `email` | ➖ | Cloudflare Email Sending |

---

## Tech Stack

- **Platform**: [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- **Web Framework**: [Hono](https://hono.dev/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Frontend**: [Vue 3](https://vuejs.org/) + [Element Plus](https://element-plus.org/)
- **Email Sending**: [Resend](https://resend.com/) / Cloudflare Email Sending
- **Email Receiving**: [Cloudflare Email Routing](https://developers.cloudflare.com/email-routing/)
- **Cache**: [Cloudflare KV](https://developers.cloudflare.com/kv/)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/)
- **File Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/)

## Project Structure

```
cloud-mail
├── mail-worker                 # Backend worker project
│   ├── src
│   │   ├── api                 # API layer
│   │   ├── const               # Project constants
│   │   ├── dao                 # Data access layer
│   │   ├── email               # Email receiving handler
│   │   ├── entity              # Database entities
│   │   ├── error               # Custom exceptions
│   │   ├── hono                # Web framework, middleware, error handling
│   │   ├── i18n                # Internationalization (en, zh, id)
│   │   ├── init                # Database and cache initialization
│   │   ├── model               # Response data models
│   │   ├── security            # Authentication and authorization
│   │   ├── service             # Business logic layer
│   │   ├── template            # Message templates
│   │   ├── utils               # Utility functions
│   │   └── index.js            # Entry point
│   ├── wrangler.toml           # Local/manual deployment config
│   └── wrangler-action.toml    # GitHub Actions deployment config
│
└── mail-vue                    # Frontend Vue project
    ├── src
    │   ├── axios               # Axios configuration
    │   ├── components          # Shared components
    │   ├── echarts             # ECharts integration
    │   ├── i18n                # Internationalization (en, zh, id)
    │   ├── init                # App startup initialization
    │   ├── layout              # Main layout components
    │   ├── perm                # Permissions and access control
    │   ├── request             # API request layer
    │   ├── router              # Router configuration
    │   ├── store               # Global state management
    │   ├── utils               # Utility functions
    │   └── views               # Page components
    └── package.json
```

## License

This project is licensed under the [MIT](LICENSE) license.
