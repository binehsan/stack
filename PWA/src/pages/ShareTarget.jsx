import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { createTask } from '../api/tasks';
import GradientBackground from '../components/GradientBackground';
import Logo from '../components/Logo';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from './ShareTarget.module.css';

// Where a pending shared task waits if you weren't logged in when you shared
// it — Login.jsx checks this after a successful sign-in and creates the
// task then, so sharing into Stack works even from a cold, logged-out start.
export const PENDING_SHARE_KEY = 'stack_pending_share';

// Combines whatever the share_target manifest entry (vite.config.js) handed
// over — different apps fill in title/text/url differently, e.g. sharing a
// webpage gives you a title + url with no text, sharing selected text gives
// you just text. Falls back sensibly either way.
function textFromShareParams(params) {
  const title = (params.get('title') || '').trim();
  const text = (params.get('text') || '').trim();
  const url = (params.get('url') || '').trim();

  const body = text || title;
  if (body && url && !body.includes(url)) return `${body} ${url}`.trim();
  return body || url;
}

// The landing page for Android's Share sheet → Stack — see vite.config.js's
// share_target manifest entry. Creates the task immediately if signed in;
// otherwise stashes it and sends you to log in first.
export default function ShareTarget() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isReady } = useAuth();
  const { t } = useLanguage();
  const [status, setStatus] = useState('working'); // 'working' | 'done' | 'error'
  const ranRef = useRef(false);

  useEffect(() => {
    if (!isReady || ranRef.current) return;
    ranRef.current = true;

    const text = textFromShareParams(searchParams);
    if (!text) {
      navigate('/dashboard', { replace: true });
      return;
    }

    if (!isAuthenticated) {
      sessionStorage.setItem(PENDING_SHARE_KEY, text);
      navigate('/login', { replace: true });
      return;
    }

    createTask(text)
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'));
  }, [isReady, isAuthenticated, searchParams, navigate]);

  useEffect(() => {
    if (status === 'done') {
      const timer = setTimeout(() => navigate('/dashboard', { replace: true }), 900);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  return (
    <GradientBackground>
      <div className={styles.wrap}>
        <Logo size={48} />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Card elevated className={styles.card}>
            {status === 'working' && (
              <>
                <LoadingSpinner />
                <p className="text-body-strong">{t('common.shareTarget.working')}</p>
              </>
            )}
            {status === 'done' && (
              <>
                <CheckCircle2 size={32} color="var(--color-success)" strokeWidth={2} />
                <p className="text-body-strong">{t('common.shareTarget.done')}</p>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle size={32} color="var(--color-danger)" strokeWidth={2} />
                <p className="text-body-strong">{t('common.shareTarget.error')}</p>
                <Link to="/dashboard" className={styles.link}>
                  {t('common.shareTarget.link')}
                </Link>
              </>
            )}
          </Card>
        </motion.div>
      </div>
    </GradientBackground>
  );
}
