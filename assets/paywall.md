Implement the full "Stack Pro" paywall and subscription system across the existing Stack app (Django backend in /backend, Expo/React Native frontend in /frontend). Read requirements.md and app-plan-stack.md first for full context before making changes.

**Use subagents to parallelize this work**: split the task into backend (entitlements/webhooks), frontend (paywall UI + gating), and IAP/RevenueCat integration as separate concurrent workstreams where possible, then integrate. Have a final review pass that checks the three pieces work together end-to-end before declaring this done.

## 1. What's free vs. Pro — the exact split

**Free, unconditionally, no caps:**
- Core push/pop task experience, unlimited tasks
- Share-sheet capture
- Daily reset
- Nudge (single push notification)
- Group Stacks — founding 1 group, unlimited members in that group (soft cap of 20 for abuse prevention only, not a paywall — see section 4)
- Joining any other group (regardless of the joiner's own subscription tier — joining must NEVER be paywalled)
- 1 synced device
- Basic themes

**Behind "Stack Pro":**
- **Voice input** — capped even for Pro users at a generous but finite monthly quota (e.g. 200 voice captures/month) to protect against runaway speech-to-text API costs. Show a clear, friendly in-app message if the quota is hit ("You've used your voice captures for this month, resets on [date]") — never silently fail.
- **Founding additional groups** — free tier: found 1 group max. Pro: found unlimited groups. (Joining groups founded by others is always free regardless of tier.)
- **Uncapped device sync** — free tier: 1 device. Pro: unlimited devices.
- **Premium themes/gradients**

## 2. Payment infrastructure

- Use **RevenueCat** for subscription/IAP management rather than building raw App Store/Play Store billing integration from scratch — it handles receipt validation, cross-platform subscription state, and webhook events reliably, and is the standard choice for indie apps at this scale
- Configure two purchase options: monthly subscription ($2.99/mo), annual subscription ($19.99/yr), and a one-time non-consumable "lifetime unlock" ($14.99)
- Backend (Django): add an `is_pro` (or `subscription_status` + `subscription_expires_at`) field to the user model, updated via RevenueCat webhook events (not just trusted client-side state — the backend must be the source of truth for entitlement, since client-side flags can be spoofed)
- Set up the RevenueCat webhook endpoint in Django to receive purchase/renewal/cancellation/expiration events and update user entitlement accordingly
- All Pro-gated backend logic (group creation limits, device sync limits, voice quota) must check the backend's `is_pro`/entitlement state — never trust a frontend-only flag for anything that affects data or costs

## 3. Frontend paywall UI

- Build a single, well-designed Paywall screen (not a jarring generic native alert) shown when a free user hits a gate — should feel consistent with the app's calm/premium design language (gradients, rounded cards, smooth animation), not a bolted-on sales screen
- Trigger points: attempting to found a 2nd group as a free user, attempting to sync a 2nd device as a free user, attempting voice input as a free user, and a general "Upgrade" entry point in settings
- Copy tone: match the app's philosophy — no aggressive dark-pattern urgency language ("LAST CHANCE," countdown timers), just a clear, honest value explanation
- After purchase, entitlement state should update immediately in the UI without requiring an app restart (listen for RevenueCat's customer info updates)
- Handle restore purchases (required by both app stores) — a visible "Restore Purchases" option in settings

## 4. Abuse-prevention cap (not a paywall)

- Implement a soft cap of ~20 members per Group Stack, applying to ALL groups regardless of founder's tier — this exists purely to prevent the free "found 1 group" tier being used as an unlimited public broadcast list, not as a monetization lever. If hit, show a friendly explanatory message, not a paywall prompt.

## 5. General instructions

- Do not break any existing functionality while adding this system
- Backend must be the authoritative source of truth for all entitlement checks — treat any purely client-side gating as a placeholder to be backed by a real server-side check
- Write basic tests for the entitlement logic specifically (a free user cannot found a 2nd group via direct API call even if they bypass the UI, etc.) — this is the part most likely to be exploited if left unchecked
- After building, summarize: what was implemented, any RevenueCat account/dashboard setup steps I still need to do manually (product IDs, App Store Connect / Play Console configuration), and flag any decisions made where the spec was ambiguous
