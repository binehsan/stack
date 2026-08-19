import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import LoadingSpinner from './components/LoadingSpinner';
import { isStandalonePwa } from './pwaMode';

// Lazy — every route is its own chunk, fetched only when actually visited,
// instead of one ~500KB bundle shipped upfront regardless of whether
// someone ever sees Settings or the Contact page. A first-time visitor to
// / only downloads Landing's code; the Dashboard chunk (the biggest single
// page) only loads once they're actually signing in.
const Landing = lazy(() => import('./pages/Landing'));
const About = lazy(() => import('./pages/About'));
const Features = lazy(() => import('./pages/Features'));
const Install = lazy(() => import('./pages/Install'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Welcome = lazy(() => import('./pages/Welcome'));
const ShareTarget = lazy(() => import('./pages/ShareTarget'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const GroupStacks = lazy(() => import('./pages/GroupStacks'));
const GroupStackDetail = lazy(() => import('./pages/GroupStackDetail'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

// The marketing site (Landing/About/Features/Contact) exists for people
// arriving in a normal browser tab — nobody who already installed the app
// should ever land back on a pitch for the thing they've already got
// installed. An installed PWA skips straight past it to /dashboard, which
// itself bounces to /login if there's no session yet — the same "open the
// app, see a login screen" shape as any native app, never a homepage.
function MarketingOrApp({ children }) {
  if (isStandalonePwa()) return <Navigate to="/dashboard" replace />;
  return children;
}

function RouteFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <LoadingSpinner />
    </div>
  );
}

// A crossfade+morph for whatever route just changed within ONE layout — see
// the two layouts below for why this is deliberately scoped per-layout
// rather than one instance spanning the whole app. Mirrors the mobile app's
// native-stack `animation: 'fade'` screenOptions (see frontend/App.js) so
// switching pages feels like a real app's screen transition instead of a
// browser just swapping content.
//
// Deliberately NOT `mode="wait"`: that fully unmounts the outgoing page
// (and stops rendering it) before the incoming page mounts, which reads as
// a hard cut to blank/background between pages before the new one fades
// in — exactly the "goes black then fades" complaint. Instead we let both
// pages coexist for the transition's duration (AnimatePresence's default
// "sync" mode) and pull the exiting page out of layout flow via
// `position: absolute` in its `exit` variant — framer-motion applies
// non-animatable style values like `position`/`inset` immediately rather
// than tweening them, so the exiting page detaches from flow the instant
// it starts leaving. That means the incoming page (still in normal flow)
// determines the container's height immediately, while the outgoing page
// overlays on top of it and fades/scales out — a true overlap/crossfade
// with no layout-jump risk, unlike `mode="popLayout"` which can jump when
// two routes have different heights. The outer wrapper needs
// `position: relative` so the exiting page's `inset: 0` is positioned
// against it rather than the nearest ancestor that happens to have one.
//
// Uses `useOutlet()` instead of taking children directly so the SAME
// component can sit at different depths of the route tree — see
// MarketingLayout and AppLayout below.
function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();

  // React Router's client-side navigation never triggers a real page load,
  // so nothing resets scroll position on its own — a page you'd scrolled
  // down on stays scrolled down underneath whatever you navigate to next,
  // since it's all the same document. Most visible on Login: land there
  // after scrolling down on a previous page (or after Login itself grew
  // taller than the viewport once) and it renders already scrolled past
  // the logo. Every route change resets to the top; see main.jsx for the
  // matching `history.scrollRestoration = 'manual'`, which stops the
  // browser's own back/forward scroll memory from fighting this.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div style={{ position: 'relative' }}>
      <AnimatePresence>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02, position: 'absolute', inset: 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        >
          <Suspense fallback={<RouteFallback />}>{outlet}</Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Marketing/auth pages get one AnimatedOutlet shared across all of them.
function MarketingLayout() {
  return <AnimatedOutlet />;
}

// The authenticated app's shell (topbar/nav/theme-toggle/gradient
// background, all inside AppShell) is hoisted to this ONE layout route
// instead of being wrapped around each of the four app pages individually.
// Previously every one of those pages was its own top-level route each
// re-wrapped in `<AppShell>`, which meant AppShell — and everything inside
// it, including GradientBackground's layered gradient/drift/glow divs —
// fully unmounted and remounted on every single tab switch (My Stack ↔
// Group Stacks ↔ Settings), with two complete copies of it briefly
// coexisting mid-transition. That's what was actually producing the
// flicker: not the crossfade animation itself, but the header and
// background tearing down and rebuilding underneath it on every navigation.
// Nesting the four app routes under this one layout route means AppShell
// mounts once and stays mounted for as long as you're anywhere in the app;
// only the inner AnimatedOutlet's matched page swaps and crossfades.
function AppLayout() {
  return (
    <ProtectedRoute>
      <AppShell>
        <AnimatedOutlet />
      </AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<MarketingLayout />}>
              <Route path="/" element={<MarketingOrApp><Landing /></MarketingOrApp>} />
              <Route path="/about" element={<MarketingOrApp><About /></MarketingOrApp>} />
              <Route path="/features" element={<MarketingOrApp><Features /></MarketingOrApp>} />
              <Route path="/install" element={<MarketingOrApp><Install /></MarketingOrApp>} />
              <Route path="/contact" element={<MarketingOrApp><Contact /></MarketingOrApp>} />
              {/* Not gated by MarketingOrApp — a legal reference page should
                  stay reachable regardless of install state, unlike the
                  marketing pitches above. */}
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
              {/* No ProtectedRoute wrapper — it handles the logged-out case
                  itself (stash + redirect to /login) rather than bouncing
                  there with the shared text silently lost. */}
              <Route path="/share-target" element={<ShareTarget />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/stacks" element={<GroupStacks />} />
              <Route path="/stacks/:stackId" element={<GroupStackDetail />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
