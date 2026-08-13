import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

export default function AuthTextField({ label, ...inputProps }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        {...inputProps}
      />
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    label: {
      ...typography.small,
      color: theme.textMuted,
      marginBottom: spacing.xs,
    },
    input: {
      backgroundColor: theme.card,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      fontSize: 16,
      color: theme.text,
    },
  });
}
