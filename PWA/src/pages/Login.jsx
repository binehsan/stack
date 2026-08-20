import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { t } = useLanguage();

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
      setError(t('auth.login.errorMissingFields'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      await flushPendingShare();
      // A hard navigation, not `navigate('/dashboard')`. Android Chrome's
      // save-password prompt (which fires right around here) draws as an OS
      // Autofill overlay on top of the installed PWA's Activity, and that
      // interaction can leave Chrome's toolbar stuck visible for the rest of
      // the session — its auto-hide logic only re-arms on a scroll gesture,
      // not on whatever internal signal dismisses the Autofill UI. A client-
      // side route change (React Router's pushState) never touches the
      // Activity's chrome at all, so it can't clear a stuck toolbar; a real
      // document load re-initializes standalone display mode from scratch
      // and does. Precached by the service worker, so this is still fast.
      window.location.assign('/dashboard');
    } catch (err) {
      setError(err.message || t('auth.login.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <GradientBackground>
      <div className={styles.wrap}>
        <div className={styles.inner}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42 }}
            className={styles.brandMark}
          >
            <Logo size={64} />
            <h1 className={`text-header ${styles.wordmark}`}>{t('auth.login.wordmark')}</h1>
            <p className={`text-small ${styles.tagline}`}>{t('auth.login.tagline')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.09 }}
          >
            <Card elevated className={styles.card}>
              <h2 className={`text-title ${styles.title}`}>{t('auth.login.title')}</h2>
              <ErrorBanner message={error} />
              <form className={styles.form} onSubmit={handleLogin} noValidate>
                <AuthTextField
                  label={t('auth.login.emailLabel')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.login.emailPlaceholder')}
                  autoComplete="email"
                />
                <AuthTextField
                  label={t('auth.login.passwordLabel')}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  autoComplete="current-password"
                />
                <PrimaryButton type="submit" title={t('auth.login.submit')} loading={loading} />
              </form>
              <div className={styles.switchRow}>
                <Link to="/forgot-password" className={styles.pill}>
                  <span className={`text-small ${styles.switchText}`}>
                    {t('auth.login.forgotPre')} <span className={styles.switchLink}>{t('auth.login.forgotLink')}</span>
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
            <h3 className={`text-title ${styles.pathTitle}`}>{t('auth.login.newHeading')}</h3>
            <p className={`text-small text-muted ${styles.pathBody}`}>{t('auth.login.newBody')}</p>
            <div className={styles.pathButton}>
              <PrimaryButton as={Link} to="/signup" title={t('auth.login.signupButton')} />
            </div>
            <Link to="/install" className={styles.installLink}>
              {t('auth.login.installLink')}
            </Link>
          </Card>
        </motion.div>

        <SyntaxCredit />
      </div>
    </GradientBackground>
  );
}
