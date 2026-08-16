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
            </Card>
          </motion.div>

          <div className={styles.switchRow}>
            <Link to="/signup" className={styles.pill}>
              <span className={`text-small ${styles.switchText}`}>
                Don't have an account? <span className={styles.switchLink}>Sign up</span>
              </span>
            </Link>
          </div>

          <SyntaxCredit />
        </div>
      </div>
    </GradientBackground>
  );
}
