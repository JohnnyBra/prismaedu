# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PrismaEdu is a gamified educational management PWA (Progressive Web App) in Spanish. It connects teachers, parents, and students through a task/reward system with customizable avatars and real-time chat. All UI text is in Spanish.

## Commands

```bash
npm run dev      # Frontend dev server (Vite, port 3000)
npm start        # Backend server (Express, port 3020) — run in separate terminal
npm run build    # TypeScript compile + Vite production build to /dist
npm run lint     # ESLint
npm run reset    # Delete database.sqlite and reseed with demo data (24 classes)
```

Development requires **two terminals**: `npm run dev` (frontend) and `npm start` (backend). In production, Express serves the built frontend from `/dist` on port 3020.

No test framework is configured.

## Architecture

**Stack:** React 19 + TypeScript frontend, Node.js/Express backend, SQLite database, Socket.IO for real-time sync.

### Key files

| File | Role |
|------|------|
| `context/DataContext.tsx` | Central state management — all CRUD operations, Socket.IO event handling, and data context for the entire app |
| `server/index.js` | Express server, Google OAuth + PIN auth routes, all Socket.IO event handlers |
| `server/db.js` | SQLite wrapper with in-memory LRU cache (max 50 keys, shallow copies) |
| `types.ts` | All TypeScript type definitions |
| `constants.tsx` | Static data: avatar items, initial seed tasks/rewards |
| `App.tsx` | Root component — role-based routing to dashboards |
| `styles/design-system.css` | Prismatic Glass design system — glass utilities, animations, mesh backgrounds, modal styles |
| `scripts/initSchool.js` | Database seeding script |

### Views (role-based dashboards)

- `views/AuthView.tsx` — Multi-step login flow (role → class → user → PIN)
- `views/AdminDashboard.tsx` — System administration
- `views/TutorDashboard.tsx` — Teacher classroom management
- `views/ParentDashboard.tsx` — Family/home management
- `views/StudentDashboard.tsx` — Student gamified interface

### Data flow

1. **Database:** SQLite single-table key-value store (`store(key, value)`) holding JSON arrays for: `users`, `classes`, `tasks`, `rewards`, `completions`, `messages`, `redemptions`
2. **Caching:** `server/db.js` keeps an in-memory Map cache with LRU eviction. Returns shallow copies.
3. **Real-time sync:** All mutations emit Socket.IO events (e.g., `sync_users`, `sync_tasks`) that broadcast to all clients. Frontend `DataContext` listens and updates React state.
4. **Optimistic updates:** Frontend updates state immediately; server persists asynchronously.

### Authentication

- **PIN login:** 4-digit PINs. Student/parent PINs must be prime numbers (see `utils/primes.ts`).
- **Google OAuth:** For teachers only, restricted to `@colegiolahispanidad.es` domain.
- **Session:** User ID stored in `localStorage` key `sc_session_user`.
- **Roles:** `ADMIN`, `DIRECCION`, `TESORERIA`, `TUTOR`, `PARENT`, `STUDENT`

### Design System — "Prismatic Glass"

The UI uses a dark glassmorphism theme defined in `styles/design-system.css` with Tailwind CSS utilities configured in `index.html`.

- **Typography:** `Outfit` (display/headings, class `font-display`) + `Plus Jakarta Sans` (body, class `font-body`), loaded from Google Fonts.
- **Color palette:** Primary (indigo), Secondary (orange), Accent (purple), Surface (slate), School (blue), Home (orange) — each with 50-900 shades in Tailwind config.
- **Glass utilities:** `.glass`, `.glass-light`, `.glass-medium`, `.glass-strong` — frosted backgrounds with `backdrop-filter: blur()` and subtle borders. Do NOT change glass transparency values without explicit request — they are intentionally calibrated.
- **Gradient mesh backgrounds:** Role-specific: `.mesh-auth`, `.mesh-tutor`, `.mesh-parent`, `.mesh-student`, `.mesh-admin`. Mesh base gradients should stay moderately dark but not pitch black — avoid hex values below `#14` per channel.
- **Glow borders:** `.glow-border-blue`, `.glow-border-orange`, `.glow-border-green`, `.glow-border-purple`, `.glow-border-candy` (multicolor, student-specific).
- **Animations:** `slide-up`, `slide-down`, `scale-in`, `fade-in`, `float`, `glow-pulse`, `shimmer`, `bounce-subtle`, `wiggle`, `pop`, `rainbow-glow` — CSS keyframes + Tailwind `animate-*` classes.
- **Modals:** `.modal-overlay` (blur backdrop) + `.modal-content` (scale-in animation).
- **Form elements:** `.input-glass`, `.btn-primary`, `.btn-ghost`, `.btn-danger`.
- **Mobile:** Bottom nav with safe area insets (`--safe-top`, `--safe-bottom`), `min-h-[100dvh]`, touch-optimized targets.

#### Student-specific theme

The student dashboard (`views/StudentDashboard.tsx`) uses a deliberately more playful, childish visual tone compared to other roles:

- **Student CSS classes:** `.glass-student`, `.glass-student-card`, `.student-points-pill`, `.student-tab-active`, `.glow-border-candy` — defined at the bottom of `design-system.css`.
- **Student mesh:** Uses candy-like multi-color radial gradients (amber, pink, cyan, purple, emerald) instead of the monochrome palette of other roles.
- **Emojis over icons:** Tabs, filters, buttons, and empty states use emoji (📋, 🎁, 💬, 🏫, 🏠, ⭐, etc.) to feel friendlier for children.
- **Playful copy:** Greeting "¡Hola, nombre! 👋", priority tasks as "¡Misión Especial!", empty states with encouraging messages.
- **Fun interactions:** `hover:scale` on cards, bouncy point pill animation, rainbow-glow on active tabs.

### Conventions

- **Entity IDs:** Prefixed by type + timestamp, e.g., `user_1234567890`, `task_1234567890`, `family_...`, `class_...`
- **Dual context:** Tasks and rewards are split between `SCHOOL` (teacher-assigned) and `HOME` (parent-assigned)
- **Avatar system:** Composable SVG with item slots (base, top, bottom, shoes, accessory) purchasable with points

## Deployment

Production runs on Ubuntu with PM2. Scripts in `deploy/`:
- `deploy/install.sh` — Full install (Node 20, PM2, build, seed, start)
- `deploy/update.sh` — Pull, install deps, rebuild, restart PM2
