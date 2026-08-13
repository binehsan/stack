import { StyleSheet, Text } from 'react-native';
import { MotiView } from 'moti';

import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

export default function StatTile({ emoji, value, label, sublabel, delay = 0 }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay }}
      style={styles.tile}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
    </MotiView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    tile: {
      flexBasis: '47%',
      flexGrow: 1,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: radii.md,
      padding: spacing.md,
    },
    emoji: {
      fontSize: 22,
      marginBottom: spacing.xs,
    },
    value: {
      fontSize: 26,
      fontWeight: '700',
      color: theme.text,
    },
    label: {
      ...typography.small,
      color: theme.textMuted,
      marginTop: spacing.xs / 2,
    },
    sublabel: {
      ...typography.tiny,
      fontWeight: '500',
      color: theme.textMuted,
      marginTop: 2,
    },
  });
}
