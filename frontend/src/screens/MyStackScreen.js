import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { MotiView } from 'moti';

import Avatar from '../components/Avatar';
import StatTile from '../components/StatTile';
import AuthTextField from '../components/AuthTextField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorBanner from '../components/ErrorBanner';
import DeleteAccountModal from '../components/DeleteAccountModal';
import SignUpNudgeModal from '../components/SignUpNudgeModal';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchStats } from '../api/tasks';
import { fetchProfile, updateProfile, uploadAvatar } from '../api/auth';
import { radii, spacing, typography } from '../theme';

const RESET_PRESETS = [
  { hour: 0, label: 'Midnight' },
  { hour: 3, label: '3 AM' },
  { hour: 4, label: '4 AM' },
  { hour: 5, label: '5 AM' },
  { hour: 6, label: '6 AM' },
];

export default function MyStackScreen({ navigation }) {
  const { isAuthenticated } = useAuth();
  // Guest mode never had an account to load a profile/stats/settings for —
  // branching here (before any of the account-only hooks below run) keeps
  // that whole panel untouched rather than threading conditionals through
  // it. Safe against Rules-of-Hooks concerns: App.js swaps this screen's
  // entire navigator stack when isAuthenticated changes, so a mounted
  // instance never sees that value change mid-lifetime.
  if (!isAuthenticated) {
    return <GuestMyStackPanel navigation={navigation} />;
  }
  return <AccountMyStackPanel navigation={navigation} />;
}

function GuestMyStackPanel({ navigation }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const guestStyles = makeGuestStyles(theme);
  const [nudgeReason, setNudgeReason] = useState(null);

  return (
    <LinearGradient
      colors={theme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={8}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>myStack</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={guestStyles.card}
          >
            <Text style={guestStyles.emoji}>👋</Text>
            <Text style={guestStyles.heading}>You're using Stack as a guest</Text>
            <Text style={guestStyles.subheading}>
              Your tasks are only on this device. Sign up free to sync across devices, see your
              stats, and set up group stacks with family or friends.
            </Text>
            <PrimaryButton
              title="Create free account"
              onPress={() => navigation.navigate('Register')}
            />
            <TouchableOpacity
              style={guestStyles.loginRow}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <Text style={guestStyles.loginText}>Already have an account? Log in</Text>
            </TouchableOpacity>
          </MotiView>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.rowButton}
              onPress={() => setNudgeReason('groupStacks')}
              activeOpacity={0.7}
            >
              <Text style={styles.rowButtonText}>🔒 Group Stacks</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rowButton, styles.rowButtonLast]}
              onPress={() => setNudgeReason('stats')}
              activeOpacity={0.7}
            >
              <Text style={styles.rowButtonText}>🔒 Your Stats</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      <SignUpNudgeModal
        visible={Boolean(nudgeReason)}
        reason={nudgeReason}
        onCreateAccount={() => {
          setNudgeReason(null);
          navigation.navigate('Register');
        }}
        onDismiss={() => setNudgeReason(null)}
      />

      <StatusBar style={theme.statusBarStyle} />
    </LinearGradient>
  );
}

