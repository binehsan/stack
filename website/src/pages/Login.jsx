import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Monitor, Smartphone } from 'lucide-react';

import { useAuth } from '../auth/AuthContext';
import GradientBackground from '../components/GradientBackground';
import Logo from '../components/Logo';
import Card from '../components/Card';
import AuthTextField from '../components/AuthTextField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorBanner from '../components/ErrorBanner';
import GetTheAppCard from '../components/GetTheAppCard';
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
          <p className={`text-small ${styles.noAccountHeading}`}>Don't have an account yet?</p>

          <div className={styles.pathRow}>
            <Card className={styles.pathCard}>
              <div className={styles.pathIconBadge}>
                <Monitor size={20} strokeWidth={2.25} />
              </div>
              <h3 className={`text-title ${styles.pathTitle}`}>Use Stack on the web</h3>
              <p className={`text-small text-muted ${styles.pathBody}`}>
                The full Stack experience in any browser. Completely free.
              </p>
              <div className={styles.pathButton}>
                <PrimaryButton as={Link} to="/signup" title="Sign up free" />
              </div>
            </Card>

            <Card className={styles.pathCard}>
              <div className={styles.pathIconBadge}>
                <Smartphone size={20} strokeWidth={2.25} />
              </div>
              <h3 className={`text-title ${styles.pathTitle}`}>Get the app</h3>
              <p className={`text-small text-muted ${styles.pathBody}`}>
                Stack for iOS and Android is completely free, no subscription needed.
              </p>
              <GetTheAppCard />
            </Card>
          </div>
        </motion.div>

        <SyntaxCredit />
      </div>
    </GradientBackground>
  );
}
