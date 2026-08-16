import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';

import Landing from './pages/Landing';
import About from './pages/About';
import Features from './pages/Features';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import GroupStacks from './pages/GroupStacks';
import GroupStackDetail from './pages/GroupStackDetail';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Every authenticated page is wrapped the same way: ProtectedRoute bounces
// anonymous visitors to /login, AppShell renders the shared topbar/nav
// around whichever page is active. Keeping that wrapping here (not inside
// each page) means Dashboard/GroupStacks/Settings only ever render their
// own content.
function Protected({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/stacks" element={<Protected><GroupStacks /></Protected>} />
            <Route path="/stacks/:stackId" element={<Protected><GroupStackDetail /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
