# Mini-Aternos: Minecraft Web Control Panel

**Pay-Only-When-Playing VPS Automation System**

A personal self-hosted web control panel that spins up and tears down a Minecraft server on DigitalOcean on demand — so you only pay for the exact hours the server is running.

## Architecture

```
Browser → Frontend (Next.js / Vercel)
    ↓
Backend API (Node.js + Express / Railway)
    ↓
DigitalOcean API → Temporary Droplet (Paper MC)
    ↕
DigitalOcean Spaces (persistent world data)
```

## Project Structure

```
mini-aternos/
├── frontend/          # Next.js 14 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── (dashboard)/    # Protected pages
│   │   │   │   ├── page.tsx          # Dashboard
│   │   │   │   ├── sessions/page.tsx # Session history
│   │   │   │   └── settings/page.tsx # Settings
│   │   │   ├── login/page.tsx  # Login page
│   │   │   └── layout.tsx      # Root layout
│   │   ├── components/
│   │   │   ├── ui/             # shadcn-style components
│   │   │   ├── sidebar.tsx     # Navigation
│   │   │   ├── status-badge.tsx
│   │   │   ├── session-timer.tsx
│   │   │   ├── cost-estimate.tsx
│   │   │   ├── plan-selector.tsx
│   │   │   └── player-list.tsx
│   │   └── lib/
│   │       ├── api.ts          # API client
│   │       ├── hooks.ts        # SWR hooks
│   │       └── utils.ts        # Utilities
│   └── tailwind.config.ts
├── backend/           # Express.js API
│   └── src/
│       ├── index.ts            # Server entry
│       ├── routes.ts           # API routes
│       ├── auth.ts             # JWT authentication
│       ├── config.ts           # Environment config
│       ├── store.ts            # In-memory state
│       ├── types.ts            # TypeScript types
│       ├── plans.ts            # VPS plan definitions
│       ├── cloud-init.ts       # Droplet boot script
│       └── services/
│           ├── digitalocean.ts # DO API integration
│           ├── spaces.ts       # S3/Spaces integration
│           ├── ssh.ts          # SSH command execution
│           └── minecraft-query.ts # MC server query
└── .github/
    └── workflows/ci.yml       # CI/CD pipeline
```

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env    # Fill in your credentials
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### Environment Variables

See `backend/.env.example` for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `DO_API_TOKEN` | DigitalOcean personal access token |
| `DO_SSH_KEY_ID` | SSH key fingerprint registered in DO |
| `DO_SPACES_KEY` | Spaces access key ID |
| `DO_SPACES_SECRET` | Spaces secret access key |
| `DO_SPACES_BUCKET` | Spaces bucket name (e.g., `minecraft-worlds`) |
| `DO_DOMAIN` | Your domain in DO DNS |
| `MC_SUBDOMAIN` | Subdomain for Minecraft (e.g., `mc`) |
| `JWT_SECRET` | Secret for JWT token signing |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/auth/login` | Authenticate and get JWT |
| GET | `/v1/server/status` | Server state, IP, players |
| POST | `/v1/server/start` | Create Droplet and start MC |
| POST | `/v1/server/stop` | Save world and destroy Droplet |
| POST | `/v1/server/backup` | Manual world backup |
| GET | `/v1/sessions` | Session history |
| GET | `/v1/players` | Online player list |
| GET | `/v1/plans` | Available VPS plans |
| GET | `/v1/config` | Panel configuration |
| PUT | `/v1/config` | Update configuration |

## VPS Plans

| Plan | Specs | Rate |
|------|-------|------|
| s-1vcpu-512mb | 512 MB / 1 CPU | $0.006/hr |
| s-1vcpu-1gb | 1 GB / 1 CPU | $0.009/hr |
| s-1vcpu-2gb | 2 GB / 1 CPU | $0.018/hr |
| s-2vcpu-2gb | 2 GB / 2 CPUs | $0.027/hr |
| s-2vcpu-4gb | 4 GB / 2 CPUs | $0.036/hr |
| s-4vcpu-8gb | 8 GB / 4 CPUs | $0.071/hr |

## Design System

- **Theme:** Dark mode (OLED black)
- **Palette:** Slate-950 background, Emerald-500 accents
- **Typography:** Fira Code (headings) + Fira Sans (body)
- **Components:** Custom shadcn/ui-style with dark theme

## Cost Model (~2h/day)

| Item | Monthly Cost |
|------|-------------|
| Droplet (pay-per-use) | ~$1.08 |
| DO Spaces | $5.00 |
| Backend hosting | $5.00 |
| Frontend (Vercel) | Free |
| **Total** | **~$11/mo** |

## License

MIT
