import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useAuth } from '../auth/AuthContext';
import GradientBackground from '../components/GradientBackground';
import Logo from '../components/Logo';
import Card from '../components/Card';
import AuthTextField from '../components/AuthTextField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorBanner from '../components/ErrorBanner';
import SyntaxCredit from '../components/SyntaxCredit';
import styles from './Auth.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_]+$/i;

export default function Signup() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isReady } = useAuth();

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
      errors.email = 'Enter a valid email address.';
    }
    if (trimmedUsername && !USERNAME_RE.test(trimmedUsername)) {
      errors.username = 'Only letters, numbers, and underscores.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password needs to be at least 8 characters.';
    }
    if (!confirm) {
      errors.confirm = 'Confirm your password.';
    } else if (password && confirm !== password) {
      errors.confirm = "Passwords don't match.";
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
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong — try again.');
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
            <h1 className={`text-header ${styles.wordmark}`}>Stack</h1>
            <p className={`text-small ${styles.tagline}`}>Start today's stack fresh.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.09 }}
          >
            <Card elevated className={styles.card}>
              <h2 className={`text-title ${styles.title}`}>Create an account</h2>
              <ErrorBanner message={error} />
              <form className={styles.form} onSubmit={handleRegister} noValidate>
                <AuthTextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  error={fieldErrors.email}
                />
                <AuthTextField
                  label="Username (optional)"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Auto-generated if blank"
                  autoComplete="username"
                  error={fieldErrors.username}
                />
                <AuthTextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  error={fieldErrors.password}
                />
                <AuthTextField
                  label="Confirm password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  error={fieldErrors.confirm}
                />
                <PrimaryButton type="submit" title="Sign up" loading={loading} />
              </form>
            </Card>
          </motion.div>

          <div className={styles.switchRow}>
            <Link to="/login" className={styles.pill}>
              <span className={`text-small ${styles.switchText}`}>
                Already have an account? <span className={styles.switchLink}>Log in</span>
              </span>
            </Link>
          </div>

          <SyntaxCredit />
        </div>
      </div>
    </GradientBackground>
  );
}
