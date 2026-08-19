import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'
import CrashScreen from './components/CrashScreen.jsx'
import { initSentry } from './sentry.js'

initSentry()

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
