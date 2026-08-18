import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

import { useAuth } from '../auth/AuthContext';
import { createTask } from '../api/tasks';
import GradientBackground from '../components/GradientBackground';
import Logo from '../components/Logo';
import Card from '../components/Card';
import AuthTextField from '../components/AuthTextField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorBanner from '../components/ErrorBanner';
import SyntaxCredit from '../components/SyntaxCredit';
import { PENDING_SHARE_KEY } from './ShareTarget';
import styles from './Auth.module.css';

// If you shared text into Stack from the OS Share sheet while logged out
// (see ShareTarget.jsx), it's waiting here — create it now that there's a
// session, rather than silently dropping it. Never blocks navigation: a
// failure here shouldn't stop a normal login.
async function flushPendingShare() {
  const text = sessionStorage.getItem(PENDING_SHARE_KEY);
  if (!text) return;
  sessionStorage.removeItem(PENDING_SHARE_KEY);
  try {
    await createTask(text);
  } catch (err) {
    console.warn('Failed to add pending shared task:', err.message);
  }
}

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isReady } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isReady && isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isReady, isAuthenticated, navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      await flushPendingShare();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong, try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <GradientBackground>
      <div className={styles.wrap}>
        <Link to="/" className={styles.backButton} aria-label="Back to home">
          <ChevronLeft size={18} strokeWidth={2.5} />
          <span>Back</span>
        </Link>

        <div className={styles.inner}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42 }}
            className={styles.brandMark}
          >
            <Logo size={64} />
            <h1 className={`text-header ${styles.wordmark}`}>Stack</h1>
            <p className={`text-small ${styles.tagline}`}>Your day, dumped and done.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.09 }}
          >
            <Card elevated className={styles.card}>
              <h2 className={`text-title ${styles.title}`}>Welcome back</h2>
              <ErrorBanner message={error} />
              <form className={styles.form} onSubmit={handleLogin} noValidate>
                <AuthTextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <AuthTextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <PrimaryButton type="submit" title="Log in" loading={loading} />
              </form>
              <div className={styles.switchRow}>
                <Link to="/forgot-password" className={styles.pill}>
                  <span className={`text-small ${styles.switchText}`}>
                    Forgot your <span className={styles.switchLink}>password?</span>
                  </span>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.16 }}
          className={styles.noAccountSection}
        >
          <Card className={styles.singlePathCard}>
            <h3 className={`text-title ${styles.pathTitle}`}>New to Stack?</h3>
            <p className={`text-small text-muted ${styles.pathBody}`}>
              One free account, works everywhere — install it on your phone in seconds, or just
              use it in any browser.
            </p>
            <div className={styles.pathButton}>
              <PrimaryButton as={Link} to="/signup" title="Sign up free" />
            </div>
            <Link to="/install" className={styles.installLink}>
              How do I install it?
            </Link>
          </Card>
        </motion.div>

        <SyntaxCredit />
      </div>
    </GradientBackground>
  );
}
