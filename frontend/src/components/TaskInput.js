import { useRef, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Text, View } from 'react-native';
import { MotiView } from 'moti';

import { useTheme } from '../context/ThemeContext';
import { radii, spacing } from '../theme';

// The single text box for dumping a new task. Auto-focuses on mount so
// typing is immediate — no tap needed before the first task of the day.
export default function TaskInput({
  onSubmit,
  placeholder = "What's on your plate today?",
  autoFocus = true,
}) {
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pressed, setPressed] = useState(false);
  // Ref, not state: must block a second tap synchronously, before React
  // has a chance to re-render and reflect the disabled state. A rapid
  // double-tap (or Enter + tap in the same gesture) could otherwise fire
  // handleSubmit twice with the same text before either re-render lands,
  // inserting the task twice.
  const submittingRef = useRef(false);
  const styles = makeStyles(theme);

  async function handleSubmit() {
    const trimmed = text.trim();
    if (trimmed.length === 0 || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setText('');
    try {
      await onSubmit(trimmed);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        autoFocus={autoFocus}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        editable={!submitting}
        maxLength={280}
      />
      <TouchableOpacity
        onPress={handleSubmit}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        disabled={text.trim().length === 0 || submitting}
        activeOpacity={1}
      >
        <MotiView
          animate={{ scale: pressed ? 0.88 : 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 300 }}
          style={[styles.button, (text.trim().length === 0 || submitting) && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>+</Text>
        </MotiView>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingLeft: spacing.md,
      paddingRight: spacing.xs,
      paddingVertical: spacing.xs,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      paddingVertical: spacing.sm,
    },
    button: {
      width: 40,
      height: 40,
      borderRadius: radii.pill,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonDisabled: {
      backgroundColor: theme.textMuted,
      opacity: 0.5,
    },
    buttonText: {
      color: '#fff',
      fontSize: 22,
      lineHeight: 24,
      fontWeight: '600',
    },
  });
}
