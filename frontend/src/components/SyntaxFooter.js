import { Image, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';

import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

// Bottom-of-screen credit — "A project of Syntax" everywhere it appears,
// plus the author + app version specifically on the settings page
// (`showDetails`). Not shown with details on auth screens; those just get
// the logo so the credit doesn't compete with the login/signup form.
export default function SyntaxFooter({ showDetails = false }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const version = Constants.expoConfig?.version;

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/syntax-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      {/* The text sits on `theme.card`, not directly on the page's raw
          gradient — this footer usually lands near the bottom of a long
          scroll, which (in light themes especially) can be the darker end
          of the 3-stop gradient, where a muted text color tuned for the
          pale end reads as low-contrast. Every theme's card/text pairing is
          already contrast-checked against ITSELF (same as every card
          elsewhere in the app), so anchoring to that surface instead of the
          gradient keeps this legible regardless of theme or scroll
          position. */}
      <View style={styles.textPlate}>
        <Text style={styles.text}>A project of Syntax</Text>
        {showDetails && (
          <>
            <Text style={styles.detail}>App by Muhammad Amen Ehsan</Text>
            {version && <Text style={styles.detail}>Version {version}</Text>}
          </>
        )}
      </View>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
      gap: 2,
    },
    logo: {
      width: 100,
      height: 40,
      marginBottom: spacing.xs,
      opacity: 0.8,
    },
    textPlate: {
      alignItems: 'center',
      gap: 2,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    text: {
      ...typography.tiny,
      color: theme.textMuted,
      letterSpacing: 0.3,
    },
    detail: {
      ...typography.tiny,
      color: theme.textMuted,
      opacity: 0.7,
    },
  });
}
