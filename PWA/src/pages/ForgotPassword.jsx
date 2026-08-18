import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

import { requestPasswordReset } from '../api/auth';
import GradientBackground from '../components/GradientBackground';
import Logo from '../components/Logo';
import Card from '../components/Card';
import AuthTextField from '../components/AuthTextField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorBanner from '../components/ErrorBanner';
import SyntaxCredit from '../components/SyntaxCredit';
import styles from './Auth.module.css';

// Deliberately shows the same "check your email" success state whether or
// not the address has an account — the backend already returns identical
// responses either way (see PasswordResetRequestView) specifically so this
// page can't be used to test which emails are registered.
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Enter your email.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong, try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <GradientBackground>
      <div className={styles.wrap}>
        <Link to="/login" className={styles.backButton} aria-label="Back to log in">
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.09 }}
          >
            <Card elevated className={styles.card}>
              {sent ? (
                <>
                  <h2 className={`text-title ${styles.title}`}>Check your email</h2>
                  <p className={`text-small text-muted ${styles.subtitle}`}>
                    If an account exists for {email.trim()}, a reset link is on its way. It works
                    for the next 3 days.
                  </p>
                  <PrimaryButton as={Link} to="/login" title="Back to log in" variant="ghost" />
                </>
              ) : (
                <>
                  <h2 className={`text-title ${styles.title}`}>Forgot your password?</h2>
                  <p className={`text-small text-muted ${styles.subtitle}`}>
                    Enter your email and we&rsquo;ll send you a link to reset it.
                  </p>
                  <ErrorBanner message={error} />
                  <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    <AuthTextField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    <PrimaryButton type="submit" title="Send reset link" loading={loading} />
                  </form>
                </>
              )}
            </Card>
          </motion.div>
        </div>

        <SyntaxCredit />
      </div>
    </GradientBackground>
  );
}
