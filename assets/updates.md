Extend the existing Stack app (Django backend in /backend, Expo/React Native frontend in /frontend). Read requirements.md and app-plan-stack.md in this repo first for context on the product's philosophy before making changes — the core principle is "no guilt, no bloat," so implement additions in that spirit, not as a generic feature dump.

## 1. Add user accounts

**Backend (Django):**
- Add authentication using Django's built-in `User` model + `djangorestframework-simplejwt` for JWT-based auth (access + refresh tokens)
- Add endpoints: `POST /api/auth/register/`, `POST /api/auth/login/`, `POST /api/auth/refresh/`
- Update the `Task` model to add a `ForeignKey` to `User`, so tasks are scoped per-user
- Update the task endpoints so they only return/modify the authenticated user's tasks (use `request.user` in the viewset, not a global query)
- Keep it simple: email + password only, no social login, no email verification flow for now

**Frontend (Expo):**
- Add a Login screen and a Register/Sign Up screen (simple: email, password, confirm password on signup)
- Store the JWT securely using `expo-secure-store` (not AsyncStorage, since tokens are sensitive)
- Add an auth context/provider (`AuthContext`) that tracks whether the user is logged in and exposes login/logout functions
- Set up navigation so unauthenticated users see Login/Register, and authenticated users see the main task screen — use React Navigation's conditional rendering pattern based on auth state
- Attach the JWT to all task API requests (Authorization header)
- Handle token refresh gracefully — if a request fails due to an expired token, attempt a silent refresh before logging the user out
- Keep the auth screens visually consistent with the rest of the app's design system (see UI section below) — not a bare default-styled form

## 2. Add these features (from app-plan-stack.md's v2 list — implement only these, not the full list)

- **3-task focus mode**: let the user star up to 3 tasks as "today's focus." Show these visually distinct (e.g. a small highlighted section above the rest of the dump list). Starring is optional — the app works fine with zero stars.
- **Carry forward (opt-in only)**: when a task isn't completed by reset time, don't auto-carry it. Instead, right before/at reset, show a lightweight prompt letting the user pick specific unfinished tasks to bring into tomorrow. Never automatic.
- **End-of-day recap**: a small, non-punishing summary shown once per day ("You did 6 of 9 today") — no streak-shaming, no red/negative framing, just a clean, warm summary. A subtle celebratory animation if most/all tasks were completed.
- **One-tap recurring chips**: a small row of tappable suggestion chips for tasks the user adds often (e.g. auto-detect their 3-5 most repeated task texts over the past 2 weeks, or let them manually pin a few) — tapping instantly adds that task instead of retyping.

Do not implement any other feature from app-plan-stack.md beyond these four — the "someday pocket," mood check-ins, widgets, etc. are explicitly out of scope for this pass.

## 3. UI refresh

- Elevate the visual design beyond the MVP baseline in requirements.md: refine the gradient system (consider a couple of theme options, not just one fixed gradient), improve spacing/typography rhythm, and make sure the new auth screens and focus-mode section feel like part of the same design language, not bolted on
- Continue using Moti for animations; extend animation polish to the new elements (focus-mode star toggle, recap screen appearance, chip taps)
- Make sure loading and error states (login failing, network issues, etc.) are handled with the same design care as the rest of the app — no default/ugly error alerts

## General instructions

- Do not break existing MVP functionality (add/view/complete/delete, daily reset) while adding these features
- Keep code organized: auth logic in its own service/context files, new features as their own components, consistent with the existing project structure
- After building, summarize what was added, any new setup steps (e.g. installing `djangorestframework-simplejwt`, `expo-secure-store`), and flag any design/product decisions you had to make where the spec was ambiguous