import { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// Reanimated-backed Swipeable — see TaskItem.js's import comment for why
// (and why this is a default import, not a named one).
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Check } from 'lucide-react-native';

import Avatar from './Avatar';
import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

// A shared group-stack task row: checkbox + text, swipe-to-delete (as in
// the personal stack), plus who it's assigned to and a "Nudge" button to
// delegate it to another member.
export default function GroupTaskItem({ task, onToggle, onDelete, onNudge }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const swipeableRef = useRef(null);

  function handleDelete() {
    swipeableRef.current?.close();
    onDelete(task.id);
  }

  function renderRightActions() {
    return (
      <TouchableOpacity style={styles.deleteAction} onPress={handleDelete} activeOpacity={0.8}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(240)}
      exiting={FadeOut.duration(200)}
      layout={LinearTransition.duration(220)}
      style={styles.wrapper}
    >
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        overshootFriction={8}
        onSwipeableOpen={handleDelete}
      >
        <View style={styles.card}>
          <TouchableOpacity onPress={() => onToggle(task)} activeOpacity={0.8} style={styles.checkRow}>
            <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
              {task.completed && <Check size={14} color={theme.onAccent} strokeWidth={3} />}
            </View>
            <Text
              style={[styles.text, task.completed && styles.textCompleted]}
              numberOfLines={2}
            >
              {task.text}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onNudge(task)}
            activeOpacity={0.7}
            style={styles.nudgeButton}
          >
            <Avatar uri={task.assigned_to?.avatar} label={task.assigned_to?.username || '?'} size={26} />
            <Text style={styles.nudgeLabel}>Nudge</Text>
          </TouchableOpacity>
        </View>
      </Swipeable>
    </Animated.View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    wrapper: {
      marginBottom: spacing.sm,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: spacing.md,
    },
    checkRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkbox: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    checkboxCompleted: {
      backgroundColor: theme.accent,
    },
    text: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
    },
    textCompleted: {
      color: theme.textMuted,
      textDecorationLine: 'line-through',
    },
    nudgeButton: {
      alignItems: 'center',
      marginLeft: spacing.sm,
      paddingLeft: spacing.sm,
    },
    nudgeLabel: {
      ...typography.tiny,
      color: theme.accent,
      marginTop: 2,
    },
    deleteAction: {
      backgroundColor: theme.danger,
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingHorizontal: spacing.lg,
      borderRadius: radii.md,
      marginBottom: spacing.sm,
    },
    deleteText: {
      color: '#fff',
      fontWeight: '600',
    },
  });
}
