import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import CrashScreen from './components/CrashScreen.jsx'
import { initSentry } from './sentry.js'

initSentry()

// vite.config.js sets `injectRegister: false` specifically so this call
// (rather than vite-plugin-pwa's own auto-injected, unwatched
// registration script) is what actually registers sw.js — the point is
// `onRegisterError` below, which turns a failed registration into a
// handled, tagged, low-severity Sentry event instead of a bare unhandled
// "Rejected" with no context. Registration failing is never fatal to the
// app itself (Stack works the same without a service worker, just without
// offline caching/push for that session), so this deliberately doesn't
// retry or surface anything to the user.
registerSW({
  immediate: true,
  onRegisterError(error) {
    Sentry.captureException(error, {
      level: 'warning',
      tags: { area: 'service-worker-register' },
    })
  },
})

// Client-side routing never gets a real page load, so the browser's own
// scroll-restoration (which assumes each navigation is a fresh document)
// doesn't apply the way it would on a traditional multi-page site — left
// on, it can restore whatever scroll offset happened to be recorded for a
// URL, unrelated to what App.jsx's own route-change handler (see
// AnimatedOutlet) is trying to do. Manual mode hands scroll position
// entirely to the app instead of fighting the browser's guess.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

// A tab left open across a deploy still has the PREVIOUS build's JS loaded
// — when it lazy-loads a route (see App.jsx's lazy() imports) whose chunk
// filename changed in the new build (content-hashed, so every deploy
// renames them), the fetch 404s and Vite's preload runtime dispatches this
// event instead of just throwing into the void. The fix is always the
// same — the tab needs the CURRENT build, which only a real reload gets —
// so do that automatically instead of showing a scary crash screen for
// what's really just "a new version shipped while you were looking at this
// page."
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={CrashScreen}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
