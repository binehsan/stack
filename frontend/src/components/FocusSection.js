import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Star } from 'lucide-react-native';

import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

const MAX_FOCUS = 3;

// Optional highlight strip for up to 3 starred "today's focus" tasks.
// Purely additive — starring is optional, and the app looks and works fine
// with zero stars (this section just doesn't render).
//
// Deliberately plain Views, no Reanimated here (previously used
// entering/exiting/layout animations). This sits directly above TaskList's
// NestableDraggableFlatList inside the same NestableScrollContainer, and a
// Reanimated-driven sibling there was pushing that list's own internal
// offset measurement out of sync with where this box actually rendered,
// which showed up as the list overlapping the bottom of this box. A plain
// View can't race that measurement.
export default function FocusSection({ tasks, onToggle }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const starred = tasks.filter((t) => t.starred);

  if (starred.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.labelRow}>
          <Star size={14} color={theme.accent} fill={theme.accent} />
          <Text style={styles.label}>Today's focus</Text>
        </View>
        <Text style={styles.count}>
          {starred.length}/{MAX_FOCUS}
        </Text>
      </View>
      {starred.map((task) => (
        <TouchableOpacity
          key={task.id}
          style={styles.row}
          onPress={() => onToggle(task)}
          activeOpacity={0.7}
        >
          <View style={[styles.dot, task.completed && styles.dotDone]} />
          <Text style={[styles.text, task.completed && styles.textDone]} numberOfLines={1}>
            {task.text}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
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
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
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
