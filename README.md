# DevMatch Frontend

Next.js 16 frontend for [DevMatch](https://github.com/dima-mamaev/devMatch-backend-fastapi)
— a developer hiring platform. Recruiters chat with an AI matcher that
searches the talent pool over both keyword and semantic vectors;
developers onboard via a voice interview that auto-fills their profile.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NEXT.JS APP ROUTER                             │
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Landing   │ │   Signin /  │ │  Dashboard  │ │       AI Match          ││
│  │    Page     │ │   Welcome   │ │    Pages    │ │      Page (SSE)         ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────────┘│
│         │               │               │                    │              │
│         └───────────────┴───────────────┴────────────────────┘              │
│                                    │                                        │
│  ┌─────────────────────────────────┴───────────────────────────────────────┐│
│  │                            PROVIDERS                                    ││
│  │  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐ ┌──────────────┐ ││
│  │  │  Auth0       │ │  ApiProvider │ │ EnsureProfile  │ │ ShortlistSync│ ││
│  │  │  Provider    │ │ (tanstack-q) │ │  (welcome gate)│ │ (LS → API)   │ ││
│  │  └──────────────┘ └──────────────┘ └────────────────┘ └──────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
         │                    │                              │
         ▼                    ▼                              ▼
┌─────────────────┐  ┌─────────────────┐           ┌─────────────────┐
│     Auth0       │  │   FastAPI       │◄─────────►│   localStorage  │
│   (Identity)    │  │   (REST + SSE)  │           │  (Guest state)  │
└─────────────────┘  └─────────────────┘           └─────────────────┘
```

## Data Flow

### Signin → Welcome → Profile

```
┌──────────┐    ┌──────────┐    ┌──────────────────┐    ┌────────────────┐
│  User    │───►│  /signin │───►│      Auth0       │───►│  /dashboard    │
│ Visits   │    │  page    │    │   (OAuth flow)   │    │   (callback)   │
└──────────┘    └──────────┘    └──────────────────┘    └────────────────┘
                                                               │
                                                               ▼
                ┌──────────────────────────────────────────────────────┐
                │            EnsureProfile (provider)                  │
                │                                                      │
                │   GET /api/users/me  →                               │
                │   • 200 → user has role → continue                   │
                │   • 403 complete_signup_required → redirect /welcome │
                │                                                      │
                └──────────────────────────────────────────────────────┘
                                                               │
                                                               ▼
                                        ┌────────────────────────────────┐
                                        │   /welcome → pick role         │
                                        │   • POST /api/developers       │
                                        │     OR /api/recruiters         │
                                        │   → cache invalidates → back   │
                                        │     to /dashboard              │
                                        └────────────────────────────────┘
```

### AI Match — Recruiter chat (SSE)

```
┌──────────┐    ┌──────────┐    ┌──────────────────┐    ┌────────────────┐
│  User    │───►│  ai-match│───►│ POST /sessions/  │───►│  Backend       │
│  prompt  │    │  page    │    │ {id}/messages    │    │  LLM loop      │
└──────────┘    └──────────┘    └──────────────────┘    └────────────────┘
     ▲                                  │                       │
     │                                  ▼                       │
     │              ┌──────────────────────────────┐            │
     │              │   useAIMatch hook            │            │
     │              │   • parseSSE → reducer       │            │
     │              │   • localStorage sessionId   │            │
     │              │   • auto-resume orphans      │            │
     │              │   • guest-claim on signup    │            │
     │              └──────────────────────────────┘            │
     │                       │                                  │
     │                       │                                  │
     │                       ▼                                  │
     │     ┌──────────────────────────────────────────────────┐ │
     │     │              SSE EVENT TYPES                     │ │
     │     │                                                  │ │
     │     │  CONNECTED → sessionId + rateLimit               │◄┘
     │     │  TOOL_CALL → "Searching by meaning…"             │
     │     │  TOOL_RESULT → updates working indicator         │
     │     │  MATCH_FOUND → adds card to assistant message    │
     │     │  COMPLETE → finalizes summary                    │
     │     │  ERROR / CANCELLED / RATE_LIMITED → terminal     │
     │     │                                                  │
     └─────│──────────────────────────────────────────────────│
           │                                                  │
           └──────────────────────────────────────────────────┘
```

### Voice Onboarding (developers)

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────────┐
│  Record  │───►│  POST        │───►│  Backend     │───►│  Whisper STT    │
│  audio   │    │  /me/answer  │    │  routes      │    │  + Claude       │
└──────────┘    └──────────────┘    └──────────────┘    └─────────────────┘
                                                                │
                  ┌─────────────────────────────────────────────┘
                  │   After 5 answers → POST /me/extract
                  ▼
        ┌────────────────────────┐
        │  ReviewDraft form      │
        │  • Photo upload        │
        │  • Video upload        │
        │  • Edit bio/tech/exp   │
        │  → POST /me/complete   │
        └────────────────────────┘
                  │
                  ▼
        ┌────────────────────────┐
        │  Refetch developerMe   │
        │  → DeveloperProfile    │
        │    (editor view)       │
        └────────────────────────┘
```

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Auth | Auth0 (`@auth0/auth0-react`) |
| Data fetching | `@tanstack/react-query` v5 |
| API client | Custom `apiFetch` wrapper over `fetch` (with JWT injection + JSON parsing) |
| Generated types | `swagger-typescript-api` reads `/openapi.json` → `src/lib/api/generated-types.ts` |
| Streaming | `fetch + ReadableStream` + custom `parseSSE` (POST body + Auth header — `EventSource` can't do that) |
| Forms | `react-hook-form` |
| Styling | Tailwind CSS 4 |
| Toasts | `sonner` |
| Carousel | `swiper` (used in landing) |
| State | tanstack-query cache + a few small contexts. No Redux. |

## Services

| Origin | Purpose |
|---|---|
| Auth0 | JWT issuer; SDK in `@/providers/Auth0Provider` |
| FastAPI backend (`http://localhost:4000`) | REST + SSE; routes mounted under `/api/*` |
| localStorage | Guest shortlist + AI Match `sessionId` + onboarding "skip interview" flag |

## Project structure

```
src/
├── app/                       # Next.js App Router
│   ├── layout.tsx             # Root layout — providers nested top-down
│   ├── page.tsx               # Landing
│   ├── signin/                # Auth0 redirect
│   ├── welcome/               # Role picker (gated by EnsureProfile)
│   ├── dashboard/
│   │   ├── page.tsx           # Developer feed
│   │   ├── developers/        # Listing + profile view
│   │   ├── shortlist/         # Saved devs (max 5)
│   │   ├── ai-match/          # SSE recruiter chat
│   │   ├── profile/           # Edit own profile / onboarding wrapper
│   │   └── settings/
│   └── dev/voice-test/        # Internal dev tool — Whisper STT smoke
├── components/
│   ├── ai-match/              # Chat UI: ChatMessage, MatchPageHeader, AIWorkingIndicator…
│   ├── auth/                  # ProtectedRoute
│   ├── home/                  # Landing sections (HomeHero, HomeFeed, HomeAIMatch…)
│   ├── icons/                 # SVG components
│   ├── layout/                # Header, Footer, DashboardLayout
│   ├── profile/               # Profile editor + onboarding flow
│   │   ├── DeveloperProfile.tsx       # Recruiter-view + dev-self-view editor
│   │   ├── forms/                     # BasicInfo, About, TechStack, Experience, Certifications, IntroVideo, ProfilePhoto, Availability
│   │   └── onboarding/                # Manual flow + interview/* (voice)
│   └── ui/                    # 30+ primitives (Button, Input, Modal, …)
├── contexts/
│   └── OnboardingContext.tsx  # showOnboardingComplete wrapper lock
├── hooks/
│   ├── useAuth.ts             # Auth0 wrapper
│   ├── useAIMatch.ts          # Chat session state machine (mounted by /ai-match page)
│   ├── useShortlist.ts        # Guest-localStorage + API merge
│   └── useUser.ts             # Reads me/developerMe/recruiterMe queries
├── lib/
│   ├── api/                   # ApiProvider, apiFetch, generated types, hooks, sse parser
│   ├── constants.ts           # AVAILABILITY_STATUS labels, etc.
│   └── utils/
└── providers/
    ├── Auth0Provider.tsx      # Validates env at startup
    ├── EnsureProfile.tsx      # /welcome redirect for signup-incomplete users
    └── ShortlistSync.tsx      # On login: merge guest shortlist → API
```

## Environment Variables

```env
# Auth0 (REQUIRED — Auth0Provider throws if missing)
NEXT_PUBLIC_AUTH0_DOMAIN=
NEXT_PUBLIC_AUTH0_CLIENT_ID=
NEXT_PUBLIC_AUTH0_AUDIENCE=

# FastAPI backend
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Scripts

```bash
yarn dev          # Start dev server (uses Turbopack via Next 16)
yarn build        # Production build
yarn start        # Start production server
yarn lint         # eslint
yarn gen:api      # Regenerate TS types from backend's /openapi.json
```

Run `yarn gen:api` whenever the backend schema changes. Requires the
backend to be running at `localhost:4000`.

## Backend integration

The backend is a FastAPI/REST service in a separate repo
([devMatch-backend-fastapi](https://github.com/dima-mamaev/devMatch-backend-fastapi)).
The frontend reads `http://localhost:4000/openapi.json` at build-time via
`yarn gen:api` to produce `src/lib/api/generated-types.ts`. Hand-written
client wrappers (`src/lib/api/hooks/*.ts`) consume those types and expose
tanstack-query hooks per endpoint.

AI Match uses Server-Sent Events streamed from `POST
/api/ai-match/sessions/{id}/messages`. We use `fetch + ReadableStream`
+ a custom `parseSSE` async generator rather than the browser's
`EventSource`, because `EventSource` doesn't support POST bodies or
`Authorization` headers.
</content>
</invoke>