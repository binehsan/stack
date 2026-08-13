import { Image, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';

// A circular avatar image, or an initial-letter fallback when the user
// hasn't set one — used on myStack, next to group stack task rows, and for
// a group stack's own photo (falls back to its name's initial).
export default function Avatar({ uri, label, size = 40 }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme, size);

  if (uri) {
    return <Image source={{ uri }} style={styles.image} />;
  }

  const initial = (label || '?').trim().charAt(0).toUpperCase();
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackText}>{initial}</Text>
    </View>
  );
}

function makeStyles(theme, size) {
  return StyleSheet.create({
    image: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: theme.card,
    },
    fallback: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fallbackText: {
      color: theme.accent,
      fontWeight: '700',
      fontSize: size * 0.4,
    },
  });
}
