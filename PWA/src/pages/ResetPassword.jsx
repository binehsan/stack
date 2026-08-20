import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useLanguage } from '../context/LanguageContext';
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
  const { t } = useLanguage();
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
      setError(t('auth.resetPassword.errorFillBoth'));
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError(t('auth.resetPassword.errorMismatch'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await confirmPasswordReset(uid, token, newPassword, newPasswordConfirm);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || t('auth.resetPassword.errorInvalidLink'));
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
            <h1 className={`text-header ${styles.wordmark}`}>{t('auth.resetPassword.wordmark')}</h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.09 }}
          >
            <Card elevated className={styles.card}>
              {linkInvalid ? (
                <>
                  <h2 className={`text-title ${styles.title}`}>{t('auth.resetPassword.invalidTitle')}</h2>
                  <p className={`text-small text-muted ${styles.subtitle}`}>
                    {t('auth.resetPassword.invalidBody')}
                  </p>
                  <PrimaryButton as={Link} to="/forgot-password" title={t('auth.resetPassword.requestNewLink')} />
                </>
              ) : (
                <>
                  <h2 className={`text-title ${styles.title}`}>{t('auth.resetPassword.title')}</h2>
                  <ErrorBanner message={error} />
                  <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    <AuthTextField
                      label={t('auth.resetPassword.newPasswordLabel')}
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('auth.resetPassword.passwordPlaceholder')}
                      autoComplete="new-password"
                    />
                    <AuthTextField
                      label={t('auth.resetPassword.confirmLabel')}
                      type="password"
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      placeholder={t('auth.resetPassword.passwordPlaceholder')}
                      autoComplete="new-password"
                    />
                    <PrimaryButton type="submit" title={t('auth.resetPassword.submit')} loading={loading} />
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
