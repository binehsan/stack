import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Moon, Sun, SunMoon } from 'lucide-react-native';

import GradientBackground from '../components/GradientBackground';
import Logo from '../components/Logo';
import AuthTextField from '../components/AuthTextField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorBanner from '../components/ErrorBanner';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

export default function RegisterScreen({ navigation }) {
  const { theme, toggleTheme, themeName, isSystemTheme } = useTheme();
  const { register } = useAuth();
  const styles = makeStyles(theme);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleRegister() {
    if (!email.trim() || !password || !confirm) {
      setError('Fill in every field to continue.');
      return;
    }
    if (password.length < 8) {
      setError('Password needs to be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    const trimmedUsername = username.trim();
    if (trimmedUsername && !/^[a-z0-9_]+$/i.test(trimmedUsername)) {
      setError('Usernames can only contain letters, numbers, and underscores.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await register(email.trim(), password, confirm, trimmedUsername);
    } catch (err) {
      setError(err.message || 'Something went wrong — try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <GradientBackground style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          {navigation.canGoBack() ? (
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()} hitSlop={10}>
              <ChevronLeft size={20} color={theme.text} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.iconButton, styles.iconButtonPlaceholder]} />
          )}
          <TouchableOpacity style={styles.iconButton} onPress={toggleTheme} hitSlop={10}>
            {isSystemTheme ? (
              <SunMoon size={16} color={theme.text} />
            ) : themeName === 'dawn' ? (
              <Sun size={16} color={theme.text} />
            ) : (
              <Moon size={16} color={theme.text} />
            )}
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 420 }}
              style={styles.brandMark}
            >
              <Logo size={56} />
              <Text style={styles.wordmark}>Stack</Text>
              <Text style={styles.tagline}>Start today's stack fresh.</Text>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 420, delay: 90 }}
              style={styles.card}
            >
              <Text style={styles.title}>Create an account</Text>
              <ErrorBanner message={error} />
              <AuthTextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="next"
              />
              <AuthTextField
                label="Username (optional)"
                value={username}
                onChangeText={setUsername}
                placeholder="Auto-generated if blank"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              <AuthTextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                secureTextEntry
                textContentType="newPassword"
                autoComplete="password-new"
                returnKeyType="next"
              />
              <AuthTextField
                label="Confirm password"
                value={confirm}
                onChangeText={setConfirm}
                placeholder="••••••••"
                secureTextEntry
                textContentType="newPassword"
                autoComplete="password-new"
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <PrimaryButton title="Sign up" onPress={handleRegister} loading={loading} />
            </MotiView>

            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              {/* Card-backed pill, not bare text on the gradient — see
                  LoginScreen.js's identical pill for why. */}
              <View style={styles.pill}>
                <Text style={styles.switchText}>
                  Already have an account? <Text style={styles.switchLink}>Log in</Text>
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <StatusBar style={theme.statusBarStyle} />
    </GradientBackground>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: radii.pill,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconButtonPlaceholder: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
    },
    brandMark: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    wordmark: {
      ...typography.header,
      color: theme.text,
      marginTop: spacing.sm,
    },
    tagline: {
      ...typography.small,
      fontWeight: '400',
      color: theme.textMuted,
      marginTop: spacing.xs,
    },
    card: {
      backgroundColor: theme.cardElevated,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: spacing.lg,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
      elevation: 3,
    },
    title: {
      ...typography.title,
      color: theme.text,
      marginBottom: spacing.sm,
    },
    switchRow: {
      alignItems: 'center',
      marginTop: spacing.md,
    },
    pill: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: radii.pill,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    switchText: {
      ...typography.small,
      color: theme.textMuted,
    },
    switchLink: {
      color: theme.accent,
      fontWeight: '700',
    },
  });
}
