import { StyleSheet, Text } from 'react-native';
import { MotiView } from 'moti';

import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

// A calm, styled stand-in for network/auth error alerts — no default OS
// alert boxes anywhere in the app.
export default function ErrorBanner({ message }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  if (!message) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: -6 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 200 }}
      style={styles.banner}
    >
      <Text style={styles.text}>{message}</Text>
    </MotiView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    banner: {
      backgroundColor: theme.danger + '1A',
      borderWidth: 1,
      borderColor: theme.danger + '40',
      borderRadius: radii.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    text: {
      ...typography.small,
      color: theme.danger,
      fontWeight: '600',
    },
  });
}
