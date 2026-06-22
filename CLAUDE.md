# CLAUDE.md

Conventions and footguns specific to this repo. Everything visible from a
file scan is in `README.md` — this file is for the non-obvious stuff.

## Stack reality check

- **tanstack-query**, not Apollo. No GraphQL anywhere. No Redux.
- **REST** via a custom `apiFetch` wrapper (`src/lib/api/api-fetch.ts`).
- **Types are generated** from the backend's `/openapi.json` via
  `swagger-typescript-api`. Don't hand-edit `src/lib/api/generated-types.ts`.
- Package manager is **yarn**, not npm.
- The backend lives in a **separate repo**
  (`dima-mamaev/devMatch-backend-fastapi`). Don't expect to find it here.

## Required conventions

**1. Use the existing api-hook layer.** Every endpoint already has a
typed wrapper in `src/lib/api/hooks/*.ts` (`useMe`, `useDevelopers`,
`useOnboarding`, `useProfileMutations`, `useShortlistApi`, `useAIMatch`).
Add to those files, don't sprinkle ad-hoc `useQuery({ queryFn: …})`
calls in components. The wrappers also encode the queryKey conventions
in `src/lib/api/queryKeys.ts` — touching keys without updating that file
breaks cache invalidation.

**2. Cache invalidation on mutations is opinionated.** After mutating
profile data, invalidate via the matching `queryKeys.*` entry — usually
`queryKeys.me`, `queryKeys.developerMe`, or `queryKeys.recruiterMe`. The
existing mutations in `useProfileMutations.ts` show the pattern. **Do NOT
invalidate `onboardingMe` from `useCompleteOnboarding`** — it triggers
a 404 refetch that briefly re-renders `InterviewIntro` before the
wrapper releases. We learned this the hard way.

**3. AI Match streams via `fetch + ReadableStream`, not `EventSource`.**
`EventSource` can't send POST bodies or `Authorization` headers. The
SSE parser is `src/lib/api/sse.ts`. All event types are defined in
`useAIMatch.ts`; the matching backend types live in
`backend/app/ai_match/events.py`.

**4. Auth0 env vars validated at startup.** `Auth0Provider` throws if
`NEXT_PUBLIC_AUTH0_DOMAIN` or `NEXT_PUBLIC_AUTH0_CLIENT_ID` is missing.
Don't `??`-default them silently.

**5. Generated types are non-nullable where the backend says so.** Optional
fields are typed `T | null | undefined`. The Pydantic backend ships
optionals as `nullable: true` — the generator produces `?: T | null`,
**not** required `T`. Don't add `!` non-null assertions on optional
backend fields. Use the narrowing helper `asCompletedDeveloper` (in
`src/lib/api/types.ts`) at the route gate when you need a fully-completed
profile, then read fields without `!`.

**6. Generated typings vs hand-written.** `src/lib/api/generated-types.ts`
is regen'd by `yarn gen:api` — never hand-edit, your changes disappear
on next regen. Use `src/lib/api/types.ts` for hand-written aliases /
narrowing helpers that the rest of the code imports from.

**7. ShortlistSync runs on auth-state flip only.** Guest puts dev IDs in
localStorage; the moment Auth0 reports authenticated, `ShortlistSync`
merges LS → API once, then clears LS. If you add new "guest state" that
should migrate on signup, follow the same pattern (one-shot effect
gated by an auth-flip ref).

**8. The onboarding "manual + interview" flow is a state machine.** Lives
in `src/components/profile/onboarding/useOnboardingStateMachine.ts`.
Don't put new step-decision logic in `DeveloperOnboarding.tsx` — extend
the hook instead. The wrapper-lock pattern (`showComplete` in
`OnboardingContext`) keeps the parent stable during a save so the editor
doesn't flash mid-write.

## Footguns

**Auto-resume orphan questions in AI Match.** If the user navigates away
mid-stream, the user message survives (backend commits it immediately)
but the assistant turn doesn't. On remount, `useAIMatch` detects the
trailing user message and auto-fires `sendMessage` once. There's a
`autoResumeRef` guard so a failed retry doesn't loop. Don't break this
ref logic if you refactor the hook.

**Cache invalidation race in onboarding save.** `useCompleteOnboarding`
intentionally invalidates only `me/developerMe/recruiterMe`, NOT
`onboardingMe`. Touching `onboardingMe` causes a 404 refetch that briefly
re-renders `InterviewIntro` while the wrapper is still flipping —
visible flash. There's a comment in `useOnboarding.ts:useCompleteOnboarding`
explaining this; don't ignore it.

**Stale ApiProvider tokens on Auth0 logout/login.** The token getter is
re-registered in `ApiProvider` during render via `setTokenGetter(...)`.
If you wrap the app in extra providers and somehow break that re-register,
post-login requests use the pre-login token. Keep `ApiProvider` adjacent
to `Auth0Provider` in `layout.tsx`.

**localStorage skip flag for the AI interview.** Per-developer-id key:
`devmatch_onboarding_skip_interview:<devId>`. A developer who skipped
once doesn't get the interview offer again on the same browser. Cleared
when they explicitly choose to retry.

**`react-hooks/set-state-in-effect` lint rule.** Newer Next/React eslint
config flags any `setState` directly inside `useEffect`. We have two
intentional exceptions in `useOnboardingStateMachine.ts` and
`DeveloperOnboarding.tsx` (data-mirror effects) with explicit
`// eslint-disable-next-line` comments. If you add a new state-syncing
effect, prefer render-time derivation; only reach for the suppression
if the state genuinely needs to track an async-loaded value.

## Adding an AI Match feature event

If the backend gains a new SSE event type (e.g. `INSIGHT_FOUND`):

1. Add the type to `AIMatchEventType` in `src/hooks/useAIMatch.ts`.
2. Add a typed payload interface (search for `ConnectedPayload` for the pattern).
3. Add a `case "INSIGHT_FOUND":` branch in `dispatchEvent` inside the same hook.
4. If the working indicator should label it, add an entry to `TOOL_LABELS`
   in `src/components/ai-match/AIWorkingIndicator.tsx`.

## Style

- Comments explain *why*, not *what*. No multi-paragraph docstrings.
- No new `*.md` files unless explicitly asked.
- Don't import from `@apollo/*` — there's no Apollo in the project.
- Don't add `useReducer` for simple useState — react-query handles most server state.
- No `npm run`; use `yarn` (the lockfile is `yarn.lock`).
</content>
</invoke>