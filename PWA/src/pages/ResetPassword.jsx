import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

import { confirmPasswordReset } from '../api/auth';
import GradientBackground from '../components/GradientBackground';
import Logo from '../components/Logo';
import Card from '../components/Card';
import AuthTextField from '../components/AuthTextField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorBanner from '../components/ErrorBanner';
import SyntaxCredit from '../components/SyntaxCredit';
import styles from './Auth.module.css';

// Lands here from the link in the password-reset email (see
// PasswordResetRequestView), which encodes uid+token as query params —
// there's no logged-in session at this point, so this reads them straight
// off the URL rather than from any auth context.
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const linkInvalid = !uid || !token;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newPassword || !newPasswordConfirm) {
      setError('Fill in both password fields.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await confirmPasswordReset(uid, token, newPassword, newPasswordConfirm);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'This reset link is invalid or has expired.');
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
              {linkInvalid ? (
                <>
                  <h2 className={`text-title ${styles.title}`}>Invalid reset link</h2>
                  <p className={`text-small text-muted ${styles.subtitle}`}>
                    This link is missing or malformed. Request a new one instead.
                  </p>
                  <PrimaryButton as={Link} to="/forgot-password" title="Request a new link" />
                </>
              ) : (
                <>
                  <h2 className={`text-title ${styles.title}`}>Set a new password</h2>
                  <ErrorBanner message={error} />
                  <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    <AuthTextField
                      label="New password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <AuthTextField
                      label="Confirm new password"
                      type="password"
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <PrimaryButton type="submit" title="Reset password" loading={loading} />
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
