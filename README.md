<p align="center">
    <img src="doc/demo/logo.png" width="80px" />
    <h1 align="center">Cloud Mail</h1>
    <p align="center">A simple, responsive email service designed to run on Cloudflare Workers 🎉</p> 
</p>

## Description
With only one domain, you can create multiple different email addresses, similar to major email platforms. This project can be deployed on Cloudflare Workers to reduce server costs and build your own email service.

## Installation

### Prerequisites
- Cloudflare account with a domain added
- Fork of [github.com/imrosyd/cloud-mail](https://github.com/imrosyd/cloud-mail)

### 1. Create Worker
Go to **Cloudflare Dashboard** → **Workers & Pages** → **Create application** → **Workers** → **Deploy**. Choose **Import from GitHub**, select your fork, set root to `mail-worker`, and deploy.

### 2. Set Environment Variables
In your Worker → **Settings** → **Variables**, add:

| Variable | Required | Description |
|----------|----------|-------------|
| `domain` | ✅ | JSON array of domains, e.g. `["example.com"]` |
| `admin` | ✅ | Admin email, e.g. `admin@example.com` |
| `jwt_secret` | ✅ | Random string for JWT signing |

### 3. Bind Databases
- **KV**: Create a namespace, then add binding with variable name `kv`
- **D1**: Create a database, then add binding with variable name `db`

### 4. Initialize
Open `https://<your-worker>/api/init/<jwt_secret>` in your browser. You should see `success`.

### 5. Sign In
Visit your Worker domain, register the admin account, and start using Cloud Mail.

## Features

- **💰 Low-Cost Usage**: No server required — deploy to Cloudflare Workers to reduce costs.
- **💻 Responsive Design**: Automatically adapts to both desktop and most mobile browsers.
- **📧 Email Sending**: Integrated with Resend, supporting bulk email sending and attachments.
- **🛡️ Admin Features**: Admin controls for user and email management with RBAC-based access control.
- **📦 Attachment Support**: Send and receive attachments, stored and downloaded via R2 object storage.
- **🔔 Email Push**: Forward received emails to Telegram bots or other email providers.
- **📡 Open API**: Supports batch user creation via API and multi-condition email queries
- **🔢 Verification Code Recognition**: Auto-detect codes via Workers AI
- **📈 Data Visualization**: Use ECharts to visualize system data, including user email growth.
- **🎨 Personalization**: Customize website title, login background, and transparency.
- **🤖 CAPTCHA**: Integrated with Turnstile CAPTCHA to prevent automated registration.
- **📜 More Features**: Under development...

## Tech Stack

- **Platform**: [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- **Web Framework**: [Hono](https://hono.dev/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Frontend Framework**: [Vue3](https://vuejs.org/)
- **UI Framework**: [Element Plus](https://element-plus.org/)
- **Email Service**: [Resend](https://resend.com/)
- **Cache**: [Cloudflare KV](https://developers.cloudflare.com/kv/)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/)
- **File Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/)

## Project Structure

```
cloud-mail
├── mail-worker				    # Backend worker project
│   ├── src                  
│   │   ├── api	 			    # API layer
│   │   ├── const  			    # Project constants
│   │   ├── dao                 # Data access layer
│   │   ├── email			    # Email processing and handling
│   │   ├── entity			    # Database entities
│   │   ├── error			    # Custom exceptions
│   │   ├── hono			    # Web framework, middleware, error handling
│   │   ├── i18n			    # Internationalization
│   │   ├── init			    # Database and cache initialization
│   │   ├── model			    # Response data models
│   │   ├── security			# Authentication and authorization
│   │   ├── service			    # Business logic layer
│   │   ├── template			# Message templates
│   │   ├── utils			    # Utility functions
│   │   └── index.js			# Entry point
│   ├── package.json			# Project dependencies
│   └── wrangler.toml			# Project configuration
│
├─ mail-vue				        # Frontend Vue project
│   ├── src
│   │   ├── axios 			    # Axios configuration
│   │   ├── components			# Custom components
│   │   ├── echarts			    # ECharts integration
│   │   ├── i18n			    # Internationalization
│   │   ├── init			    # Startup initialization
│   │   ├── layout			    # Main layout components
│   │   ├── perm			    # Permissions and access control
│   │   ├── request			    # API request layer
│   │   ├── router			    # Router configuration
│   │   ├── store			    # Global state management
│   │   ├── utils			    # Utility functions
│   │   ├── views			    # Page components
│   │   ├── app.vue			    # Root component
│   │   ├── main.js			    # Entry JS file
│   │   └── style.css			# Global styles
│   ├── package.json			# Project dependencies
└── └── env.release				# Environment configuration

```

## License

This project is licensed under the [MIT](LICENSE) license.
