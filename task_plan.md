# Task Plan: Mini-Aternos — Minecraft Web Control Panel

## Goal
Build a complete Mini-Aternos web control panel (Next.js frontend + Express backend) that automates DigitalOcean VPS lifecycle for a Minecraft server — spin up, play, save world, destroy — paying only for active hours.

## Current Phase
Complete — All phases done

## Phases

### Phase 1: Project Setup & Infrastructure
- [x] Initialize monorepo with /frontend and /backend folders
- [x] Setup package.json files, TypeScript configs
- [x] Create .env.example files with all required env vars
- [x] Setup ESLint, Tailwind configurations
- **Status:** complete

### Phase 2: Backend Core — Express API + DO Integration
- [x] Express server with JWT auth middleware
- [x] DigitalOcean API integration (create/destroy Droplet)
- [x] DO Spaces integration (upload/download world backups)
- [x] DNS update integration (DO DNS API)
- [x] SSH command execution (for graceful shutdown)
- [x] Cloud-init script generation
- [x] All API routes per spec (status, start, stop, backup, sessions, players, plans, config)
- **Status:** complete

### Phase 3: Frontend — Next.js Dashboard
- [x] Generate design system using ui-ux-pro-max
- [x] Next.js 14 App Router setup with Tailwind + shadcn/ui
- [x] JWT-based auth with login page
- [x] Dashboard page: status badge, IP, timer, cost, player count
- [x] Plan selector component
- [x] Session history page
- [x] Settings page
- [x] Mobile-responsive layout
- **Status:** complete

### Phase 4: Integration & CI/CD
- [x] Connect frontend to backend API
- [x] GitHub Actions workflow (lint → test → deploy)
- [x] Environment configuration for Vercel + Railway
- [x] Final testing and validation — both projects build clean
- **Status:** complete

## Decisions Log
| Decision | Rationale |
|----------|-----------|
| Monorepo structure | PRD specifies /frontend and /backend folders |
| TypeScript | Type safety for DO API interactions |
| shadcn/ui | PRD requirement, excellent component library |
| SWR for polling | Lightweight, built-in revalidation for status polling |
