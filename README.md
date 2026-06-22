# DevMatch Frontend

A modern developer talent marketplace built with Next.js 16 and React 19. Features AI-powered matching, real-time video profiles, and seamless recruiter-developer connections.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NEXT.JS APP ROUTER                             │
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   Landing   │ │   Join /    │ │  Dashboard  │ │       AI Match          ││
│  │    Page     │ │   SignIn    │ │    Pages    │ │         Page            ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────────┘│
│         │               │               │                    │              │
│         └───────────────┴───────────────┴────────────────────┘              │
│                                    │                                        │
│  ┌─────────────────────────────────┴───────────────────────────────────────┐│
│  │                            PROVIDERS                                    ││
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────────────┐││
│  │  │ Auth0Provider │  │ ApolloProvider│  │      ShortlistSync            │││
│  │  │   (Auth)      │  │   (GraphQL)   │  │  (localStorage → API sync)    │││
│  │  └───────────────┘  └───────────────┘  └───────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
         │                    │                              │
         │                    │                              │
         ▼                    ▼                              ▼
┌─────────────────┐  ┌─────────────────┐           ┌─────────────────┐
│     Auth0       │  │  GraphQL API    │◄─────────►│   localStorage  │
│   (Identity)    │  │   (Backend)     │           │  (Guest State)  │
└─────────────────┘  └─────────────────┘           └─────────────────┘
```

## Data Flow

### Authentication Flow

```
┌──────────┐    ┌──────────┐    ┌──────────────────┐    ┌────────────────┐
│   User   │───►│  /join   │───►│  Role Selection  │───►│    Auth0       │
│  Visits  │    │  Page    │    │  Dev/Recruiter   │    │   Redirect     │
└──────────┘    └──────────┘    └──────────────────┘    └────────────────┘
                                                               │
                    ┌──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         AUTH CALLBACK                                    │
│                                                                          │
│   1. Auth0 redirects back with tokens                                    │
│   2. ApolloProvider attaches JWT to requests                             │
│   3. GetMe query fetches user + profile                                  │
│   4. ShortlistSync merges localStorage → API                             │
│   5. User redirected to dashboard                                        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### AI Match Flow

```
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────────────┐
│  User    │───►│  Chat    │───►│  GraphQL     │───►│   AI Agent       │
│  Prompt  │    │  Input   │    │  Subscription│    │   (Backend)      │
└──────────┘    └──────────┘    └──────────────┘    └──────────────────┘
     ▲                                                      │
     │                                                      │
     │              ┌───────────────────────────────────────┘
     │              │
     │              ▼
     │     ┌──────────────────────────────────────────────────────┐
     │     │              REAL-TIME EVENT STREAM                  │
     │     │                                                      │
     │     │  1. THINKING     → "Analyzing your request..."       │
     │     │  2. TOOL_CALL    → search_developers                 │
     │     │  3. TOOL_RESULT  → "Found 15 candidates"             │
     │     │  4. MATCH_FOUND  → Developer card with score         │
     │     │  5. COMPLETE     → Summary message                   │
     │     │                                                      │
     └─────│──────────────────────────────────────────────────────│
           │                                                      │
           └──────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| API | Apollo Client + GraphQL |
| Real-time | GraphQL Subscriptions (graphql-ws) |
| Auth | Auth0 |
| Forms | React Hook Form |
| Styling | Tailwind CSS 4 |
| Carousel | Swiper |
| Notifications | Sonner |

## Project Structure

```
frontend/
└── src/
    ├── app/                      # Next.js App Router pages
    │   ├── page.tsx              # Landing page
    │   ├── join/                 # Role selection
    │   ├── signin/               # Auth0 sign-in
    │   └── dashboard/            # Protected routes
    │       ├── page.tsx          # Developer video feed
    │       ├── developers/       # Browse & profile view
    │       ├── shortlist/        # Saved developers
    │       ├── ai-match/         # AI matching chat
    │       ├── profile/          # Edit profile
    │       └── settings/         # Account settings
    │
    ├── components/
    │   ├── ui/                   # 30+ reusable components
    │   │   ├── Button.tsx
    │   │   ├── DevCard.tsx
    │   │   ├── VideoPlayer.tsx
    │   │   └── ...
    │   ├── ai-match/             # AI chat components
    │   ├── profile/              # Profile & onboarding
    │   ├── layout/               # Header, Footer, DashboardLayout
    │   └── icons/                # SVG icon components
    │
    ├── hooks/
    │   ├── useAuth.ts            # Auth utilities
    │   ├── useUser.ts            # Current user data
    │   ├── useShortlist.ts       # Shortlist management
    │   └── useAIMatch.ts         # AI matching state machine
    │
    ├── lib/
    │   ├── graphql/
    │   │   ├── operations.ts     # Queries & mutations
    │   │   └── generated.ts      # Auto-generated types
    │   ├── constants.ts          # App constants
    │   └── utils/                # Helper functions
    │
    └── providers/
        ├── Auth0Provider.tsx     # Auth0 configuration
        ├── ApolloProvider.tsx    # GraphQL client + WebSocket
        └── ShortlistSync.tsx     # Guest → User sync
```

## Key Features

### User Roles

| Role | Capabilities |
|------|--------------|
| **Developer** | Create profile, upload video, add experience/projects |
| **Recruiter** | Browse developers, manage shortlist (max 5), AI match |
| **Guest** | Browse feed, save to localStorage shortlist |

### Shortlist System

```
┌─────────────────────────────────────────────────────────────────┐
│                      SHORTLIST FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Guest User                    Authenticated User               │
│  ───────────                   ──────────────────               │
│  │                             │                                │
│  ▼                             ▼                                │
│  localStorage ──────────────► API (on login)                    │
│  (max 5 IDs)                  (full sync)                       │
│                                                                 │
│  Features:                                                      │
│  • Instant add/remove                                           │
│  • Cross-session persistence                                    │
│  • Automatic deduplication on merge                             │
│  • Real-time count badge                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Developer Onboarding

7-step flow: Role → Photo → Video → Tech Stack → Experience → Links → Done

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run codegen` | Generate GraphQL types |
| `npm run codegen:watch` | Watch mode for codegen |
