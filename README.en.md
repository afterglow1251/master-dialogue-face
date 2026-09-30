> [Українська](README.md) · [English](README.en.md)

# Facial Expression Generator

**Master's thesis topic:** "A system for automatic generation of realistic facial expressions of virtual characters based on the emotional context of dialogue".

**Author:** Yurii Voitko, group TV-51mp.

## Overview

A web application where the user holds a voice or text dialogue with a 3D avatar. The avatar replies with speech and lip sync, and its facial expression follows the emotional context of the conversation.

How it works:

1. The user types or dictates an utterance.
2. The Claude Haiku language model writes the avatar's reply, and ElevenLabs voices it.
3. RoBERTa, trained on the GoEmotions dataset, estimates the probabilities of 28 emotion categories in the utterance.
4. The ALMA mood model accumulates the avatar's emotional state over the whole conversation.
5. Emotions and mood are turned into 52 ARKit blendshape parameters in one of two selectable ways: through FACS action units or through a linear mixture of emotion templates.
6. The face is animated smoothly at the display refresh rate; smoothing is frame-rate independent.

Each utterance keeps a report: detected emotions, mood change and its dynamics. Every model formula and reference table, with pointers into the code, is described in [MODEL.md](MODEL.md).

## Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [System Requirements and Software](#system-requirements-and-software)
- [Getting API Keys](#getting-api-keys)
- [Installation and Launch](#installation-and-launch)
- [Environment Variables](#environment-variables)
- [User Guide](#user-guide)
- [Troubleshooting](#troubleshooting)
- [Local Development](#local-development)
- [Testing](#testing)

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

The frontend renders the avatar and chat, recognizes speech and animates the face. The backend stores dialogues, calls the external AI services and computes emotions, mood and expression parameters. Conversation data flows over WebSocket; chat management goes through the REST API.

## Tech Stack

| Layer    | Technologies                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------------ |
| Frontend | Vue 3.5, TypeScript 5.9.3, Three.js 0.183, Tailwind CSS 4, shadcn-vue, Pinia 3                                           |
| Backend  | Elysia.js 1.4, Bun 1.2, Drizzle ORM 0.45, TypeBox                                                                        |
| AI       | Claude Haiku 4.5 (Anthropic SDK), RoBERTa go_emotions (Hugging Face Inference Providers), ElevenLabs TTS, Web Speech API |
| Database | PostgreSQL 16                                                                                                            |
| Auth     | Clerk (JWT)                                                                                                              |
| DevOps   | Docker, Docker Compose                                                                                                   |

## Project Structure

```
├── backend/                 server (Bun + Elysia.js)
│   ├── src/api/             REST API, WebSocket, auth checks
│   ├── src/services/        dialogue, LLM, TTS, emotion analysis, mood, expressions
│   ├── src/db/              database schema, migration runner, seed data
│   ├── drizzle/             SQL database migrations
│   └── tests/               unit tests
├── frontend/                client (Vue 3 + Three.js)
│   ├── src/components/      UI components
│   ├── src/composables/     logic: 3D scene, animation, WebSocket, dictation
│   └── src/stores/          app state (Pinia)
├── shared/                  code shared by frontend and backend
│   ├── math/                model formulas (activation, mood, smoothing)
│   ├── tables/              reference tables (emotion → VAD, emotion → FACS, FACS → blendshapes)
│   └── types/               shared types
├── docker-compose.yml       runs the whole system
├── docker-compose.dev.yml   development setup with hot reload
└── MODEL.md                 emotion model description
```

## System Requirements and Software

**Hardware (approximate):** 4 GB RAM, 2 GB free disk space, internet access.

| Software                | Version                                  | Purpose                                                  | Get it                                                             |
| ----------------------- | ---------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| Operating system        | Windows 10/11, macOS 12+, Linux (x86_64) | Any OS that runs Docker                                  |                                                                    |
| Git                     | any                                      | Downloading the repository                               | [git-scm.com](https://git-scm.com/downloads)                       |
| Docker + Docker Compose | Docker 24+                               | Runs the database, backend and frontend with one command | [docs.docker.com](https://docs.docker.com/get-started/get-docker/) |
| Browser                 | Chrome or Edge (current version)         | UI and voice dictation (Web Speech API)                  |                                                                    |
| Microphone and speakers |                                          | Voice dialogue; typing works without a microphone        |                                                                    |

On Windows, Docker Desktop runs on WSL 2; the installer sets it up automatically.

PostgreSQL 16, Bun, Nginx and all libraries need no separate installation: they are pulled and run in Docker containers. To run without Docker, see [Local Development](#local-development).

Accounts in four external services are also required (see the next section).

## Getting API Keys

| Service      | Used for                   | Cost                            |
| ------------ | -------------------------- | ------------------------------- |
| Clerk        | User sign-up and sign-in   | Free                            |
| Hugging Face | Emotion analysis (RoBERTa) | Free monthly credit             |
| Anthropic    | Avatar replies (Claude)    | Paid, requires a balance top-up |
| ElevenLabs   | Speech synthesis           | Free monthly character quota    |

### 1. Clerk

1. Sign up at [dashboard.clerk.com](https://dashboard.clerk.com/sign-up).
2. Create an application (**Create application**) and keep **Email** among the sign-in options.
3. In the application menu open **Configure → API Keys** and copy:
   - **Publishable key** (`pk_test_…`) into `CLERK_PUBLISHABLE_KEY` (`backend/.env`) and `VITE_CLERK_PUBLISHABLE_KEY` (`frontend/.env`);
   - **Secret key** (`sk_test_…`) into `CLERK_SECRET_KEY` (`backend/.env`).

Docs: [Clerk Quickstart](https://clerk.com/docs/getting-started/quickstart/setup-clerk).

### 2. Hugging Face

1. Sign up at [huggingface.co](https://huggingface.co/join).
2. Open [token creation](https://huggingface.co/settings/tokens/new?tokenType=fineGrained), enter a name and enable the **Make calls to Inference Providers** permission.
3. Click **Create token** and copy the token (`hf_…`) into `HF_TOKEN`.

Docs: [User access tokens](https://huggingface.co/docs/hub/security-tokens).

### 3. Anthropic

1. Sign up at [platform.claude.com](https://platform.claude.com/).
2. Top up the balance in [Billing](https://platform.claude.com/settings/billing). The minimum top-up covers thousands of replies.
3. Create a key in [API Keys](https://platform.claude.com/settings/keys) and copy it (`sk-ant-…`) into `ANTHROPIC_API_KEY`.

Docs: [Get started with Claude](https://platform.claude.com/docs/en/get-started).

### 4. ElevenLabs

1. Sign up at [elevenlabs.io](https://elevenlabs.io/app/sign-up).
2. Open [API Keys](https://elevenlabs.io/app/developers/api-keys), create a key with **Text to Speech** access and copy it into `ELEVENLABS_API_KEY`.
3. Keep `ELEVENLABS_VOICE_ID` from `.env.example` or pick another voice in the [Voice Library](https://elevenlabs.io/app/voice-library) and copy its ID.

Docs: [ElevenLabs Quickstart](https://elevenlabs.io/docs/eleven-api/quickstart).

## Installation and Launch

1. Install the [required software](#system-requirements-and-software) and [get the API keys](#getting-api-keys). Start Docker Desktop.
2. Download the repository and create the settings files from templates:

   ```bash
   git clone https://github.com/afterglow1251/master-dialogue-face
   cd master-dialogue-face
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   On Windows (PowerShell) use `copy` instead of `cp`.

3. Open `backend/.env` and fill in the keys: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `HF_TOKEN`, `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`. In `frontend/.env` fill in `VITE_CLERK_PUBLISHABLE_KEY`. Leave the other values unchanged.
4. Start the system:

   ```bash
   docker compose up -d --build
   ```

   The first start takes a few minutes while Docker pulls images and builds the app. The database, tables and seed data are created automatically.

5. Open [http://localhost](http://localhost) in the browser.

Useful commands:

| Action               | Command                       |
| -------------------- | ----------------------------- |
| Container status     | `docker compose ps`           |
| Backend log          | `docker compose logs backend` |
| Stop                 | `docker compose down`         |
| Stop and delete data | `docker compose down -v`      |

**Server deployment.** Before the first start, create a `.env` file in the project root with `DB_PASSWORD=<strong password of Latin letters and digits>`. In `frontend/.env` replace `localhost` with the server address. On a server, voice dictation works only over HTTPS (see [Troubleshooting](#troubleshooting)).

## Environment Variables

`backend/.env`:

| Variable                  | Required            | Description                                                             |
| ------------------------- | ------------------- | ----------------------------------------------------------------------- |
| `CLERK_SECRET_KEY`        | yes                 | Clerk secret key                                                        |
| `CLERK_PUBLISHABLE_KEY`   | yes                 | Clerk publishable key                                                   |
| `HF_TOKEN`                | yes                 | Hugging Face token                                                      |
| `ANTHROPIC_API_KEY`       | yes                 | Anthropic API key                                                       |
| `ELEVENLABS_API_KEY`      | yes                 | ElevenLabs key                                                          |
| `ELEVENLABS_VOICE_ID`     | yes                 | Avatar voice; the template already has a value                          |
| `DATABASE_URL`            | only without Docker | PostgreSQL connection string; Docker Compose sets it automatically      |
| `EXPRESSION_MODE`         | no                  | Default expression composition: `facs` or `linear`                      |
| `LLM_*`, `MOOD_*`, `WS_*` | no                  | Language model, mood model and WebSocket parameters; see `.env.example` |

`frontend/.env`:

| Variable                     | Description                                         |
| ---------------------------- | --------------------------------------------------- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (same as in `backend/.env`)   |
| `VITE_API_BASE_URL`          | Backend address, default `http://localhost:3000`    |
| `VITE_WS_URL`                | WebSocket address, default `ws://localhost:3000/ws` |

How to get each key is described in [Getting API Keys](#getting-api-keys). The `.env` files hold secrets and are not committed to the repository.

## User Guide

The screen has two parts: the 3D avatar on the left, the chat on the right.

1. **Sign up and sign in.** Open the app and sign up with email (**Sign up**) or sign in to an existing account (**Sign in**).
2. **Language.** Open the sidebar (button at the top left), click the profile avatar in the **Account** block → **Manage account** → **Preferences**. Choose the interface language (Ukrainian or English) and color scheme here. The interface language also sets the speech recognition language and the language the avatar replies in.
3. **New chat.** Click **New chat** in the sidebar. Previous chats are listed under **Chats**.
4. **Sending an utterance.** Type in the field at the bottom of the chat and press Enter or the ↑ button (Shift+Enter inserts a line break). To speak, click the microphone button **Dictate with voice** and allow microphone access in the browser.
5. **Avatar reply.** The avatar replies with speech, moving its lips in sync, and its facial expression follows the emotions. The ■ **Stop reply** button interrupts the reply.
6. **Emotions and mood.**
   - The panel under the avatar (on wide screens) shows the current emotions and mood.
   - Each utterance shows its main emotion and the direction of mood change (↑ improved, ↓ worsened).
   - The ⓘ **View emotion report** button opens the utterance report: the **Report** tab (detected emotions, mood state, turn effect) and the **Dynamics** tab (mood chart up to this utterance).
   - The chart button next to the chat title opens **Conversation dynamics**: the avatar's mood over the whole dialogue.
7. **Expression tuning.** Sidebar → **Tuning**:
   - **Animation:** expression smoothing and intensity;
   - **Expression composition:** **FACS** (muscle action units) or **Linear** (a mixture of emotion templates); switchable during the conversation;
   - **Mood Model:** reactivity (how strongly new emotions affect mood), decay time (how long mood takes to return to neutral), emotion weight (balance between the current emotion and mood);
   - **Reset defaults** restores default values, **Reset mood** returns the avatar to a neutral state.
8. **Managing chats.** Hover a chat in the list: the pencil renames it, the trash can deletes it. The current chat can also be renamed with the pencil that appears when hovering its title above the messages. All history is saved, and any chat can be reopened.
9. **Sign out.** Sidebar → profile avatar in the **Account** block → **Sign out**.

## Troubleshooting

| Problem                              | Cause and fix                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No microphone button                 | The browser does not support the Web Speech API. Use Chrome or Edge.                                                                                   |
| Dictation does not work on a server  | Browsers allow the microphone only on `localhost` or over HTTPS. Set up HTTPS for the server.                                                          |
| Backend does not start               | Required variables are missing. Their names are shown in `docker compose logs backend`.                                                                |
| Port 80 or 3000 is busy              | Free the port or change it: for the backend, `BACKEND_PORT` in the `.env` file in the project root; for the frontend, `ports` in `docker-compose.yml`. |
| Sign-in page is empty or shows error | Check `VITE_CLERK_PUBLISHABLE_KEY` in `frontend/.env` and rebuild the frontend: `docker compose up -d --build`.                                        |
| Avatar does not reply, chat error    | The Anthropic balance, Hugging Face credit or ElevenLabs quota ran out. Check the balance in the service and `docker compose logs backend`.            |

## Local Development

Requires [Bun](https://bun.sh) 1.2+ and PostgreSQL 16. The easiest way to start the database is Docker: `docker compose -f docker-compose.dev.yml up -d postgres`.

```bash
bun install
cd backend && bun install && cd ..
cd frontend && bun install && cd ..
```

In `backend/.env` set `DATABASE_URL=postgresql://facial_user:facial_pass@localhost:5432/facial_expressions`. Then run each service in its own terminal:

```bash
cd backend && bun run db:migrate && bun run db:seed && bun run dev
```

```bash
cd frontend && bun run dev
```

| Service           | Address                       |
| ----------------- | ----------------------------- |
| Frontend          | http://localhost:5173         |
| Backend API       | http://localhost:3000         |
| Backend WebSocket | ws://localhost:3000/ws        |
| API docs          | http://localhost:3000/openapi |

Or everything in Docker with automatic reload on code changes: `docker compose -f docker-compose.dev.yml up`.

## Testing

```bash
cd backend && bun test
```

121 unit tests cover language model reply parsing, emotion score handling, probability normalization, activation functions, emotion-to-expression mapping, the mood model, configuration and data type checks.

## Resources

- **Emotion model:** [MODEL.md](MODEL.md)
- **API docs:** OpenAPI spec at `/openapi` (auto-generated)
- **License:** [MIT](LICENSE)
