import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

// Every authenticated page gets the shared topbar/nav via AppShell — keeping
// this wrapping here (not inside each page) means the pages themselves only
// ever render their own content. The app is entirely free, so every signed-in
// visitor gets the same access — there's no paid-tier route guard anymore.
function Protected({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

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

// One shared fade+lift on every route change — mirrors the mobile app's
// native-stack `animation: 'fade'` screenOptions (see frontend/App.js) so
// switching pages feels like a real app's screen transition instead of a
// browser just swapping content. `mode="wait"` finishes the exit before the
// next page enters, `initial={false}` skips animating in the very first
// page load (only transitions between navigations, not on cold start).
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <Suspense fallback={<RouteFallback />}>
          <Routes location={location}>
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

            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/stacks" element={<Protected><GroupStacks /></Protected>} />
            <Route path="/stacks/:stackId" element={<Protected><GroupStackDetail /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AnimatedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
