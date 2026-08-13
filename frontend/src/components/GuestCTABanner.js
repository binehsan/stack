import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

// Persistent, passive — always visible on guest-mode Home, never a popup.
// Taps straight through to Register (no interrupt modal needed here; the
// modal is reserved for gated features a guest actively tries to reach).
export default function GuestCTABanner({ onPress }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <TouchableOpacity style={styles.banner} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>ur stack, wherever u are</Text>
        <Text style={styles.subtitle}>Sign up free for sync, stats, and group stacks</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.accentSoft,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: radii.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.lg,
    },
    textWrap: {
      flex: 1,
    },
    title: {
      ...typography.bodyStrong,
      color: theme.accent,
    },
    subtitle: {
      ...typography.tiny,
      color: theme.textMuted,
      marginTop: 2,
    },
    arrow: {
      fontSize: 22,
      color: theme.accent,
      marginLeft: spacing.sm,
    },
  });
}
