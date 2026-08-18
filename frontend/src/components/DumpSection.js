import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Trash2, ChevronDown } from 'lucide-react-native';

import TaskItem from './TaskItem';
import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

// Where completed tasks go to rest — collapsed by default so a satisfying
// checkmark doesn't turn into visual clutter at the bottom of the list.
// Expandable to review or undo (tap to uncomplete, swipe to delete still work).
export default function DumpSection({ tasks, onToggle, onDelete, onToggleStar, starDisabled }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [expanded, setExpanded] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOut.duration(150)}
      layout={LinearTransition.duration(220)}
      style={styles.container}
    >
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Trash2 size={14} color={theme.textMuted} strokeWidth={2} />
        <Text style={styles.label}>Dump</Text>
        <Text style={styles.count}>{tasks.length} done</Text>
        <MotiView
          animate={{ rotate: expanded ? '180deg' : '0deg' }}
          transition={{ type: 'timing', duration: 200 }}
        >
          <ChevronDown size={16} color={theme.textMuted} />
        </MotiView>
      </TouchableOpacity>

      {expanded && (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onToggleStar={onToggleStar}
              starDisabled={starDisabled}
            />
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: {
      marginTop: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      gap: spacing.sm,
    },
    label: {
      ...typography.small,
      color: theme.textMuted,
      fontWeight: '700',
    },
    count: {
      ...typography.tiny,
      color: theme.textMuted,
      flex: 1,
    },
  });
}
