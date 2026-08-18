import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';

import Landing from './pages/Landing';
import About from './pages/About';
import Features from './pages/Features';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import GroupStacks from './pages/GroupStacks';
import GroupStackDetail from './pages/GroupStackDetail';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

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

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />

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
