import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MotiView } from 'moti';
import { Check } from 'lucide-react-native';

import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';

// A scrollable list of all 24 hours, in the same overlay+card modal shell
// as every other picker in this app (NudgeModal, SignUpNudgeModal, etc.)
// — used by MyStackScreen's daily-reset-time field instead of the old
// always-visible 24-chip horizontal scroll row.
export default function HourPickerModal({ visible, hours, selectedHour, onSelect, onClose }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <MotiView
          from={{ opacity: 0, translateY: 16, scale: 0.96 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 220 }}
          style={styles.card}
        >
          <Text style={styles.title}>Daily reset time</Text>
          <Text style={styles.subtitle}>When today's stack rolls into tomorrow's</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {hours.map((option) => {
              const active = option.hour === selectedHour;
              return (
                <TouchableOpacity
                  key={option.hour}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => onSelect(option.hour)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.rowText, active && styles.rowTextActive]}>
                    {option.label}
                  </Text>
                  {active && <Check size={18} color={theme.accent} strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

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
      maxWidth: 340,
      maxHeight: '75%',
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
    list: {
      flexGrow: 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.md,
    },
    rowActive: {
      backgroundColor: theme.accentSoft,
    },
    rowText: {
      ...typography.body,
      color: theme.text,
    },
    rowTextActive: {
      color: theme.accent,
      fontWeight: '700',
    },
    cancelButton: {
      alignSelf: 'flex-end',
      marginTop: spacing.xs,
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
