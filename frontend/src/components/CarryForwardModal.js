import { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MotiView } from 'moti';
import { Check } from 'lucide-react-native';

import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

// Opt-in only, per spec: nothing carries forward automatically. This shows
// once, right when the app notices yesterday's unresolved unfinished tasks,
// and lets the user pick exactly which ones (if any) to bring into today.
export default function CarryForwardModal({ visible, candidates, onSubmit }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [selected, setSelected] = useState(new Set());

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(ids) {
    onSubmit(ids);
    setSelected(new Set());
  }

  if (!candidates || candidates.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <MotiView
          from={{ opacity: 0, translateY: 16, scale: 0.96 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 260 }}
          style={styles.card}
        >
          <Text style={styles.title}>Bring anything forward?</Text>
          <Text style={styles.subtitle}>
            {candidates.length === 1
              ? "You had 1 task left over from yesterday."
              : `You had ${candidates.length} tasks left over from yesterday.`}{' '}
            Pick any you'd like on today's stack — totally optional.
          </Text>

          <View style={styles.list}>
            {candidates.map((task) => {
              const isSelected = selected.has(task.id);
              return (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.item, isSelected && styles.itemSelected]}
                  onPress={() => toggle(task.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                    {isSelected && <Check size={12} color={theme.onAccent} strokeWidth={3} />}
                  </View>
                  <Text style={styles.itemText} numberOfLines={2}>
                    {task.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.skipButton} onPress={() => handleSubmit([])}>
              <Text style={styles.skipText}>Not today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => handleSubmit([...selected])}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryText}>
                {selected.size === 0 ? 'Start fresh' : `Bring forward (${selected.size})`}
              </Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: theme.cardElevated,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: spacing.lg,
    },
    title: {
      ...typography.title,
      color: theme.text,
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.small,
      fontWeight: '400',
      color: theme.textMuted,
      marginBottom: spacing.md,
      lineHeight: 20,
    },
    list: {
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    itemSelected: {
      borderColor: theme.accent,
      backgroundColor: theme.accentSoft,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    checkboxChecked: {
      backgroundColor: theme.accent,
    },
    itemText: {
      ...typography.body,
      color: theme.text,
      flex: 1,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
    },
    skipButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radii.md,
    },
    skipText: {
      ...typography.small,
      color: theme.textMuted,
      fontWeight: '600',
    },
    primaryButton: {
      backgroundColor: theme.accent,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.md,
    },
    primaryText: {
      ...typography.small,
      color: theme.onAccent,
      fontWeight: '700',
    },
  });
}
