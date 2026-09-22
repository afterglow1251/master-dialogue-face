> [English](README.md) · [Українська](README.uk.md)

# Facial Expression Generator

System for automatic generation of realistic facial expressions of virtual characters based on dialogue emotional context analysis. Master's thesis project: the avatar holds a spoken conversation (voice dictation, Claude Haiku replies, ElevenLabs speech with lip-sync), analyzes the emotion of every sentence via RoBERTa (27 GoEmotions categories), maps it to 52 ARKit blendshapes, and animates a 3D avatar at 60 fps.

## Architecture

```
┌─────────────┐  WebSocket/REST  ┌─────────────┐  HTTPS  ┌────────────────────────────┐
│  Frontend   │ ◄──────────────► │   Backend   │ ──────► │ External AI APIs           │
│  Vue 3 +    │                  │  Elysia.js  │         │ · Anthropic (Claude Haiku) │
│  Three.js   │                  │  Bun        │         │ · Hugging Face (RoBERTa)   │
└─────────────┘                  └──────┬──────┘         │ · ElevenLabs (TTS)         │
                                        │                └────────────────────────────┘
                                 ┌──────▼──────┐
                                 │ PostgreSQL  │
                                 └─────────────┘
```

The emotion model itself — every formula and every reference table, with source locations — is documented in [MODEL.md](MODEL.md). Pure computation lives in `shared/math/`, empirical data from the literature in `shared/tables/`.

## Tech Stack

| Layer       | Technology                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| Frontend    | Vue 3.5, TypeScript 5.9.3, Three.js 0.183, Tailwind 4, shadcn-vue, Pinia 3                                               |
| Backend     | Elysia.js 1.4, Bun 1.2, Drizzle ORM 0.45, TypeBox                                                                        |
| AI services | Claude Haiku 4.5 (Anthropic SDK), RoBERTa go_emotions (Hugging Face Inference Providers), ElevenLabs TTS, Web Speech API |
| Database    | PostgreSQL 16                                                                                                            |
| Auth        | Clerk (JWT)                                                                                                              |
| DevOps      | Docker, Docker Compose                                                                                                   |

TypeScript versions are pinned (no `^` / `~`) — TypeScript does not follow semver.

## Quick Start (Docker)

```bash
git clone https://github.com/afterglow1251/master-dialogue-face && cd master-code
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Fill: DATABASE_URL, CLERK_*, HF_TOKEN, ANTHROPIC_API_KEY, ELEVENLABS_*, VITE_CLERK_PUBLISHABLE_KEY
docker compose up -d
# Open http://localhost
```

## Local Development

### Prerequisites

- Bun ≥ 1.2 · PostgreSQL 16 · Docker (optional)
- Chrome or Edge for voice dictation (Web Speech API)

### Setup

```bash
bun install
cd backend && bun install && cd ..
cd frontend && bun install && cd ..

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Fill environment variables (see the .env.example files)
```

### Run Services

Each in its own terminal:

```bash
# 1. Backend
cd backend && bun run db:migrate && bun run db:seed && bun run dev

# 2. Frontend
cd frontend && bun run dev
```

| Service           | URL                           |
| ----------------- | ----------------------------- |
| Frontend          | http://localhost:5173         |
| Backend API       | http://localhost:3000         |
| Backend WebSocket | ws://localhost:3000/ws        |
| OpenAPI Docs      | http://localhost:3000/openapi |

### Docker Development

```bash
docker compose -f docker-compose.dev.yml up
```

Mounts source directories for hot-reload.

## Environment Variables

Each app has its own env file: `backend/.env` (copy from `backend/.env.example`) and `frontend/.env` (copy from `frontend/.env.example`). Docker Compose reads the same files via `env_file`. Required:

- `DATABASE_URL` — PostgreSQL connection string
- `CLERK_SECRET_KEY` · `CLERK_PUBLISHABLE_KEY` — Clerk auth keys
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk key for frontend
- `HF_TOKEN` — Hugging Face token for the RoBERTa emotion model
- `ANTHROPIC_API_KEY` — Claude API key for avatar replies
- `ELEVENLABS_API_KEY` · `ELEVENLABS_VOICE_ID` — ElevenLabs text-to-speech

## Testing

```bash
cd backend && bun test          # 89 unit tests
```

Covers the reply line protocol, emotion score parsing, VAD conversion, probability normalization, blendshape mapping, mood model, and type safety.

## Resources

- **API Reference**: OpenAPI spec at `/openapi` (auto-generated)
- **Thesis**: See thesis document for algorithm details (ALMA mood model, EMA smoothing, blendshape mapping)
- **License**: See LICENSE file
