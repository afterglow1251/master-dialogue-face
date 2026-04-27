> [English](README.md) · [Українська](README.uk.md)

# Facial Expression Generator

System for automatic generation of realistic facial expressions of virtual characters based on dialogue emotional context analysis. Master's thesis project that analyzes text emotions via NLP (RoBERTa, 27 GoEmotions categories), maps them to 52 ARKit blendshapes, and animates a 3D avatar at 60 fps.

## Architecture

```
┌─────────────┐    WebSocket/REST    ┌─────────────┐    HTTP    ┌──────────────┐
│   Frontend  │ ◄──────────────────► │   Backend   │ ─────────► │  NLP Service │
│  Vue 3 +    │                      │  Elysia.js  │            │  FastAPI +   │
│  Three.js   │                      │  Bun        │            │  RoBERTa     │
└─────────────┘                      └──────┬──────┘            └──────────────┘
                                            │
                                     ┌──────▼──────┐
                                     │ PostgreSQL  │
                                     └─────────────┘
```

## Tech Stack

| Layer       | Technology |
| ----------- | --- |
| Frontend    | Vue 3.5, TypeScript 5.9.3, Three.js 0.183, Tailwind 4, shadcn-vue, Pinia 3 |
| Backend     | Elysia.js 1.4, Bun 1.2, Drizzle ORM 0.45, TypeBox |
| NLP Service | Python 3.11, FastAPI 0.115+, PyTorch 2.5+, Transformers 4.47+ |
| Database    | PostgreSQL 16 |
| Auth        | Clerk (JWT) |
| DevOps      | Docker, Docker Compose |

TypeScript versions are pinned (no `^` / `~`) — TypeScript does not follow semver.

## Quick Start (Docker)

```bash
git clone https://github.com/afterglow1251/master-dialogue-face && cd master-code
cp .env.example .env
# Fill: DATABASE_URL, CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, VITE_CLERK_PUBLISHABLE_KEY
docker compose up -d
docker compose logs -f nlp-service   # Wait ~2 min on first run (RoBERTa downloads)
# Open http://localhost
```

## Local Development

### Prerequisites

- Bun ≥ 1.2 · Python ≥ 3.11 · PostgreSQL 16 · Docker (optional)

### Setup

```bash
bun install
cd backend && bun install && cd ..
cd frontend && bun install && cd ..
cd nlp-service && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && cd ..

cp .env.example .env
# Fill environment variables (see .env.example)
```

### Run Services

Each in its own terminal:

```bash
# 1. NLP Service (downloads ~500 MB RoBERTa on first run)
cd nlp-service && uvicorn app.main:app --reload --port 8000

# 2. Backend
cd backend && bun run db:migrate && bun run db:seed && bun run dev

# 3. Frontend
cd frontend && bun run dev
```

| Service           | URL |
| --- | --- |
| Frontend          | http://localhost:5173 |
| Backend API       | http://localhost:3000 |
| Backend WebSocket | ws://localhost:3000/ws |
| NLP Service       | http://localhost:8000 |
| OpenAPI Docs      | http://localhost:3000/openapi |

### Docker Development

```bash
docker compose -f docker-compose.dev.yml up
```

Mounts source directories for hot-reload.

## Environment Variables

See `.env.example` for all variables. Required:

- `DATABASE_URL` — PostgreSQL connection string
- `CLERK_SECRET_KEY` · `CLERK_PUBLISHABLE_KEY` — Clerk auth keys
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk key for frontend

## Testing

```bash
cd backend && bun test          # 80 unit tests
cd nlp-service && pytest        # 77 unit tests
cd nlp-service && pytest --cov  # with coverage
```

**Total: 157 tests** covering NLP API, schemas, VAD conversion, probability normalization, blendshape mapping, mood model, and type safety.

## Resources

- **API Reference**: OpenAPI spec at `/openapi` (auto-generated)
- **Thesis**: See thesis document for algorithm details (ALMA mood model, EMA smoothing, blendshape mapping)
- **License**: See LICENSE file
