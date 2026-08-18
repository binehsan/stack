import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Trash2, ChevronDown } from 'lucide-react-native';

import GroupTaskItem from './GroupTaskItem';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography } from '../theme';

// The group-stack counterpart to DumpSection (see components/DumpSection.js):
// completed shared tasks collapse out of the active list here instead of
// piling up alongside what still needs doing, while staying one tap away to
// review, undo, or nudge someone about — same "collapsed by default" shape,
// GroupTaskItem rows instead of TaskItem (no star toggle in group stacks).
export default function GroupDumpSection({ tasks, onToggle, onDelete, onNudge }) {
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
            <GroupTaskItem
              key={task.localId ?? task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onNudge={onNudge}
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
