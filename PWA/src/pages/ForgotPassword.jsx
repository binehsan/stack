import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useLanguage } from '../context/LanguageContext';
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
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError(t('auth.forgotPassword.errorEmailRequired'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message || t('auth.forgotPassword.errorGeneric'));
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
            <h1 className={`text-header ${styles.wordmark}`}>{t('auth.forgotPassword.wordmark')}</h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.09 }}
          >
            <Card elevated className={styles.card}>
              {sent ? (
                <>
                  <h2 className={`text-title ${styles.title}`}>{t('auth.forgotPassword.checkEmailTitle')}</h2>
                  <p className={`text-small text-muted ${styles.subtitle}`}>
                    {t('auth.forgotPassword.checkEmailBody', { email: email.trim() })}
                  </p>
                  <PrimaryButton as={Link} to="/login" title={t('auth.forgotPassword.backToLogin')} variant="ghost" />
                </>
              ) : (
                <>
                  <h2 className={`text-title ${styles.title}`}>{t('auth.forgotPassword.title')}</h2>
                  <p className={`text-small text-muted ${styles.subtitle}`}>
                    {t('auth.forgotPassword.subtitle')}
                  </p>
                  <ErrorBanner message={error} />
                  <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    <AuthTextField
                      label={t('auth.forgotPassword.emailLabel')}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.forgotPassword.emailPlaceholder')}
                      autoComplete="email"
                    />
                    <PrimaryButton type="submit" title={t('auth.forgotPassword.submit')} loading={loading} />
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
