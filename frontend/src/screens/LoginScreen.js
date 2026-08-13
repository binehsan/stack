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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { StatusBar } from 'expo-status-bar';

import AuthTextField from '../components/AuthTextField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorBanner from '../components/ErrorBanner';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

export default function LoginScreen({ navigation }) {
  const { theme, toggleTheme, themeName } = useTheme();
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

  return (
    <LinearGradient
      colors={theme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme} hitSlop={10}>
            <Text style={styles.themeToggleText}>{themeName === 'dawn' ? '🌙' : '☀️'}</Text>
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
              <View style={styles.logoStack}>
                <View style={[styles.logoBar, { width: 40 }]} />
                <View style={[styles.logoBar, { width: 30, opacity: 0.7 }]} />
                <View style={[styles.logoBar, { width: 20, opacity: 0.45 }]} />
              </View>
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
              <Text style={styles.switchText}>
                New here? <Text style={styles.switchLink}>Create an account</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestRow}
              onPress={continueAsGuest}
              activeOpacity={0.7}
            >
              <Text style={styles.guestText}>Continue without an account</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <StatusBar style={theme.statusBarStyle} />
    </LinearGradient>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    themeToggle: {
      width: 36,
      height: 36,
      borderRadius: radii.pill,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeToggleText: {
      fontSize: 16,
      color: theme.text,
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
    logoStack: {
      alignItems: 'center',
      gap: 5,
      marginBottom: spacing.md,
    },
    logoBar: {
      height: 9,
      borderRadius: 5,
      backgroundColor: theme.accent,
    },
    wordmark: {
      ...typography.header,
      color: theme.text,
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
      paddingVertical: spacing.sm,
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
      paddingVertical: spacing.sm,
    },
    guestText: {
      ...typography.small,
      fontWeight: '400',
      color: theme.textMuted,
      textDecorationLine: 'underline',
    },
  });
}
