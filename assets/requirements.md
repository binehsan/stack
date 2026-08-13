# Stack — Requirements

## 1. Concept

**Stack** is a minimal daily to-do dump. Not a task manager, not a planner — just a simple place to throw down everything you need to do *today*. No due dates, no projects, no categories. The list resets each day, so it never becomes a backlog of guilt — it's designed for "what's on my plate right now," not long-term tracking.

**Core philosophy:** speed and calm. Adding a task should take under 2 seconds. The UI should feel light, satisfying, and un-cluttered — closer to a beautifully designed notes app than an enterprise productivity tool.

---

## 2. Tech Stack

- **Frontend:** Expo (React Native), so the app runs on a real phone via **Expo Go** during development. Styling via React Native's `StyleSheet` (Claude Code's choice on approach — prioritize clean, maintainable styling). **Moti** (built on `react-native-reanimated`) for animations — the React Native equivalent of Framer Motion.
- **Backend:** Python, Django + Django REST Framework
- **Database:** SQLite (fine for this scope, no need for Postgres)
- **Auth:** None for v1 — single-user, local app. (Structure the backend so auth could be bolted on later without a rewrite, but don't build it now.)
- **Platform:** Mobile only (iOS/Android via Expo Go). No web/desktop target for v1.

---

## 3. Core Features (MVP — build this first)

1. **Add a task** — a single text input, press Enter or tap a button to add. No required fields beyond the task text.
2. **View today's stack** — list of all tasks added today, most recent at the top (or bottom — pick one, be consistent).
3. **Mark complete** — tap/click a task to toggle it done. Completed tasks show a strikethrough or fade, don't disappear immediately (satisfying to see what you knocked out).
4. **Delete a task** — swipe or a small delete icon, removes it entirely.
5. **Daily reset** — tasks are scoped to "today." Tasks from previous days should not show up in the main view. (Implementation detail for Claude Code to decide: either filter by created-date server-side, or a scheduled job that archives/clears at midnight — filtering by date is simpler and preferred for v1.)
6. **Persistence** — tasks are saved via the Django backend (SQLite), not just local state, so refreshing the page doesn't lose the list.

---

## 4. Stretch Features (only after MVP works end-to-end)

- Drag-to-reorder tasks
- A subtle "X tasks completed today" counter/progress indicator
- Simple streak tracking (days where at least 1 task was completed) — optional, keep very lightweight, no gamification overload
- Dark mode toggle
- Optional short note/subtext per task (still no due dates/categories — keep it minimal)

---

## 5. Data Model (Django)

```python
class Task(models.Model):
    text = models.CharField(max_length=280)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
```

Keep it this simple for v1. Resist adding fields (priority, category, due_date) — that defeats the "dump list, not planner" concept.

---

## 6. API Endpoints (Django REST Framework)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/tasks/` | List today's tasks (filter by `created_at` = today, server-side) |
| POST | `/api/tasks/` | Create a new task |
| PATCH | `/api/tasks/<id>/` | Update a task (toggle `completed`) |
| DELETE | `/api/tasks/<id>/` | Delete a task |

Use Django REST Framework's `ModelViewSet` + a router for this — it's the standard, fast way to get clean CRUD endpoints without reinventing anything.

---

## 7. UI/UX Requirements

This is the part that needs real design attention, not boilerplate styling.

**Visual direction:**
- Soft, rounded corners throughout (cards, buttons, input — think 16-24px border radius, not sharp edges)
- Gradient background — subtle, not loud (e.g. soft pastel gradient shifting diagonally, or a soft dark-mode gradient if dark mode is included). Avoid harsh, saturated, "gamer app" gradients — aim for calm and premium.
- Generous whitespace/padding — this app should feel uncluttered even with 15 tasks on screen
- Typography: one clean, modern sans-serif (e.g. Inter, or system font stack), clear hierarchy between the input, task text, and completed state

**Animations (important — this is a stated priority):**
- Adding a task: new task should animate in (slide/fade in from top or bottom), not just pop into existence
- Completing a task: satisfying micro-animation on toggle (subtle scale bounce, checkmark animation, strikethrough that draws on rather than snaps on)
- Deleting a task: animate out (slide/fade/collapse), not an abrupt disappearance — consider a swipe-to-delete gesture as the primary delete interaction, which is the natural mobile pattern
- Scroll behavior: smooth scrolling via a `FlatList` or `ScrollView` if the list grows long; consider a subtle fade-at-edges effect on the container
- Use **Moti** (`react-native-reanimated` under the hood) for all of the above — it handles enter/exit and gesture-driven animations cleanly in React Native

**Interaction feel:**
- Input box should auto-focus on load, so typing a task is immediate, no tapping required first
- Return/submit key on the keyboard submits the task; include a small "+" or send button as a visual affordance too
- Tapping a task toggles complete; swiping a task reveals/triggers delete
- Respect safe area insets (notch, home indicator) on both iOS and Android
- Handle keyboard behavior properly — the input and list should adjust when the keyboard opens, not get hidden behind it (use `KeyboardAvoidingView` or equivalent)
- Empty state (no tasks yet today) should have a clean, friendly message — not just a blank screen

---

## 8. Non-Functional Requirements

- Should look and feel great on both iOS and Android via Expo Go — test spacing/safe areas on both if possible, since they differ
- Fast — no visible lag between adding a task and seeing it appear; consider optimistic UI updates (show the task immediately, sync to backend in background) rather than waiting on the API round-trip
- Clean code structure: separate React Native components (TaskInput, TaskList, TaskItem), separate Django app for the tasks API, no giant single files
- The backend base URL needs to be easily configurable, since a phone running Expo Go will need to reach the backend over the local network (not `localhost`) — document this clearly in setup instructions

---

## 9. Explicitly Out of Scope for v1

- User accounts / login
- Multi-day task history or analytics beyond a simple daily counter
- Categories, tags, priorities, due dates
- Notifications/reminders
- Collaboration/sharing tasks with others

Keep the spec tight — the whole point of Stack is that it does one thing well. Resist scope creep even if it seems easy to add.