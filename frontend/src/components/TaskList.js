import { StyleSheet, Text, View } from 'react-native';
import { NestableDraggableFlatList } from 'react-native-draggable-flatlist';

import TaskItem from './TaskItem';
import { useTheme } from '../context/ThemeContext';
import { spacing, typography } from '../theme';

// Renders inside HomeScreen's NestableScrollContainer, alongside
// FocusSection/DumpSection in the same scroll area — drag-to-reorder still
// works nested that way via react-native-draggable-flatlist's "Nestable" API.
export default function TaskList({
  tasks,
  onToggle,
  onDelete,
  onToggleStar,
  starDisabled,
  onReorder,
  emptyEmoji = '🌤️',
  emptyTitle = 'Nothing on your plate yet',
  emptySubtitle = "Add a task above to start today's stack.",
}) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>{emptyEmoji}</Text>
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContent}>
      <NestableDraggableFlatList
        data={tasks}
        keyExtractor={(task) => String(task.localId ?? task.id)}
        onDragEnd={({ data }) => onReorder?.(data.map((task) => task.id))}
        renderItem={({ item, drag, isActive }) => (
          <TaskItem
            task={item}
            onToggle={onToggle}
            onDelete={onDelete}
            onToggleStar={onToggleStar}
            starDisabled={starDisabled}
            onDrag={onReorder ? drag : undefined}
            isDragging={isActive}
          />
        )}
      />
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    listContent: {
      paddingTop: spacing.md,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xl,
      gap: spacing.xs,
    },
    emptyEmoji: {
      fontSize: 40,
      marginBottom: spacing.sm,
    },
    emptyTitle: {
      ...typography.bodyStrong,
      color: theme.text,
    },
    emptySubtitle: {
      ...typography.small,
      fontWeight: '400',
      color: theme.textMuted,
      textAlign: 'center',
    },
  });
}
