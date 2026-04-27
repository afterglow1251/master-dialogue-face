> [English](README.md) · [Українська](README.uk.md)

# Генератор виразів обличчя

Система автоматичної генерації реалістичних виразів обличчя віртуальних персонажів на основі аналізу емоційного контексту діалогу. Магістерська робота — аналізує емоції тексту через NLP (RoBERTa, 27 категорій GoEmotions), мепить їх у 52 параметри ARKit blendshapes і анімує 3D-аватар на 60 fps.

## Архітектура

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

## Стек технологій

| Шар         | Технології |
| ----------- | --- |
| Frontend    | Vue 3.5, TypeScript 5.9.3, Three.js 0.183, Tailwind 4, shadcn-vue, Pinia 3 |
| Backend     | Elysia.js 1.4, Bun 1.2, Drizzle ORM 0.45, TypeBox |
| NLP Service | Python 3.11, FastAPI 0.115+, PyTorch 2.5+, Transformers 4.47+ |
| База даних  | PostgreSQL 16 |
| Авторизація | Clerk (JWT) |
| DevOps      | Docker, Docker Compose |

Версії TypeScript закріплено точно (без `^` / `~`) — TypeScript не дотримується semver.

## Швидкий старт (Docker)

```bash
git clone https://github.com/afterglow1251/master-dialogue-face && cd master-code
cp .env.example .env
# Заповніть: DATABASE_URL, CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, VITE_CLERK_PUBLISHABLE_KEY
docker compose up -d
docker compose logs -f nlp-service   # ~2 хв на першому запуску (завантаження RoBERTa)
# Відкрийте http://localhost
```

## Локальна розробка

### Передумови

- Bun ≥ 1.2 · Python ≥ 3.11 · PostgreSQL 16 · Docker (опціонально)

### Встановлення

```bash
bun install
cd backend && bun install && cd ..
cd frontend && bun install && cd ..
cd nlp-service && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && cd ..

cp .env.example .env
# Заповніть змінні (див. .env.example)
```

### Запуск сервісів

Кожен у своєму терміналі:

```bash
# 1. NLP-сервіс (завантажує ~500 MB RoBERTa на першому запуску)
cd nlp-service && uvicorn app.main:app --reload --port 8000

# 2. Backend
cd backend && bun run db:migrate && bun run db:seed && bun run dev

# 3. Frontend
cd frontend && bun run dev
```

| Сервіс            | URL |
| --- | --- |
| Frontend          | http://localhost:5173 |
| Backend API       | http://localhost:3000 |
| Backend WebSocket | ws://localhost:3000/ws |
| NLP-сервіс        | http://localhost:8000 |
| OpenAPI-документація | http://localhost:3000/openapi |

### Розробка через Docker

```bash
docker compose -f docker-compose.dev.yml up
```

Монтує src-директорії для hot-reload.

## Змінні оточення

Див. `.env.example` для всіх змінних. Обов'язкові:

- `DATABASE_URL` — рядок підключення PostgreSQL
- `CLERK_SECRET_KEY` · `CLERK_PUBLISHABLE_KEY` — ключі Clerk
- `VITE_CLERK_PUBLISHABLE_KEY` — ключ Clerk для frontend

## Тестування

```bash
cd backend && bun test          # 80 unit-тестів
cd nlp-service && pytest        # 77 unit-тестів
cd nlp-service && pytest --cov  # з покриттям
```

**Всього: 157 тестів** що покривають NLP API, схеми, VAD-конвертацію, нормалізацію ймовірностей, blendshape-маппінг, модель настрою та типобезпеку.

## Ресурси

- **API Reference**: OpenAPI-специфікація за адресою `/openapi` (автогенерується)
- **Магістерська робота**: Деталі алгоритмів (ALMA mood model, EMA smoothing, blendshape mapping)
- **Ліцензія**: Див. файл LICENSE
