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
      client.js                   # shared fetch wrapper: attaches JWT, silently refreshes on 401, supports FormData uploads, surfaces `err.code`/`err.status` for error responses
      auth.js                      # register/login/change-password/delete-account/profile/avatar calls
      tasks.js                      # task CRUD + reorder/focus/carry-forward/recap/suggestions/stats calls (account mode)
      localTasks.js                  # AsyncStorage-backed task CRUD with the same signatures as tasks.js (guest mode)
      groupStacks.js                  # group stack CRUD, invites, nudge calls
    screens/
      LoginScreen.js               # email/password login, "continue as guest"
      RegisterScreen.js             # email/password/confirm/username sign-up
      HomeScreen.js                  # today's stack: input, focus section, draggable list, Dump, group-stack cards (or guest CTA banner), modals
      MyStackScreen.js                # account: avatar, @username, stats grid, reset time, change password, log out, delete account. Guest: sign-up pitch + locked feature teasers
      GroupStacksScreen.js             # hub: stacks you're in (tap to open), pending invites, create a new stack
      GroupStackDetailScreen.js         # one stack's own photo, members/invite, shared task list, polls for updates while focused
    components/
      TaskInput.js                   # the add-task text field + button + mic button (placeholder/autoFocus configurable, reused by group stacks) — mic runs real on-device speech-to-text (expo-speech-recognition, the OS's own recognizer, no third-party API) live into the text field
      TaskList.js                     # active-task rows via NestableDraggableFlatList + empty state — shares HomeScreen's scroll area with FocusSection/DumpSection
      TaskItem.js                      # a single row: checkbox, strikethrough, star, drag handle, swipe-to-delete
      FocusSection.js                  # up to 3 starred "today's focus" tasks
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

Nudging a group-stack task, and inviting someone to one, both send a push
notification. That plumbing is all wired up in code, but two things outside
the code have to be true first, or every send just silently no-ops:

1. **Expo Go can't receive remote push at all** (dropped since SDK 53) — you
   need a real EAS project and a custom **dev-client** build, not the plain
   Expo Go app.
2. **Android additionally needs Firebase credentials.** Expo's push service
   delivers to Android through Google's Firebase Cloud Messaging (FCM) —
   Google's infrastructure for pushing notifications to Android devices,
   same as every other app on the Play Store uses. Expo can't send to an
   Android device unless it's been handed credentials for *your* Firebase
   project (a Google-side service account key). Without them,
   `getExpoPushTokenAsync()` on the device just fails, which
   `pushRegistration.js` swallows silently — so the symptom is simply
   "nothing ever arrives," not an error you'll see. **iOS doesn't need
   this step.**

#### Setup (one-time)

| Step | Who |
|------|-----|
| Create a free account at [expo.dev](https://expo.dev) | You |
| From `frontend/`, run `eas init` — links this project to your account and writes a real `projectId` into `app.json`'s `extra.eas` block | You (already done for this repo — a real `projectId` is already set) |
| **Android only:** create a free project at [console.firebase.google.com](https://console.firebase.google.com), then run `eas credentials`, choose Android → push notifications, and let it either generate or upload your Firebase service account key | You |
| **iOS only:** enroll in the [Apple Developer Program](https://developer.apple.com/programs/) — required for APNs credentials, which `eas credentials` will also walk you through | You |
| Run `eas build --profile development` and install the resulting build on a **physical device** (not a simulator — push tokens don't work there) | You |
| Everything else — permission request flow, token registration, backend storage, send-on-nudge/send-on-invite | Already done |

#### Testing it end-to-end
so 
You need **two accounts on two physical devices** (or one device + one
person helping) — a push notification can't be observed on the same device
that triggers it.

1. On both devices, install the **dev-client build** from the setup step
   above and open it (not Expo Go) — then run `npx expo start --dev-client`
   and connect both to it.
2. Log into a different account on each device.
3. On Device A: create a group stack, then invite Device B's username to it.
   Accepting the OS permission prompt the first time you touch a group stack
   is what registers that device's push token — if you dismissed/denied it
   once, reinstall or reset notification permissions for the app in system
   settings, since the app won't re-prompt on its own.
4. Device B should get a push within a few seconds for the invite. Accept it.
5. On Device A: add a task to the shared stack and nudge it onto Device B's
   username (the "Nudge" button on the task row).
6. Device B should get a second push for the nudge.

If step 3/4 or 6 doesn't arrive: back out one variable at a time — confirm
both devices are on the dev-client build (not Expo Go), confirm notification
permission was actually granted (check the OS's own notification settings
for the app), and on Android confirm `eas credentials` shows FCM
credentials configured. The backend logs `## Expo push send failed: ...` to
its console on any send failure, which is the fastest way to tell "never
sent" apart from "sent but not delivered."

### No monetization

This app is entirely free — no purchase capability, no paid tier, no ads,
anywhere in the app or the backend it talks to. It used to have a
RevenueCat-based in-app purchase flow and a Stripe-backed website
subscription; both have been fully removed (not just disabled) —
`PaywallModal.js`, `BillingContext.js`, the `billing` Django app, the
`react-native-purchases` dependency, and everything that fed any of it are
gone, so there's no dormant purchase path a future config change could
accidentally re-enable.

### Voice input

Tapping the mic in `TaskInput` runs real speech-to-text via
[`expo-speech-recognition`](https://www.npmjs.com/package/expo-speech-recognition),
which wraps the phone's own built-in recognizer (iOS `SFSpeechRecognizer` /
Android `SpeechRecognizer`). That recognizer may use its OS vendor's cloud
service under the hood for its network-based mode, but it's free and
built-in — Stack doesn't call or pay for any third-party speech API. Like
push notifications above, **this is a native module: it will not work in
Expo Go**, or in a dev-client build made before this change landed — it
needs the same fresh `eas build --profile development` as that.

## Notes / judgment calls

- Used the **blank JavaScript template** (no TypeScript) to keep things
  approachable for learning React Native — the tradeoff is no compile-time
  type checking.
- Used `fetch` directly instead of adding `axios` — one fewer dependency,
  and `fetch` is all this app's simple CRUD calls need.
- Icons are [lucide-react-native](https://lucide.dev) (+ its `react-native-svg`
  peer dependency) — every icon in the app is one of these, not emoji. Chosen
  over `@expo/vector-icons`' font-based sets specifically because it's
  SVG-based, so things like the starred/unstarred focus toggle can actually
  render a filled vs. outlined icon (a font glyph can't do that — there's
  only one shape per character).
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
