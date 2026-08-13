import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MotiView } from 'moti';

import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

// Tappable suggestions for tasks the user adds often, so retyping the same
// text for the fifth time becomes a single tap. Purely additive — renders
// nothing until the backend has detected at least one repeated task.
export default function QuickAddChips({ suggestions, onPick }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <Animated.View entering={FadeIn.duration(250)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {suggestions.map((text) => (
          <Chip key={text} text={text} styles={styles} onPress={() => onPick(text)} />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

function Chip({ text, styles, onPress }) {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={1}
    >
      <MotiView
        animate={{ scale: pressed ? 0.92 : 1 }}
        transition={{ type: 'timing', duration: 100 }}
        style={styles.chip}
      >
        <Text style={styles.chipText} numberOfLines={1}>
          {text}
        </Text>
      </MotiView>
    </TouchableOpacity>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: {
      marginTop: spacing.sm,
    },
    content: {
      gap: spacing.sm,
      paddingRight: spacing.sm,
    },
    chip: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipText: {
      ...typography.small,
      color: theme.text,
      fontWeight: '600',
    },
  });
}
