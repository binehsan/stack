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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={CrashScreen}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
