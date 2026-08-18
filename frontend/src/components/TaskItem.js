import { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// The Reanimated-backed Swipeable, not the default export from
// 'react-native-gesture-handler' — that default is the legacy version
// built on React Native's classic Animated API. This one runs the swipe
// gesture and its follow animation entirely as UI-thread worklets, same
// as the rest of this app's animations, instead of bridging through the
// old Animated driver — noticeably smoother under any JS-thread load
// (e.g. mid-scroll). Already part of react-native-gesture-handler, which
// was installed before this session — no rebuild needed for this swap.
// This subpath's Swipeable is a DEFAULT export, not a named one (unlike
// the main package's legacy `Swipeable`) — a named import here silently
// resolves to undefined and crashes as soon as any row tries to render it.
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Check, Star, GripVertical } from 'lucide-react-native';

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
  isTopItem,
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
      // No `layout` transition here (there used to be one) — this row
      // lives inside a NestableDraggableFlatList, whose own
      // CellRendererComponent already animates each cell's position via
      // its own Reanimated shared values whenever the list reorders
      // (that's how the drag-to-reorder visual works at all). Adding a
      // second, independent layout animation on top of that had this view
      // animating its own position twice for the same reorder — once
      // via the list's transform, once via this component's `layout` —
      // which is redundant work on every visible row during every drag,
      // and the reorder its own already animates smoothly without it.
      //
      // No scale-up while dragging either (there used to be one) — the
      // "lifted" feel comes entirely from cardDragging's border/shadow
      // now. A growing card needs room outside its own normal bounds to
      // grow into, which the drag list's clipped container (see
      // HomeScreen.js's listArea) doesn't have — the growth was getting
      // cut off right at that boundary, which looked worse than not
      // growing at all.
      style={styles.wrapper}
    >
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        // Resistance once you've dragged past the delete button's own
        // width — 1 (the default) is zero friction, which feels like the
        // row just keeps sliding loosely forever; a higher value gives it
        // the springy "pushing against something" resistance of a native
        // swipe action.
        overshootFriction={8}
        onSwipeableOpen={handleDelete}
      >
        <View
          style={[
            styles.card,
            isTopItem && styles.cardTop,
            // Dragging wins over the top-item treatment if both are ever
            // true at once (dragging the top card) — a transient "picked
            // up" state reads better than fighting it for visual priority.
            isDragging && styles.cardDragging,
          ]}
        >
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
                <Check size={14} color={theme.onAccent} strokeWidth={3} />
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
              hitSlop={12}
            >
              <MotiView
                animate={{ scale: task.starred ? 1.1 : 1 }}
                transition={{ type: 'spring', damping: 10, stiffness: 300 }}
                style={!task.starred && starDisabled ? styles.starDisabled : undefined}
              >
                <Star
                  size={20}
                  color={task.starred ? theme.accent : theme.textMuted}
                  fill={task.starred ? theme.accent : 'transparent'}
                  strokeWidth={task.starred ? 0 : 1.75}
                  opacity={task.starred ? 1 : 0.6}
                />
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
              <GripVertical size={18} color={theme.textMuted} opacity={0.6} />
            </TouchableOpacity>
          )}
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
    // Whatever's currently first in the stack reads as "next up" — a
    // visibly deeper shadow than the flat base card, plus a soft accent
    // tint on the border, without going as far as cardDragging's full
    // accent outline (that's reserved for the transient "picked up"
    // state, not a standing one).
    cardTop: {
      borderColor: theme.accent + '40',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
      elevation: 4,
    },
    cardDragging: {
      borderColor: theme.accent,
      borderWidth: 2,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 3,
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
      // Symmetric padding, not just paddingLeft like before — that made
      // the real tap target lopsided (extra room only on one side of the
      // icon), so hitSlop's extra invisible margin wasn't centered on
      // where the star actually looks tappable, and taps aimed at the
      // visible glyph itself kept landing just outside the target.
      padding: spacing.sm,
    },
    starDisabled: {
      opacity: 0.25,
    },
    dragHandle: {
      paddingLeft: spacing.sm,
      paddingVertical: spacing.xs,
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
