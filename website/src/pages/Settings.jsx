import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, SunMoon } from 'lucide-react';

import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchProfile, updateProfile } from '../api/auth';
import Card from '../components/Card';
import AuthTextField from '../components/AuthTextField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorBanner from '../components/ErrorBanner';
import AvatarUpload from '../components/settings/AvatarUpload';
import ThemeFamilyPicker from '../components/settings/ThemeFamilyPicker';
import DangerZone from '../components/settings/DangerZone';
import SyntaxCredit from '../components/SyntaxCredit';
import styles from './Settings.module.css';

const MODE_LABEL = {
  system: 'Matches your device',
  dawn: 'Light',
  dusk: 'Dark',
};

export default function Settings() {
  const { email, changePassword, deleteAccount } = useAuth();
  const { themeName, themePreference, isSystemTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();

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
        if (!cancelled) setProfileError(err.message || 'Failed to load profile.');
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
      setUsernameError('Username cannot be empty.');
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
      setUsernameError(err.message || 'Failed to update username.');
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
      setPasswordError('Fill in all password fields.');
      setPasswordSuccess(false);
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordError("New passwords don't match.");
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
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  }

  function handleAccountDeleted() {
    navigate('/');
  }

  const ModeIcon = isSystemTheme ? SunMoon : themeName === 'dawn' ? Sun : Moon;

  return (
    <div className={styles.page}>
      <h1 className="text-header">Settings</h1>

      <Card className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-title">Profile</h2>
          <p className="text-small text-muted">Your avatar, username, and account email.</p>
        </div>

        <ErrorBanner message={profileError} />

        {profileLoading ? (
          <p className="text-small text-muted">Loading profile…</p>
        ) : (
          <>
            <AvatarUpload profile={profile} email={email} onUploaded={refreshProfile} />

            <form onSubmit={handleSaveUsername} className={styles.usernameForm}>
              <AuthTextField
                label="Username"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setUsernameSuccess(false);
                }}
                error={usernameError}
                placeholder="username"
                autoComplete="username"
              />
              {usernameSuccess && <p className={styles.success}>Username updated.</p>}
              <PrimaryButton type="submit" title="Save username" loading={usernameSaving} />
            </form>

            <div className={styles.readonlyRow}>
              <span className="text-small text-muted">Email</span>
              <span className="text-body">{email}</span>
            </div>
          </>
        )}
      </Card>

      <Card className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-title">Appearance</h2>
          <p className="text-small text-muted">Pick a color family and light/dark mode.</p>
        </div>

        <ThemeFamilyPicker />

        <div className={styles.modeRow}>
          <div className={styles.modeInfo}>
            <span className="text-small text-muted">Mode</span>
            <span className="text-body-strong">{MODE_LABEL[themePreference] || 'System'}</span>
          </div>
          <PrimaryButton
            variant="ghost"
            title={
              <span className={styles.modeButtonLabel}>
                <ModeIcon size={16} />
                Change mode
              </span>
            }
            onClick={toggleTheme}
          />
        </div>
      </Card>

      <Card className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-title">Account</h2>
          <p className="text-small text-muted">Change your password, or delete your account.</p>
        </div>

        <form onSubmit={handleChangePassword} className={styles.passwordForm}>
          <AuthTextField
            label="Current password"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            autoComplete="current-password"
          />
          <AuthTextField
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <AuthTextField
            label="Confirm new password"
            type="password"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            autoComplete="new-password"
          />
          <ErrorBanner message={passwordError} />
          {passwordSuccess && <p className={styles.success}>Password changed.</p>}
          <PrimaryButton type="submit" title="Change password" loading={passwordSaving} />
        </form>

        <DangerZone deleteAccount={deleteAccount} onDeleted={handleAccountDeleted} />
      </Card>

      <SyntaxCredit detail="App by Muhammad Amen Ehsan" />
    </div>
  );
}
