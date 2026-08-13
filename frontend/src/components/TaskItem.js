import { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeInDown, FadeOutDown, LinearTransition } from 'react-native-reanimated';
import { MotiView } from 'moti';

import { useTheme } from '../context/ThemeContext';
import { radii, spacing } from '../theme';

// A single row in the stack. Handles its own animations:
// - mount/unmount (Reanimated's entering/exiting, driven by FlatList add/remove)
// - a small "bounce" on the checkbox when toggled (Moti)
// - a strikethrough line that draws on from left to right (Moti, animating width)
// - a star toggle that pops when starring/unstarring for focus mode (Moti)
// - a subtle lift while being long-pressed and dragged to reorder (Moti)
export default function TaskItem({
  task,
  onToggle,
  onDelete,
  onToggleStar,
  starDisabled,
  onDrag,
  isDragging,
}) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const swipeableRef = useRef(null);
  const [bounce, setBounce] = useState(false);
  const [textWidth, setTextWidth] = useState(0);

  function handleToggle() {
    setBounce(true);
    onToggle(task);
    setTimeout(() => setBounce(false), 180);
  }

  function handleDelete() {
    swipeableRef.current?.close();
    onDelete(task.id);
  }

  function handleStar() {
    if (!task.starred && starDisabled) return;
    onToggleStar?.(task);
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
      exiting={FadeOutDown.duration(220)}
      layout={LinearTransition.duration(220)}
      style={styles.wrapper}
    >
      {/* Scale-on-drag lives on this outer wrapper, not inside Swipeable.
          Swipeable clips its own bounds internally (to hide the off-screen
          delete action), so scaling something inside it clips the scaled-up
          edges against that boundary. Scaling the Swipeable itself instead
          scales its clip region along with its content, so nothing crops. */}
      <MotiView
        animate={{ scale: isDragging ? 1.03 : 1 }}
        transition={{ type: 'spring', damping: 18, stiffness: 260 }}
      >
        <Swipeable
          ref={swipeableRef}
          renderRightActions={renderRightActions}
          overshootRight={false}
          onSwipeableOpen={handleDelete}
        >
          <View style={[styles.card, isDragging && styles.cardDragging]}>
            <TouchableOpacity onPress={handleToggle} activeOpacity={0.8} style={styles.checkRow}>
              <MotiView
                animate={{ scale: bounce ? 1.08 : 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 300 }}
                style={[styles.checkbox, task.completed && styles.checkboxCompleted]}
              >
                <MotiView
                  animate={{ opacity: task.completed ? 1 : 0, scale: task.completed ? 1 : 0.4 }}
                  transition={{ type: 'timing', duration: 180 }}
                >
                  <Text style={styles.checkmark}>✓</Text>
                </MotiView>
              </MotiView>

              <View
                style={styles.textWrap}
                onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
              >
                <Text style={[styles.text, task.completed && styles.textCompleted]}>
                  {task.text}
                </Text>
                {/* Real textDecorationLine, revealed via an animated width clip —
                    guarantees the strike sits exactly where the OS renders it
                    (not an eyeballed overlay line), while still "drawing on". */}
                <MotiView
                  animate={{ width: task.completed ? textWidth : 0 }}
                  transition={{ type: 'timing', duration: 320 }}
                  style={styles.strikeClip}
                >
                  <Text style={[styles.text, styles.strikeText, { width: textWidth }]}>
                    {task.text}
                  </Text>
                </MotiView>
              </View>
            </TouchableOpacity>

            {onToggleStar && (
              <TouchableOpacity
                onPress={handleStar}
                activeOpacity={0.6}
                style={styles.starButton}
                hitSlop={8}
              >
                <MotiView
                  animate={{ scale: task.starred ? 1.1 : 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 300 }}
                >
                  <Text
                    style={[
                      styles.star,
                      task.starred && styles.starActive,
                      !task.starred && starDisabled && styles.starDisabled,
                    ]}
                  >
                    {task.starred ? '★' : '☆'}
                  </Text>
                </MotiView>
              </TouchableOpacity>
            )}

            {onDrag && (
              <TouchableOpacity
                onLongPress={onDrag}
                delayLongPress={150}
                activeOpacity={0.6}
                style={styles.dragHandle}
                hitSlop={8}
              >
                <Text style={styles.dragHandleText}>☰</Text>
              </TouchableOpacity>
            )}
          </View>
        </Swipeable>
      </MotiView>
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
    cardDragging: {
      borderColor: theme.accent,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 14,
      elevation: 6,
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
    checkmark: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    textWrap: {
      flex: 1,
      justifyContent: 'center',
    },
    text: {
      fontSize: 16,
      color: theme.text,
    },
    textCompleted: {
      color: theme.textMuted,
    },
    strikeClip: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      overflow: 'hidden',
    },
    strikeText: {
      color: theme.textMuted,
      textDecorationLine: 'line-through',
      textDecorationColor: theme.textMuted,
    },
    starButton: {
      paddingLeft: spacing.sm,
      paddingVertical: spacing.xs,
    },
    star: {
      fontSize: 22,
      color: theme.textMuted,
      opacity: 0.5,
    },
    starActive: {
      color: theme.accent,
      opacity: 1,
    },
    starDisabled: {
      opacity: 0.25,
    },
    dragHandle: {
      paddingLeft: spacing.sm,
      paddingVertical: spacing.xs,
    },
    dragHandleText: {
      fontSize: 16,
      color: theme.textMuted,
      opacity: 0.6,
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
