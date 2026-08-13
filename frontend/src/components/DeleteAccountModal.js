import { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MotiView } from 'moti';

import AuthTextField from './AuthTextField';
import ErrorBanner from './ErrorBanner';
import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

export default function DeleteAccountModal({ visible, onCancel, onConfirm }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleCancel() {
    setPassword('');
    setError(null);
    onCancel();
  }

  async function handleConfirm() {
    if (!password) {
      setError('Enter your password to confirm.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onConfirm(password);
      setPassword('');
    } catch (err) {
      setError(err.message || 'Something went wrong — try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <MotiView
          from={{ opacity: 0, translateY: 16, scale: 0.96 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 260 }}
          style={styles.card}
        >
          <Text style={styles.title}>Delete your account?</Text>
          <Text style={styles.subtitle}>
            This permanently deletes your account and every task you've ever added.
            There's no undo.
          </Text>

          <ErrorBanner message={error} />
          <AuthTextField
            label="Confirm your password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            textContentType="password"
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, loading && styles.deleteButtonDisabled]}
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.deleteText}>{loading ? 'Deleting…' : 'Delete account'}</Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: theme.cardElevated,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: spacing.lg,
    },
    title: {
      ...typography.title,
      color: theme.text,
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.small,
      fontWeight: '400',
      color: theme.textMuted,
      marginBottom: spacing.md,
      lineHeight: 20,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    cancelButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radii.md,
    },
    cancelText: {
      ...typography.small,
      color: theme.textMuted,
      fontWeight: '600',
    },
    deleteButton: {
      backgroundColor: theme.danger,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.md,
    },
    deleteButtonDisabled: {
      opacity: 0.6,
    },
    deleteText: {
      ...typography.small,
      color: '#fff',
      fontWeight: '700',
    },
  });
}
