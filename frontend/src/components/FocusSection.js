import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

const MAX_FOCUS = 3;

// Optional highlight strip for up to 3 starred "today's focus" tasks.
// Purely additive — starring is optional, and the app looks and works fine
// with zero stars (this section just doesn't render).
export default function FocusSection({ tasks, onToggle }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const starred = tasks.filter((t) => t.starred);

  if (starred.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOut.duration(150)}
      layout={LinearTransition.duration(220)}
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <Text style={styles.label}>★ Today's focus</Text>
        <Text style={styles.count}>
          {starred.length}/{MAX_FOCUS}
        </Text>
      </View>
      {starred.map((task) => (
        <Animated.View
          key={task.id}
          entering={FadeInDown.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={LinearTransition.duration(220)}
        >
          <TouchableOpacity
            style={styles.row}
            onPress={() => onToggle(task)}
            activeOpacity={0.7}
          >
            <View style={[styles.dot, task.completed && styles.dotDone]} />
            <Text style={[styles.text, task.completed && styles.textDone]} numberOfLines={1}>
              {task.text}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </Animated.View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.accentSoft,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: theme.accent + '33',
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    label: {
      ...typography.small,
      color: theme.accent,
      fontWeight: '700',
    },
    count: {
      ...typography.tiny,
      color: theme.textMuted,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.accent,
      marginRight: spacing.sm,
    },
    dotDone: {
      backgroundColor: theme.textMuted,
    },
    text: {
      ...typography.body,
      color: theme.text,
      flex: 1,
    },
    textDone: {
      color: theme.textMuted,
      textDecorationLine: 'line-through',
    },
  });
}
