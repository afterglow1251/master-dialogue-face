> [English](README.md) · [Українська](README.uk.md)

# Генератор виразів обличчя

Система автоматичної генерації реалістичних виразів обличчя віртуальних персонажів на основі аналізу емоційного контексту діалогу. Магістерська робота: аватар веде голосовий діалог (диктування, відповіді Claude Haiku, мовлення ElevenLabs із синхронізацією губ), аналізує емоцію кожного речення через RoBERTa (27 категорій GoEmotions), мепить її у 52 параметри ARKit blendshapes і анімує 3D-аватар на 60 fps.

## Архітектура

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

Сама модель емоцій — усі формули та довідкові таблиці з посиланнями на місце в коді — описана в [MODEL.md](MODEL.md). Чисті обчислення лежать у `shared/math/`, емпіричні дані з літератури — у `shared/tables/`.

## Стек технологій

| Шар         | Технології                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| Frontend    | Vue 3.5, TypeScript 5.9.3, Three.js 0.183, Tailwind 4, shadcn-vue, Pinia 3                                               |
| Backend     | Elysia.js 1.4, Bun 1.2, Drizzle ORM 0.45, TypeBox                                                                        |
| AI-сервіси  | Claude Haiku 4.5 (Anthropic SDK), RoBERTa go_emotions (Hugging Face Inference Providers), ElevenLabs TTS, Web Speech API |
| База даних  | PostgreSQL 16                                                                                                            |
| Авторизація | Clerk (JWT)                                                                                                              |
| DevOps      | Docker, Docker Compose                                                                                                   |

Версії TypeScript закріплено точно (без `^` / `~`) — TypeScript не дотримується semver.

## Швидкий старт (Docker)

```bash
git clone https://github.com/afterglow1251/master-dialogue-face && cd master-code
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Заповніть: CLERK_*, HF_TOKEN, ANTHROPIC_API_KEY, ELEVENLABS_*, VITE_CLERK_PUBLISHABLE_KEY
docker compose up -d
# Відкрийте http://localhost
```

## Локальна розробка

### Передумови

- Bun ≥ 1.2 · PostgreSQL 16 · Docker (опціонально)
- Chrome або Edge для голосового диктування (Web Speech API)

### Встановлення

```bash
bun install
cd backend && bun install && cd ..
cd frontend && bun install && cd ..

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Заповніть змінні (див. файли .env.example)
```

### Запуск сервісів

Кожен у своєму терміналі:

```bash
# 1. Backend
cd backend && bun run db:migrate && bun run db:seed && bun run dev

# 2. Frontend
cd frontend && bun run dev
```

| Сервіс               | URL                           |
| -------------------- | ----------------------------- |
| Frontend             | http://localhost:5173         |
| Backend API          | http://localhost:3000         |
| Backend WebSocket    | ws://localhost:3000/ws        |
| OpenAPI-документація | http://localhost:3000/openapi |

### Розробка через Docker

```bash
docker compose -f docker-compose.dev.yml up
```

Монтує src-директорії для hot-reload.

## Змінні оточення

Кожен застосунок має свій env-файл: `backend/.env` (копія `backend/.env.example`) і `frontend/.env` (копія `frontend/.env.example`). Docker Compose читає ці ж файли через `env_file`. Обов'язкові:

- `DATABASE_URL` — рядок підключення PostgreSQL (лише для запуску бекенду поза Docker; Compose підставляє власний сервіс `postgres`)
- `CLERK_SECRET_KEY` · `CLERK_PUBLISHABLE_KEY` — ключі Clerk
- `VITE_CLERK_PUBLISHABLE_KEY` — ключ Clerk для frontend
- `HF_TOKEN` — токен Hugging Face для моделі емоцій RoBERTa
- `ANTHROPIC_API_KEY` — ключ Claude API для відповідей аватара
- `ELEVENLABS_API_KEY` · `ELEVENLABS_VOICE_ID` — синтез мовлення ElevenLabs

## Тестування

```bash
cd backend && bun test          # 89 unit-тестів
```

Покривають лінійний протокол відповіді, парсинг оцінок емоцій, VAD-конвертацію, нормалізацію ймовірностей, blendshape-маппінг, модель настрою та типобезпеку.

## Ресурси

- **API Reference**: OpenAPI-специфікація за адресою `/openapi` (автогенерується)
- **Магістерська робота**: Деталі алгоритмів (ALMA mood model, EMA smoothing, blendshape mapping)
- **Ліцензія**: Див. файл LICENSE
