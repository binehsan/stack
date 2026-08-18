import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MotiView } from 'moti';
import { Users, BarChart2, RefreshCw, Sparkles } from 'lucide-react-native';

import PrimaryButton from './PrimaryButton';
import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

// Copy per gated feature a guest tapped into — same modal shell for all of
// them (reused rather than one-off modals per feature), just different
// pitch text depending on what they were trying to reach.
const REASON_COPY = {
  groupStacks: {
    Icon: Users,
    title: 'Group stacks need an account',
    subtitle:
      "Create a free account to share a task list with family, friends, or anyone else — everyone can add items and see who's on the hook.",
  },
  stats: {
    Icon: BarChart2,
    title: 'Track your stats with an account',
    subtitle:
      'Streaks, totals, and your best day ever — saved to a free account instead of just this device.',
  },
  sync: {
    Icon: RefreshCw,
    title: 'Sync across devices',
    subtitle: "Create a free account and your stack follows you — your stack, wherever u are.",
  },
};
const DEFAULT_COPY = {
  Icon: Sparkles,
  title: 'Create a free account',
  subtitle: 'Unlock cross-device sync, stats, and group stacks — all free, no paid tier here.',
};

// Fires only when a guest explicitly taps something that needs an account —
// never an unprompted auto-popup. `reason` picks the pitch; `onCreateAccount`
// and `onDismiss` are left to the caller so this stays a dumb, reusable shell.
export default function SignUpNudgeModal({ visible, reason, onCreateAccount, onDismiss }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const copy = REASON_COPY[reason] || DEFAULT_COPY;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <MotiView
          from={{ opacity: 0, translateY: 16, scale: 0.96 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 220 }}
          style={styles.card}
        >
          <View style={styles.iconWrap}>
            <copy.Icon size={28} color={theme.accent} strokeWidth={1.75} />
          </View>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>

          <PrimaryButton title="Create free account" onPress={onCreateAccount} />

          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss} activeOpacity={0.7}>
            <Text style={styles.dismissText}>Maybe later</Text>
          </TouchableOpacity>
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
      maxWidth: 380,
      alignItems: 'center',
      backgroundColor: theme.cardElevated,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: spacing.xl,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: {
      ...typography.title,
      color: theme.text,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.small,
      fontWeight: '400',
      color: theme.textMuted,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    dismissButton: {
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
    },
    dismissText: {
      ...typography.small,
      color: theme.textMuted,
      fontWeight: '600',
    },
  });
}
