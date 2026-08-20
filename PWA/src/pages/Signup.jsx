import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';

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

// See Login.jsx's copy of this — a first-time visitor may well discover
// Stack by sharing text into it before they have an account at all.
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_]+$/i;

export default function Signup() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isReady } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isReady && isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isReady, isAuthenticated, navigate]);

  async function handleRegister(e) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    const errors = {};

    if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
      errors.email = t('auth.signup.errorEmail');
    }
    if (trimmedUsername && !USERNAME_RE.test(trimmedUsername)) {
      errors.username = t('auth.signup.errorUsername');
    }
    if (!password) {
      errors.password = t('auth.signup.errorPasswordRequired');
    } else if (password.length < 8) {
      errors.password = t('auth.signup.errorPasswordLength');
    }
    if (!confirm) {
      errors.confirm = t('auth.signup.errorConfirmRequired');
    } else if (password && confirm !== password) {
      errors.confirm = t('auth.signup.errorPasswordMismatch');
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError(null);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await register(trimmedEmail, password, confirm, trimmedUsername);
      await flushPendingShare();
      // Hard navigation, not `navigate('/welcome')` — see the matching
      // comment in Login.jsx's handleLogin. Same save-password-prompt
      // moment, same fix: a real document load is what resets Chrome's
      // toolbar back to hidden after the OS Autofill overlay leaves it
      // stuck, since a client-side route change never touches the
      // Activity's chrome at all.
      window.location.assign('/welcome');
    } catch (err) {
      setError(err.message || t('auth.signup.errorGeneric'));
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
            <Logo size={56} />
            <h1 className={`text-header ${styles.wordmark}`}>{t('auth.signup.wordmark')}</h1>
            <p className={`text-small ${styles.tagline}`}>{t('auth.signup.tagline')}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.09 }}
          >
            <Card elevated className={styles.card}>
              <h2 className={`text-title ${styles.title}`}>{t('auth.signup.title')}</h2>
              <p className={`text-small text-muted ${styles.subtitle}`}>
                <Download
                  size={14}
                  strokeWidth={2.25}
                  style={{ verticalAlign: '-2px', marginInlineEnd: 6 }}
                />
                {t('auth.signup.subtitlePre')} (<Link to="/install" className={styles.inlineLink}>{t('auth.signup.subtitleLink')}</Link>{t('auth.signup.subtitlePost')}
              </p>
              <ErrorBanner message={error} />
              <form className={styles.form} onSubmit={handleRegister} noValidate>
                <AuthTextField
                  label={t('auth.signup.emailLabel')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.signup.emailPlaceholder')}
                  autoComplete="email"
                  error={fieldErrors.email}
                />
                <AuthTextField
                  label={t('auth.signup.usernameLabel')}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('auth.signup.usernamePlaceholder')}
                  autoComplete="username"
                  error={fieldErrors.username}
                />
                <AuthTextField
                  label={t('auth.signup.passwordLabel')}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.signup.passwordPlaceholder')}
                  autoComplete="new-password"
                  error={fieldErrors.password}
                />
                <AuthTextField
                  label={t('auth.signup.confirmLabel')}
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={t('auth.signup.confirmPlaceholder')}
                  autoComplete="new-password"
                  error={fieldErrors.confirm}
                />
                <PrimaryButton type="submit" title={t('auth.signup.submit')} loading={loading} />
                <p className={`text-tiny text-muted ${styles.legalNote}`}>
                  {t('auth.signup.legalPre')} <Link to="/privacy" className={styles.inlineLink}>{t('auth.signup.legalLink')}</Link>{t('auth.signup.legalPost')}
                </p>
              </form>
            </Card>
          </motion.div>

          <div className={styles.switchRow}>
            <Link to="/login" className={styles.pill}>
              <span className={`text-small ${styles.switchText}`}>
                {t('auth.signup.switchPre')} <span className={styles.switchLink}>{t('auth.signup.switchLink')}</span>
              </span>
            </Link>
          </div>

          <SyntaxCredit />
        </div>
      </div>
    </GradientBackground>
  );
}