function AccountMyStackPanel({ navigation }) {
  const { theme } = useTheme();
  const { email, logout, changePassword, deleteAccount } = useAuth();
  const styles = makeStyles(theme);

  const [profile, setProfile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState(null);
  const [usernameSaving, setUsernameSaving] = useState(false);

  const [resetHourSaving, setResetHourSaving] = useState(false);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchProfile()
      .then((data) => {
        setProfile(data);
        setUsernameInput(data.username);
      })
      .catch((err) => console.warn('Failed to load profile:', err.message));

    fetchStats()
      .then(setStats)
      .catch((err) => console.warn('Failed to load stats:', err.message))
      .finally(() => setStatsLoading(false));
  }, []);

  async function handlePickAvatar() {
    setAvatarError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAvatarError('Allow photo access to set an avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;

    setAvatarUploading(true);
    try {
      const updated = await uploadAvatar(result.assets[0].uri);
      setProfile(updated);
    } catch (err) {
      setAvatarError(err.message || 'Failed to upload avatar.');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSaveUsername() {
    const trimmed = usernameInput.trim().toLowerCase();
    if (!trimmed) {
      setUsernameError('Username cannot be empty.');
      return;
    }
    setUsernameError(null);
    setUsernameSaving(true);
    try {
      const updated = await updateProfile({ username: trimmed });
      setProfile(updated);
      setEditingUsername(false);
    } catch (err) {
      setUsernameError(err.message || 'Failed to update username.');
    } finally {
      setUsernameSaving(false);
    }
  }

  async function handleSelectResetHour(hour) {
    if (!profile || profile.reset_hour === hour || resetHourSaving) return;
    setResetHourSaving(true);
    try {
      const updated = await updateProfile({ reset_hour: hour });
      setProfile(updated);
    } catch (err) {
      console.warn('Failed to update reset time:', err.message);
    } finally {
      setResetHourSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!oldPassword || !newPassword || !newPasswordConfirm) {
      setPasswordError('Fill in every field to continue.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password needs to be at least 8 characters.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordError("New passwords don't match.");
      return;
    }
    setPasswordError(null);
    setPasswordLoading(true);
    try {
      await changePassword(oldPassword, newPassword, newPasswordConfirm);
      setOldPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setShowPasswordForm(false);
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 2500);
    } catch (err) {
      setPasswordError(err.message || 'Something went wrong — try again.');
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={theme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={8}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>myStack</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.avatarSection}
          >
            <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8} style={styles.avatarWrap}>
              <Avatar uri={profile?.avatar} label={profile?.username || email} size={72} />
              <View style={styles.avatarBadge}>
                {avatarUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.avatarBadgeText}>✏️</Text>
                )}
              </View>
            </TouchableOpacity>

            {editingUsername ? (
              <View style={styles.usernameEditRow}>
                <Text style={styles.usernameAt}>@</Text>
                <TextInput
                  style={styles.usernameInput}
                  value={usernameInput}
                  onChangeText={setUsernameInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  onSubmitEditing={handleSaveUsername}
                  returnKeyType="done"
                />
                {usernameSaving ? (
                  <ActivityIndicator size="small" color={theme.accent} />
                ) : (
                  <TouchableOpacity onPress={handleSaveUsername} hitSlop={8}>
                    <Text style={styles.usernameSave}>Save</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setUsernameInput(profile?.username || '');
                  setUsernameError(null);
                  setEditingUsername(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.username}>@{profile?.username || '…'}</Text>
              </TouchableOpacity>
            )}
            {(usernameError || avatarError) && (
              <Text style={styles.inlineError}>{usernameError || avatarError}</Text>
            )}
            <Text style={styles.email}>{email}</Text>
          </MotiView>

          {statsLoading ? (
            <ActivityIndicator color={theme.accent} style={styles.statsLoading} />
          ) : stats ? (
            <View style={styles.statsGrid}>
              <StatTile
                emoji="🔥"
                value={stats.current_streak}
                label="Hot Streak"
                sublabel={stats.current_streak === 1 ? 'day' : 'days'}
              />
              <StatTile
                emoji="🏆"
                value={stats.longest_streak}
                label="Record Streak"
                sublabel={stats.longest_streak === 1 ? 'day' : 'days'}
                delay={40}
              />
              <StatTile emoji="✅" value={stats.total_completed} label="Tasks Crushed" delay={80} />
              <StatTile emoji="📅" value={stats.days_active} label="Stack Sessions" delay={120} />
              {stats.best_day && (
                <StatTile
                  emoji="⭐"
                  value={stats.best_day.completed}
                  label="Best Day Ever"
                  sublabel={formatDate(stats.best_day.date)}
                  delay={160}
                />
              )}
            </View>
          ) : null}

          <View style={styles.section}>
            <View style={styles.resetTimeHeader}>
              <Text style={styles.rowButtonText}>Daily reset time</Text>
              <Text style={styles.resetTimeSubtext}>When today's stack rolls into tomorrow's</Text>
            </View>
            <View style={styles.resetChipsRow}>
              {RESET_PRESETS.map((preset) => {
                const active = profile?.reset_hour === preset.hour;
                return (
                  <TouchableOpacity
                    key={preset.hour}
                    style={[styles.resetChip, active && styles.resetChipActive]}
                    onPress={() => handleSelectResetHour(preset.hour)}
                    disabled={resetHourSaving}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.resetChipText, active && styles.resetChipTextActive]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.rowButton, styles.rowButtonLast]}
              onPress={() => navigation.navigate('GroupStacks')}
              activeOpacity={0.7}
            >
              <Text style={styles.rowButtonText}>Group Stacks</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.rowButton}
              onPress={() => setShowPasswordForm((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.rowButtonText}>Change password</Text>
              <Text style={styles.chevron}>{showPasswordForm ? '▾' : '›'}</Text>
            </TouchableOpacity>

            {showPasswordForm && (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'timing', duration: 200 }}
                style={styles.passwordForm}
              >
                <ErrorBanner message={passwordError} />
                <AuthTextField
                  label="Current password"
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  textContentType="password"
                  autoComplete="password"
                  returnKeyType="next"
                />
                <AuthTextField
                  label="New password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 8 characters"
                  secureTextEntry
                  textContentType="newPassword"
                  autoComplete="password-new"
                  returnKeyType="next"
                />
                <AuthTextField
                  label="Confirm new password"
                  value={newPasswordConfirm}
                  onChangeText={setNewPasswordConfirm}
                  placeholder="••••••••"
                  secureTextEntry
                  textContentType="newPassword"
                  autoComplete="password-new"
                  returnKeyType="done"
                  onSubmitEditing={handleChangePassword}
                />
                <PrimaryButton
                  title="Update password"
                  onPress={handleChangePassword}
                  loading={passwordLoading}
                />
              </MotiView>
            )}

            {passwordSuccess && (
              <MotiView
                from={{ opacity: 0, translateY: -6 }}
                animate={{ opacity: 1, translateY: 0 }}
                style={styles.successBanner}
              >
                <Text style={styles.successText}>Password updated ✓</Text>
              </MotiView>
            )}

            <TouchableOpacity style={styles.rowButton} onPress={logout} activeOpacity={0.7}>
              <Text style={styles.rowButtonText}>Log out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rowButton, styles.rowButtonLast]}
              onPress={() => setShowDeleteModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dangerText}>Delete account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      <DeleteAccountModal
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={deleteAccount}
      />

      <StatusBar style={theme.statusBarStyle} />
    </LinearGradient>
  );
}

function makeGuestStyles(theme) {
  return StyleSheet.create({
    card: {
      alignItems: 'center',
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: radii.md,
      padding: spacing.xl,
      gap: spacing.sm,
    },
    emoji: {
      fontSize: 36,
      marginBottom: spacing.xs,
    },
    heading: {
      ...typography.title,
      color: theme.text,
      textAlign: 'center',
    },
    subheading: {
      ...typography.small,
      fontWeight: '400',
      color: theme.textMuted,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    loginRow: {
      paddingVertical: spacing.sm,
    },
    loginText: {
      ...typography.small,
      color: theme.accent,
      fontWeight: '600',
    },
  });
}

function formatDate(isoDate) {
  const parsed = new Date(`${isoDate}T00:00:00`);
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function makeStyles(theme) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backText: {
      fontSize: 24,
      color: theme.text,
      fontWeight: '600',
    },
    title: {
      ...typography.title,
      color: theme.text,
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    avatarSection: {
      alignItems: 'center',
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: radii.md,
      padding: spacing.lg,
    },
    avatarWrap: {
      marginBottom: spacing.sm,
    },
    avatarBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.card,
    },
    avatarBadgeText: {
      fontSize: 11,
    },
    username: {
      ...typography.bodyStrong,
      color: theme.text,
    },
    usernameEditRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    usernameAt: {
      ...typography.bodyStrong,
      color: theme.textMuted,
    },
    usernameInput: {
      ...typography.bodyStrong,
      color: theme.text,
      borderBottomWidth: 1,
      borderBottomColor: theme.accent,
      minWidth: 100,
      paddingVertical: 2,
    },
    usernameSave: {
      ...typography.small,
      color: theme.accent,
      fontWeight: '700',
      marginLeft: spacing.xs,
    },
    inlineError: {
      ...typography.tiny,
      color: theme.danger,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    email: {
      ...typography.small,
      fontWeight: '400',
      color: theme.textMuted,
      marginTop: spacing.xs,
    },
    statsLoading: {
      marginVertical: spacing.lg,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    section: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: radii.md,
      overflow: 'hidden',
    },
    resetTimeHeader: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
    resetTimeSubtext: {
      ...typography.tiny,
      color: theme.textMuted,
      marginTop: 2,
    },
    resetChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      padding: spacing.md,
    },
    resetChip: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.pill,
      backgroundColor: theme.accentSoft,
    },
    resetChipActive: {
      backgroundColor: theme.accent,
    },
    resetChipText: {
      ...typography.tiny,
      color: theme.accent,
    },
    resetChipTextActive: {
      color: '#fff',
    },
    rowButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    rowButtonLast: {
      borderBottomWidth: 0,
    },
    rowButtonText: {
      ...typography.body,
      color: theme.text,
    },
    chevron: {
      fontSize: 16,
      color: theme.textMuted,
    },
    dangerText: {
      ...typography.body,
      color: theme.danger,
      fontWeight: '600',
    },
    passwordForm: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    successBanner: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: theme.success + '1A',
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    successText: {
      ...typography.small,
      color: theme.success,
      fontWeight: '600',
    },
  });
}
