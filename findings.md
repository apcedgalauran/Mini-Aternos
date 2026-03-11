# Findings & Decisions

## Requirements (from PRD)
- Personal self-hosted web control panel for Minecraft on DigitalOcean
- Disposable VPS + persistent world on DO Spaces = near-zero idle cost
- Single-user auth (owner only)
- Next.js 14 App Router frontend on Vercel
- Node.js + Express backend on Railway/Fly.io
- Paper 1.20.4 on Ubuntu 22.04
- Default region: SGP1 Singapore
- Default plan: s-1vcpu-2gb ($0.018/hr)

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /server/status | Current state, IP, player count, session start time |
| POST | /server/start | Create Droplet with plan slug, cloud-init, DNS update |
| POST | /server/stop | Stop MC, upload world, destroy Droplet |
| POST | /server/backup | Manual world upload without destroying |
| GET | /sessions | Past sessions with duration, cost, backup status |
| GET | /players | Online players from MC server query |
| GET | /plans | Available Droplet sizes with pricing |
| PUT | /config | Update panel config |
| POST | /auth/login | Login endpoint |

## Server States
Offline → Creating → Starting → Online → Stopping → Saving → Destroying → Offline

## VPS Plans
| Slug | Specs | Rate |
|------|-------|------|
| s-1vcpu-512mb | 512 MB / 1 CPU | $0.006/hr |
| s-1vcpu-1gb | 1 GB / 1 CPU | $0.009/hr |
| s-1vcpu-2gb | 2 GB / 1 CPU (default) | $0.018/hr |
| s-2vcpu-2gb | 2 GB / 2 CPUs | $0.027/hr |
| s-2vcpu-4gb | 4 GB / 2 CPUs | $0.036/hr |
| s-4vcpu-8gb | 8 GB / 4 CPUs | $0.071/hr |

## Environment Variables
DO_API_TOKEN, DO_SSH_KEY_ID, DO_SPACES_KEY, DO_SPACES_SECRET, DO_SPACES_BUCKET,
DO_DOMAIN, MC_SUBDOMAIN, JWT_SECRET, NEXTAUTH_SECRET
