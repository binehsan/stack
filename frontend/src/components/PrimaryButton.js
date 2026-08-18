import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

export default function PrimaryButton({ title, onPress, loading, disabled }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={theme.onAccent} />
      ) : (
        <Text style={styles.text} numberOfLines={1}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    button: {
      backgroundColor: theme.accent,
      borderRadius: radii.md,
      paddingVertical: spacing.md,
      // Missing before — with none, a long title (e.g. "Create free
      // account") ran flush to the button's own edges since the button
      // itself stretches to fill its container's width.
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 2,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    text: {
      ...typography.bodyStrong,
      color: theme.onAccent,
    },
  });
}
