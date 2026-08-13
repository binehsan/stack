# Stack — Frontend

Expo (React Native) app for Stack, built to run in **Expo Go** on a physical
phone during development. Animations via [Moti](https://moti.fyi) and
`react-native-reanimated`; gradient background via `expo-linear-gradient`;
swipe-to-delete via `react-native-gesture-handler`; drag-to-reorder via
`react-native-draggable-flatlist`; navigation via `@react-navigation/native-stack`;
JWTs stored via `expo-secure-store`; avatar picking via `expo-image-picker`.

## Project structure

```
frontend/
  App.js                      # providers (theme/auth/navigation) + the 3-way navigator (authenticated / guest / logged-out)
  src/
    theme.js                   # color palettes ("dawn"/"dusk"), spacing, radii, typography scale
    auth/
      tokenStore.js             # SecureStore-backed JWT storage, read by api/client.js
      AuthContext.js             # login/register/logout/email + guest mode (continueAsGuest, guest→account task import) + change-password/delete-account passthroughs
    context/
      ThemeContext.js           # current theme + toggle, persisted via SecureStore
    hooks/
      usePollingOnFocus.js       # interval polling, paused when unfocused/backgrounded — used by GroupStackDetailScreen
    api/
      config.js                  # backend base URL — EDIT THIS for your network
      client.js                   # shared fetch wrapper: attaches JWT, silently refreshes on 401, supports FormData uploads
      auth.js                      # register/login/change-password/delete-account/profile/avatar calls
      tasks.js                      # task CRUD + reorder/focus/carry-forward/recap/suggestions/stats calls (account mode)
      localTasks.js                  # AsyncStorage-backed task CRUD with the same signatures as tasks.js (guest mode)
      groupStacks.js                  # group stack CRUD, invites, nudge calls
    screens/
      LoginScreen.js               # email/password login, "continue as guest"
      RegisterScreen.js             # email/password/confirm/username sign-up
      HomeScreen.js                  # today's stack: input, chips, focus section, draggable list, Dump, group-stack cards (or guest CTA banner), modals
      MyStackScreen.js                # account: avatar, @username, stats grid, reset time, change password, log out, delete account. Guest: sign-up pitch + locked feature teasers
      GroupStacksScreen.js             # hub: stacks you're in (tap to open), pending invites, create a new stack
      GroupStackDetailScreen.js         # one stack's own photo, members/invite, shared task list, polls for updates while focused
    components/
      TaskInput.js                   # the add-task text field + button (placeholder/autoFocus configurable, reused by group stacks)
      TaskList.js                     # active-task rows via NestableDraggableFlatList + empty state — shares HomeScreen's scroll area with FocusSection/DumpSection
      TaskItem.js                      # a single row: checkbox, strikethrough, star, drag handle, swipe-to-delete
      FocusSection.js                  # up to 3 starred "today's focus" tasks
      QuickAddChips.js                  # tappable recurring-task suggestions
      DumpSection.js                     # collapsible "done today" bucket completed tasks fall into
      CarryForwardModal.js                # opt-in prompt to bring yesterday's unfinished tasks forward
      RecapModal.js                        # once-per-day "you did X of Y" summary
      Avatar.js                             # circular avatar image, or initial-letter fallback — used for users and group stacks alike
      GroupTaskItem.js, NudgeModal.js        # group stack task row with assignee avatar, delegate-to-member modal
      GuestCTABanner.js, SignUpNudgeModal.js   # guest-mode upsell: a persistent Home banner, and a reusable "this needs an account" modal for gated features
      StatTile.js, DeleteAccountModal.js       # myStack screen building blocks
      AuthTextField.js, PrimaryButton.js, ErrorBanner.js  # shared auth/form building blocks
```

## Setup

From the `frontend/` directory:

```bash
npm install
```

### Auth

Register/login screens call `/api/auth/register/` and `/api/auth/login/`
(email + password only — no verification flow). Tokens are stored via
`expo-secure-store`, not `AsyncStorage`, since they're sensitive. Every task
API call goes through `src/api/client.js`, which attaches the access token
and, on a `401`, silently calls `/api/auth/refresh/` once and retries before
giving up and logging the user out.

### 1. Point the app at your backend

Edit `src/api/config.js` and set `HOST` to your computer's LAN IP (not
`localhost` — your phone is a separate device on the network and can't reach
your computer's `localhost`):

```js
const HOST = '192.168.1.42'; // <- your computer's IP
```

Find your IP with:
- **Windows:** `ipconfig` → look for "IPv4 Address"
- **macOS/Linux:** `ifconfig` (or `ip addr`) → look for `inet` under your Wi-Fi adapter

Make sure the [backend](../backend/README.md) is running with
`python manage.py runserver 0.0.0.0:8000` (not the default `127.0.0.1`) so it
accepts connections from other devices, and that your phone is on the **same
Wi-Fi network** as your computer.

### 2. Start the dev server

```bash
npx expo start
```

This prints a QR code in the terminal.

### 3. Open it on your phone

1. Install the **Expo Go** app ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
2. Scan the QR code:
   - **iOS:** open the Camera app and scan it, then tap the banner
   - **Android:** open Expo Go and use its built-in QR scanner
3. The app loads on your phone. Any code change hot-reloads automatically.

### Push notifications (optional — the app works fine without this)

Nudging a group-stack task now sends a push notification to the assignee.
That plumbing is all wired up in code, but **Expo Go can't receive remote
push notifications** — it needs a real EAS project and a custom dev-client
build. None of the rest of the app needs this; skip it if you don't care
about testing push on-device yet.

| Step | Who |
|------|-----|
| Create a free account at [expo.dev](https://expo.dev) | You |
| From `frontend/`, run `eas init` — links this project to your account and writes a real `projectId` into `app.json`'s `extra.eas` block (replace the `REPLACE_WITH_YOUR_EAS_PROJECT_ID` placeholder) | You |
| For iOS push: enroll in the [Apple Developer Program](https://developer.apple.com/programs/) — required for APNs credentials | You |
| Run `eas build --profile development` and install the resulting build on a physical device (not a simulator — push tokens are unreliable there) | You |
| Everything else — permission request flow, token registration, backend storage, send-on-nudge | Already done |

Once a dev-client build is installed and you're logged in, creating or
joining your first group stack triggers the permission prompt
(`src/notifications/pushRegistration.js`) — accepting it registers your
device's Expo push token with the backend (`POST /api/auth/push-token/`).
From then on, anyone nudging a task onto you fires a real push.

## Notes / judgment calls

- Used the **blank JavaScript template** (no TypeScript) to keep things
  approachable for learning React Native — the tradeoff is no compile-time
  type checking.
- Used `fetch` directly instead of adding `axios` — one fewer dependency,
  and `fetch` is all this app's simple CRUD calls need.
- No icon library — the "+" button in `TaskInput` is plain text, to avoid an
  extra dependency for a single glyph.
- Delete works both ways: swiping a task fully to the left auto-deletes it,
  and a partial swipe reveals a "Delete" button you can tap instead.
- List enter/exit/reorder animations use `react-native-reanimated`'s built-in
  `entering`/`exiting`/`layout` props directly (rather than Moti's
  `AnimatePresence`) — Moti's `AnimatePresence` re-exports from `framer-motion`
  internally, which isn't a real React Native library and isn't a reliable
  runtime dependency here. Moti (`MotiView`) is still used for the
  checkbox bounce and the strikethrough "draw on" animation, per the spec.
  Same reason `moti`'s `SafeAreaView` export is never imported — but merely
  importing `MotiView` still loads that file as a side effect (it imports
  RN's own deprecated `SafeAreaView` just to wrap it), which is why RN's
  one-time deprecation warning about it is suppressed in `App.js` — it isn't
  coming from our code, and can't be fixed by changing our imports.
- Glyphs are picked carefully: real single-codepoint emoji (🌙 ☀️ 👤 ✨ 🗑️)
  for icons, and only long-standing, broadly-supported symbols (★ ☆ ✓ › ‹ ▾)
  for the rest. Obscure symbol blocks (Miscellaneous Technical, Miscellaneous
  Symbols outside the common subset) render as a tofu box on some Android
  fonts — that's what happened with an earlier ⏻ logout icon and a ⌄ chevron,
  both since replaced.
- The strikethrough on a completed task is a real `textDecorationLine`, not
  a hand-positioned line — it's revealed via an animated width-clipped
  overlay so it still "draws on" left-to-right without risking misalignment
  from guessing at line-height metrics.
- Completed tasks stay in the active list just long enough to show their
  strike-through (`DUMP_DELAY_MS` in `HomeScreen.js`), then move into the
  collapsible "Dump" section rather than piling up at the bottom of today's
  list forever.
- Drag-to-reorder uses `react-native-draggable-flatlist`'s **Nestable** API
  (`NestableScrollContainer` + `NestableDraggableFlatList`) rather than a
  plain `FlatList`, specifically so the draggable active-task list can live
  in the same scrollable area as `FocusSection` and `DumpSection` above/below
  it — a plain `FlatList` there would fight the outer scroll and couldn't
  share space with static siblings. Each `TaskItem` only starts a drag from
  its dedicated `☰` handle (`onLongPress`), not the whole row, so it can't
  conflict with the swipe-to-delete or tap-to-toggle gestures on the same row.
- "Cross-device sync" is deliberately not a persistent connection (no
  websockets) — `HomeScreen` refetches tasks whenever the screen regains
  navigation focus or the app returns to the foreground (`AppState`
  listener), plus a manual refresh button in the header (pull-to-refresh was
  removed — it kept firing accidentally from the drag-to-reorder gesture
  near the top of the list). Good enough for a few devices checking in
  periodically. `GroupStackDetailScreen` additionally polls every 6s while
  it's focused and the app is foregrounded (`hooks/usePollingOnFocus.js`),
  since a shared list is more likely to change out from under you
  mid-session than a solo one — still not a persistent connection, just a
  tighter interval scoped to one screen instead of app-wide.
- The daily reset boundary is per-user (`Profile.reset_hour`, edited from
  myStack), not always midnight — the backend computes it, the frontend just
  displays/sets the hour as a handful of presets rather than a full time
  picker.
- Group stacks are a separate, non-day-scoped list (`family` app/URL prefix
  `family`, renamed everywhere else to "group stacks") — on purpose: shared
  responsibilities don't reset at midnight the way a personal daily dump
  does. Unlike the original single-family-stack design, a user can belong to
  any number of group stacks at once (e.g. one for family, one for friends)
  — there's no fixed "type", just a name and an optional photo per stack.
  `GroupStacksScreen` is the always-visible hub (from myStack's "Group
  Stacks" row, or Home's "+ New/Join" card) — every stack you're in, pending
  invites, and a create-a-stack form. `GroupStackDetailScreen` is the
  per-stack shared list, reached by tapping a stack from the hub or from
  Home's dashboard card row.
