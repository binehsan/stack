import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MotiView } from 'moti';
import { X } from 'lucide-react-native';

import Avatar from './Avatar';
import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

// Delegate a group task to another member — or clear the assignment back
// to "unassigned" if it's currently nudged onto someone.
export default function NudgeModal({ visible, task, members, onSelect, onClose }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  if (!task) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <MotiView
          from={{ opacity: 0, translateY: 16, scale: 0.96 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 220 }}
          style={styles.card}
        >
          <Text style={styles.title}>Nudge someone</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            "{task.text}"
          </Text>

          <View style={styles.memberList}>
            {task.assigned_to && (
              <TouchableOpacity
                style={styles.memberRow}
                onPress={() => onSelect(null)}
                activeOpacity={0.7}
              >
                <View style={styles.clearIcon}>
                  <X size={16} color={theme.textMuted} strokeWidth={2.5} />
                </View>
                <Text style={styles.memberName}>Clear assignment</Text>
              </TouchableOpacity>
            )}

            {members.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={styles.memberRow}
                onPress={() => onSelect(member.username)}
                activeOpacity={0.7}
              >
                <Avatar uri={member.avatar} label={member.username} size={32} />
                <Text style={styles.memberName}>@{member.username}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
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
      maxWidth: 380,
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
    },
    memberList: {
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    clearIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberName: {
      ...typography.body,
      color: theme.text,
    },
    cancelButton: {
      alignSelf: 'flex-end',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    cancelText: {
      ...typography.small,
      color: theme.textMuted,
      fontWeight: '600',
    },
  });
}
