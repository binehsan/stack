import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Bell, BellOff, Calendar, CheckCircle2, Moon, Star, Sun, SunMoon, Zap } from 'lucide-react';

import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchProfile, updateProfile } from '../api/auth';
import { fetchStats } from '../api/tasks';
import { usePushSubscription } from '../push/usePushSubscription';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import AuthTextField from '../components/AuthTextField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorBanner from '../components/ErrorBanner';
import AvatarUpload from '../components/settings/AvatarUpload';
import ThemeFamilyPicker from '../components/settings/ThemeFamilyPicker';
import LanguagePicker from '../components/settings/LanguagePicker';
import DangerZone from '../components/settings/DangerZone';
import StatTile from '../components/StatTile';
import SyntaxCredit from '../components/SyntaxCredit';
import styles from './Settings.module.css';

function formatDate(isoDateOnly) {
  if (!isoDateOnly) return '';
  const parsed = new Date(`${isoDateOnly}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Settings() {
  const { email, changePassword, deleteAccount } = useAuth();
  const { themeName, themePreference, isSystemTheme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const MODE_LABEL = {
    system: t('settings.appearance.modeSystem'),
    dawn: t('settings.appearance.modeLight'),
    dusk: t('settings.appearance.modeDark'),
  };

  // Profile (avatar + username)
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  const [usernameInput, setUsernameInput] = useState('');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setUsernameInput(data.username || '');
      })
      .catch((err) => {
        if (!cancelled) setProfileError(err.message || t('settings.profile.errors.failedLoad'));
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshProfile() {
    const data = await fetchProfile();
    setProfile(data);
    setUsernameInput(data.username || '');
  }

  async function handleSaveUsername(event) {
    event.preventDefault();
    const trimmed = usernameInput.trim();
    if (!trimmed) {
      setUsernameError(t('settings.profile.errors.usernameEmpty'));
      return;
    }
    setUsernameError(null);
    setUsernameSuccess(false);
    setUsernameSaving(true);
    try {
      const updated = await updateProfile({ username: trimmed });
      setProfile(updated);
      setUsernameSuccess(true);
    } catch (err) {
      setUsernameError(err.message || t('settings.profile.errors.failedUpdate'));
    } finally {
      setUsernameSaving(false);
    }
  }

  // Change password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  async function handleChangePassword(event) {
    event.preventDefault();
    if (!oldPassword || !newPassword || !newPasswordConfirm) {
      setPasswordError(t('settings.account.errors.fillAll'));
      setPasswordSuccess(false);
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordError(t('settings.account.errors.mismatch'));
      setPasswordSuccess(false);
      return;
    }
    setPasswordError(null);
    setPasswordSuccess(false);
    setPasswordSaving(true);
    try {
      await changePassword(oldPassword, newPassword, newPasswordConfirm);
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err) {
      setPasswordError(err.message || t('settings.account.errors.failedChange'));
    } finally {
      setPasswordSaving(false);
    }
  }

  function handleAccountDeleted() {
    navigate('/');
  }

  // Stats / streaks
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    function loadStats({ showSpinner } = {}) {
      if (showSpinner) setStatsLoading(true);
      fetchStats()
        .then((data) => {
          if (!cancelled) setStats(data);
        })
        .catch((err) => console.warn('Failed to load stats:', err.message))
        .finally(() => {
          if (!cancelled) setStatsLoading(false);
        });
    }

    loadStats({ showSpinner: true });

    // Same reasoning as Dashboard's visibilitychange listener: unlike a
    // route change (which fully remounts this page and refetches), this
    // effect otherwise only ever runs once. A completed task on another
    // device, or this PWA simply resuming after being backgrounded/
    // suspended, doesn't trigger a remount — without this, the numbers here
    // silently go stale until the user happens to navigate away and back.
    function handleVisibility() {
      if (document.visibilityState === 'visible') loadStats();
    }
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Share-stats-with-groups toggle — a profile field (like username), not
  // its own endpoint, so it PATCHes through the same updateProfile call as
  // everything else on this page.
  const [sharingSaving, setSharingSaving] = useState(false);
  const [sharingError, setSharingError] = useState(null);

  async function handleToggleSharing() {
    if (!profile) return;
    setSharingError(null);
    setSharingSaving(true);
    try {
      const updated = await updateProfile({ share_stats_with_groups: !profile.share_stats_with_groups });
      setProfile(updated);
    } catch (err) {
      setSharingError(err.message || t('settings.stats.sharingError'));
    } finally {
      setSharingSaving(false);
    }
  }

  // Push notifications
  const { supported, permission, subscribed, loading: pushLoading, error: pushError, subscribe, unsubscribe } =
    usePushSubscription();

  const ModeIcon = isSystemTheme ? SunMoon : themeName === 'dawn' ? Sun : Moon;

  return (
    <div className={styles.page}>
      <h1 className="text-header">{t('settings.page.title')}</h1>

      <Card className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-title">{t('settings.profile.heading')}</h2>
          <p className="text-small text-muted">{t('settings.profile.description')}</p>
        </div>

        <ErrorBanner message={profileError} />

        {profileLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <AvatarUpload profile={profile} email={email} onUploaded={refreshProfile} />

            <form onSubmit={handleSaveUsername} className={styles.usernameForm}>
              <AuthTextField
                label={t('settings.profile.usernameLabel')}
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setUsernameSuccess(false);
                }}
                error={usernameError}
                placeholder={t('settings.profile.usernamePlaceholder')}
                autoComplete="username"
              />
              {usernameSuccess && <p className={styles.success}>{t('settings.profile.usernameUpdated')}</p>}
              <PrimaryButton type="submit" title={t('settings.profile.saveUsername')} loading={usernameSaving} />
            </form>

            <div className={styles.readonlyRow}>
              <span className="text-small text-muted">{t('settings.profile.emailLabel')}</span>
              <span className="text-body latin">{email}</span>
            </div>
          </>
        )}
      </Card>

      <Card className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-title">{t('settings.stats.heading')}</h2>
          <p className="text-small text-muted">{t('settings.stats.description')}</p>
        </div>

        {statsLoading ? (
          <LoadingSpinner />
        ) : stats ? (
          <div className={styles.statsGrid}>
            <StatTile
              Icon={Zap}
              value={stats.current_streak}
              label={t('settings.stats.hotStreak')}
              sublabel={stats.current_streak === 1 ? t('settings.stats.day') : t('settings.stats.days')}
            />
            <StatTile
              Icon={Award}
              value={stats.longest_streak}
              label={t('settings.stats.recordStreak')}
              sublabel={stats.longest_streak === 1 ? t('settings.stats.day') : t('settings.stats.days')}
              delay={0.04}
            />
            <StatTile Icon={CheckCircle2} value={stats.total_completed} label={t('settings.stats.tasksCrushed')} delay={0.08} />
            <StatTile Icon={Calendar} value={stats.days_active} label={t('settings.stats.stackSessions')} delay={0.12} />
            {stats.best_day && (
              <StatTile
                Icon={Star}
                value={stats.best_day.completed}
                label={t('settings.stats.bestDayEver')}
                sublabel={formatDate(stats.best_day.date)}
                delay={0.16}
              />
            )}
          </div>
        ) : null}

        {!profileLoading && profile && (
          <div className={styles.modeRow}>
            <div className={styles.modeInfo}>
              <span className="text-small text-muted">{t('settings.stats.sharingLabel')}</span>
              <span className="text-body-strong">
                {profile.share_stats_with_groups ? t('settings.stats.sharingOn') : t('settings.stats.sharingOff')}
              </span>
              <span className="text-tiny text-muted">{t('settings.stats.sharingDescription')}</span>
            </div>
            <PrimaryButton
              variant="ghost"
              title={
                profile.share_stats_with_groups
                  ? t('settings.stats.sharingTurnOff')
                  : t('settings.stats.sharingTurnOn')
              }
              onClick={handleToggleSharing}
              loading={sharingSaving}
            />
          </div>
        )}
        <ErrorBanner message={sharingError} />
      </Card>

      <Card className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-title">{t('settings.notifications.heading')}</h2>
          <p className="text-small text-muted">{t('settings.notifications.description')}</p>
        </div>

        {!supported ? (
          <p className="text-small text-muted">{t('settings.notifications.unsupported')}</p>
        ) : (
          <>
            <ErrorBanner message={pushError} />
            {permission === 'denied' ? (
              <p className="text-small text-muted">{t('settings.notifications.blocked')}</p>
            ) : (
              <div className={styles.modeRow}>
                <div className={styles.modeInfo}>
                  <span className="text-small text-muted">{t('settings.notifications.pushNotifications')}</span>
                  <span className="text-body-strong">
                    {subscribed ? t('settings.notifications.on') : t('settings.notifications.off')}
                  </span>
                </div>
                <PrimaryButton
                  variant="ghost"
                  title={
                    <span className={styles.modeButtonLabel}>
                      {subscribed ? <BellOff size={16} /> : <Bell size={16} />}
                      {subscribed ? t('settings.notifications.turnOff') : t('settings.notifications.turnOn')}
                    </span>
                  }
                  onClick={subscribed ? unsubscribe : subscribe}
                  loading={pushLoading}
                />
              </div>
            )}
          </>
        )}
      </Card>

      <Card className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-title">{t('settings.appearance.heading')}</h2>
          <p className="text-small text-muted">{t('settings.appearance.description')}</p>
        </div>

        <ThemeFamilyPicker />

        <div className={styles.modeRow}>
          <div className={styles.modeInfo}>
            <span className="text-small text-muted">{t('settings.appearance.mode')}</span>
            <span className="text-body-strong">{MODE_LABEL[themePreference] || MODE_LABEL.system}</span>
          </div>
          <PrimaryButton
            variant="ghost"
            title={
              <span className={styles.modeButtonLabel}>
                <ModeIcon size={16} />
                {t('settings.appearance.changeMode')}
              </span>
            }
            onClick={toggleTheme}
          />
        </div>
      </Card>

      <Card className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-title">{t('settings.language.heading')}</h2>
          <p className="text-small text-muted">{t('settings.language.description')}</p>
        </div>

        <LanguagePicker />
      </Card>

      <Card className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-title">{t('settings.account.heading')}</h2>
          <p className="text-small text-muted">{t('settings.account.description')}</p>
        </div>

        <form onSubmit={handleChangePassword} className={styles.passwordForm}>
          <AuthTextField
            label={t('settings.account.currentPassword')}
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            autoComplete="current-password"
          />
          <AuthTextField
            label={t('settings.account.newPassword')}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <AuthTextField
            label={t('settings.account.confirmNewPassword')}
            type="password"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            autoComplete="new-password"
          />
          <ErrorBanner message={passwordError} />
          {passwordSuccess && <p className={styles.success}>{t('settings.account.passwordChanged')}</p>}
          <PrimaryButton type="submit" title={t('settings.account.changePassword')} loading={passwordSaving} />
        </form>

        <DangerZone deleteAccount={deleteAccount} onDeleted={handleAccountDeleted} />
      </Card>

      <SyntaxCredit detail={t('settings.credit')} />
    </div>
  );
}
