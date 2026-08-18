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
import SyntaxFooter from '../components/SyntaxFooter';
import AuthTextField from '../components/AuthTextField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorBanner from '../components/ErrorBanner';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

export default function LoginScreen({ navigation }) {
  const { theme, toggleTheme, themeName, isSystemTheme } = useTheme();
  const { login, continueAsGuest } = useAuth();
  const styles = makeStyles(theme);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Something went wrong — try again.');
    } finally {
      setLoading(false);
    }
  }

  // Always land on Home, not just "flip isGuest and hope a state-change
  // effect notices." If someone is already a guest (e.g. they tapped the
  // guest CTA, went to Register, then back to Login) `continueAsGuest()`
  // sets a value that's already true — nothing changes, so App.js's
  // auth-branch-change effect never fires and this button did nothing.
  // Navigating explicitly works the same whether this is a genuine
  // anon->guest transition or someone already in guest mode just wants
  // back to the app — Home is always a registered route either way.
  async function handleContinueAsGuest() {
    await continueAsGuest();
    navigation.navigate('Home');
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
            // Same footprint as iconButton (keeps the theme toggle pinned
            // right via topBar's space-between), but invisible — reusing
            // iconButton's own style here drew a card-colored, bordered
            // circle with nothing in it, which read as a mystery button
            // rather than empty space.
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
              <Logo size={64} />
              <Text style={styles.wordmark}>Stack</Text>
              <Text style={styles.tagline}>Your day, dumped and done.</Text>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 420, delay: 90 }}
              style={styles.card}
            >
              <Text style={styles.title}>Welcome back</Text>
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
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                textContentType="password"
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <PrimaryButton title="Log in" onPress={handleLogin} loading={loading} />
            </MotiView>

            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
            >
              {/* A card-backed pill, not bare text on the gradient — a flat
                  muted color can't stay legible across the whole gradient
                  range (pale at the top, near-black at the bottom), so
                  secondary text sitting directly on it needs a surface of
                  its own to guarantee contrast. */}
              <View style={styles.pill}>
                <Text style={styles.switchText}>
                  New here? <Text style={styles.switchLink}>Create an account</Text>
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestRow}
              onPress={handleContinueAsGuest}
              activeOpacity={0.7}
            >
              <View style={styles.pill}>
                <Text style={styles.guestText}>Continue without an account</Text>
              </View>
            </TouchableOpacity>

            <SyntaxFooter />
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
      paddingVertical: spacing.xl,
    },
    brandMark: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    wordmark: {
      ...typography.header,
      color: theme.text,
      marginTop: spacing.md,
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
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 4,
    },
    title: {
      ...typography.title,
      color: theme.text,
      marginBottom: spacing.md,
    },
    switchRow: {
      alignItems: 'center',
      marginTop: spacing.lg,
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
    guestRow: {
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    guestText: {
      ...typography.small,
      fontWeight: '400',
      color: theme.textMuted,
      textDecorationLine: 'underline',
    },
  });
}
