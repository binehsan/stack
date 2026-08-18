import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MotiView } from 'moti';
import { Sparkles } from 'lucide-react-native';

import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

// A once-per-day, non-punishing summary. No streaks, no red framing — just
// a warm "here's how yesterday went", with a little extra sparkle if most
// or all of it got done.
export default function RecapModal({ visible, recap, onClose }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  if (!recap) return null;

  const { total, completed } = recap;
  const ratio = total === 0 ? 0 : completed / total;
  const celebrate = total > 0 && ratio >= 0.7;

  const message = celebrate
    ? completed === total
      ? "You cleared the whole stack. Nicely done."
      : 'Great day — most of it got done.'
    : completed === 0
      ? "A quiet day. Today's a clean slate."
      : "Here's how yesterday went.";

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <MotiView
          from={{ opacity: 0, translateY: 16, scale: 0.96 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 260 }}
          style={styles.card}
        >
          {celebrate && (
            <View style={styles.sparkleRow} pointerEvents="none">
              {[0, 1, 2].map((i) => (
                <MotiView
                  key={i}
                  from={{ opacity: 0, translateY: 6, scale: 0.5 }}
                  animate={{ opacity: 1, translateY: 0, scale: 1 }}
                  transition={{ type: 'timing', duration: 320, delay: i * 90 }}
                >
                  <Sparkles size={20} color={theme.accent} fill={theme.accent} />
                </MotiView>
              ))}
            </View>
          )}

          <Text style={styles.eyebrow}>Yesterday's recap</Text>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 320, delay: 100 }}
          >
            <Text style={styles.tally}>
              {completed} <Text style={styles.tallyMuted}>of {total}</Text>
            </Text>
          </MotiView>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Start today</Text>
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
      maxWidth: 360,
      backgroundColor: theme.cardElevated,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: spacing.xl,
      alignItems: 'center',
    },
    sparkleRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    eyebrow: {
      ...typography.tiny,
      color: theme.textMuted,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    tally: {
      fontSize: 44,
      fontWeight: '700',
      color: theme.text,
      marginBottom: spacing.sm,
    },
    tallyMuted: {
      fontSize: 22,
      fontWeight: '600',
      color: theme.textMuted,
    },
    message: {
      ...typography.body,
      color: theme.textMuted,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    button: {
      backgroundColor: theme.accent,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xl,
      borderRadius: radii.md,
    },
    buttonText: {
      ...typography.small,
      color: theme.onAccent,
      fontWeight: '700',
    },
  });
}
