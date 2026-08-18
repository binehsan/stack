import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MotiView } from 'moti';
import { Mic, Plus } from 'lucide-react-native';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { radii, spacing, typography } from '../theme';

// expo-speech-recognition's own module file calls Expo's `requireNativeModule`
// at import time (not lazily, not inside a try/catch of its own) — so a
// plain top-level `import ... from 'expo-speech-recognition'` throws
// "Cannot find native module 'ExpoSpeechRecognition'" the instant this file
// loads, on EVERY screen that renders TaskInput, whenever the currently
// installed native build predates this dependency (e.g. right after adding
// it to package.json, before the next `eas build`). That crashes the whole
// app, not just voice input. A `require()` call, unlike a static `import`,
// runs inline at this exact line — wrapping it in try/catch here actually
// catches that throw, so the rest of the app keeps working and voice input
// just quietly disables itself until the next native build.
let ExpoSpeechRecognitionModule = null;
let useSpeechRecognitionEvent = () => {};
let voiceInputAvailable = false;
try {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const speechRecognition = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = speechRecognition.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = speechRecognition.useSpeechRecognitionEvent;
  voiceInputAvailable = true;
} catch {
  // Native module not linked into this build yet — voiceInputAvailable
  // stays false and handleMicPress below shows a calm explanation instead
  // of attempting to use a module that isn't there.
}

// The single text box for dumping a new task. Auto-focuses on mount so
// typing is immediate — no tap needed before the first task of the day.
export default function TaskInput({
  onSubmit,
  placeholder = "What's on your plate today?",
  autoFocus = true,
}) {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pressed, setPressed] = useState(false);
  // Ref, not state: must block a second tap synchronously, before React
  // has a chance to re-render and reflect the disabled state. A rapid
  // double-tap (or Enter + tap in the same gesture) could otherwise fire
  // handleSubmit twice with the same text before either re-render lands,
  // inserting the task twice.
  const submittingRef = useRef(false);
  // Mirrors `text` synchronously — the 'end' event handler below needs the
  // just-recognized transcript the instant recognition stops, and can't
  // rely on the `text` state closure (event hooks may still be holding an
  // earlier render's callback when 'end' fires milliseconds after the last
  // 'result').
  const textRef = useRef('');
  // Only auto-submit a voice session that actually produced a transcript —
  // 'end' fires after silence/no-speech and after errors too, not just
  // after a successful recognition, and in either of those cases textRef
  // may still hold whatever the user had typed *before* tapping the mic.
  // Auto-submitting that pre-existing text would be a surprising side
  // effect of a failed voice attempt.
  const hasVoiceResultRef = useRef(false);
  const voiceErroredRef = useRef(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  // Whether the native recognizer is actively listening — drives the mic's
  // pulsing "listening" look and lets a second tap stop it early.
  const [recognizing, setRecognizing] = useState(false);
  // A calm, transient inline caption (not a native Alert — see
  // ErrorBanner.js's own comment on why this app avoids OS alert boxes for
  // anything that isn't a hard permission/OS-boundary wall) shown below the
  // input for recoverable recognition hiccups like "no speech detected".
  const [voiceError, setVoiceError] = useState(null);
  const voiceErrorTimeoutRef = useRef(null);
  const styles = makeStyles(theme);

  function showVoiceError(message) {
    if (voiceErrorTimeoutRef.current) clearTimeout(voiceErrorTimeoutRef.current);
    setVoiceError(message);
    voiceErrorTimeoutRef.current = setTimeout(() => setVoiceError(null), 3200);
  }

  useEffect(() => {
    return () => {
      if (voiceErrorTimeoutRef.current) clearTimeout(voiceErrorTimeoutRef.current);
    };
  }, []);

  // Event hooks must be called unconditionally, every render, regardless of
  // auth state — the rules of hooks, not a stylistic choice.
  useSpeechRecognitionEvent('start', () => {
    setRecognizing(true);
    setVoiceError(null);
    hasVoiceResultRef.current = false;
    voiceErroredRef.current = false;
  });
  useSpeechRecognitionEvent('end', () => {
    setRecognizing(false);
    // Auto-add on detection finishing, rather than making the user also
    // tap the + button — but only when this session actually recognized
    // something (see hasVoiceResultRef's comment above).
    if (hasVoiceResultRef.current && !voiceErroredRef.current) {
      submitTrimmed(textRef.current.trim());
    }
  });
  useSpeechRecognitionEvent('result', (event) => {
    const result = event.results[0];
    if (!result) return;
    hasVoiceResultRef.current = true;
    // `transcript` is the recognizer's whole-utterance guess so far (not an
    // incremental delta), so replacing the field's value on every event —
    // interim or final — is correct here, not additive.
    updateText(result.transcript.slice(0, 280));
  });
  useSpeechRecognitionEvent('error', (event) => {
    setRecognizing(false);
    voiceErroredRef.current = true;
    // Permission loss mid-flight is an OS-boundary event with no in-app
    // remedy, so — unlike the calm inline caption below for recoverable
    // hiccups — this is the one place voice input still reaches for a
    // native Alert, matching the same call in handleMicPress below.
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      Alert.alert(
        'Microphone access needed',
        'Enable microphone and speech recognition access for Stack in your device Settings to use voice input.'
      );
      return;
    }
    if (event.error === 'no-speech') {
      showVoiceError("Didn't catch that — try again.");
      return;
    }
    showVoiceError('Voice input had a hiccup — try again.');
  });

  function updateText(value) {
    textRef.current = value;
    setText(value);
  }

  async function submitTrimmed(trimmed) {
    if (trimmed.length === 0 || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    updateText('');
    try {
      await onSubmit(trimmed);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    await submitTrimmed(text.trim());
  }

  async function handleMicPress() {
    if (voiceLoading) return;

    if (!voiceInputAvailable) {
      showVoiceError('Voice input needs a fresh app update — check back after the next build.');
      return;
    }

    // Tapping the mic again mid-listen stops it early and processes
    // whatever's been captured so far as final, rather than making the
    // user wait out the OS's own silence timeout every time.
    if (recognizing) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    // Voice input is a signed-in-only feature (see the auth-scope decision
    // to gate cross-device/account-only features behind a free account, not
    // payment) — a guest tapping this has no session, so skip straight to a
    // clear prompt rather than a confusing runtime error.
    if (!isAuthenticated) {
      showVoiceError('Sign up for a free account to use voice input.');
      return;
    }

    // Ask for mic/speech access and start listening. Permissions are
    // requested here, not at mount/module load, so a fresh install never
    // sees an OS prompt before the user has even touched the mic button once.
    setVoiceLoading(true);
    let permission;
    try {
      permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    } catch {
      showVoiceError("Voice input isn't available on this device right now.");
      setVoiceLoading(false);
      return;
    }
    setVoiceLoading(false);
    if (!permission.granted) {
      Alert.alert(
        'Microphone access needed',
        'Enable microphone and speech recognition access for Stack in your device Settings to use voice input.'
      );
      return;
    }

    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      // Single utterance — auto-stops once the user pauses, which is right
      // for a short task line rather than open-ended dictation.
      continuous: false,
      requiresOnDeviceRecognition: false,
    });
  }

  return (
    <View>
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={updateText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          autoFocus={autoFocus}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          editable={!submitting}
          maxLength={280}
        />
        <TouchableOpacity
          onPress={handleMicPress}
          disabled={voiceLoading}
          activeOpacity={0.7}
          style={styles.micButton}
          hitSlop={6}
        >
          {recognizing && (
            <MotiView
              from={{ opacity: 0.5, scale: 0.9 }}
              animate={{ opacity: 0, scale: 1.6 }}
              transition={{ type: 'timing', duration: 1100, loop: true }}
              style={styles.micPulse}
            />
          )}
          <MotiView
            animate={{ scale: recognizing ? 1.08 : 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 260 }}
            style={[styles.micIconWrap, recognizing && styles.micIconWrapActive]}
          >
            <Mic
              size={19}
              color={recognizing ? theme.accent : theme.textMuted}
              strokeWidth={recognizing ? 2.4 : 2}
            />
          </MotiView>
        </TouchableOpacity>
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
            <Plus size={22} color={theme.onAccent} strokeWidth={2.5} />
          </MotiView>
        </TouchableOpacity>
      </View>

      {/* Plain conditional render + enter-only MotiView, same pattern as
          ErrorBanner.js — this app deliberately avoids Moti's
          AnimatePresence (see README's "Notes / judgment calls": it
          re-exports from framer-motion internally, not a real/reliable RN
          dependency here), so there's no exit animation, just a fade in. */}
      {voiceError && (
        <MotiView
          from={{ opacity: 0, translateY: -4 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 200 }}
          style={styles.voiceErrorCaption}
        >
          <Text style={styles.voiceErrorText}>{voiceError}</Text>
        </MotiView>
      )}
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
    micButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // A soft ring behind the mic icon that scales up and fades out on a
    // loop while listening — a calm "breathing" glow rather than a blinking
    // recording dot, per the app's premium/unhurried design language.
    micPulse: {
      position: 'absolute',
      width: 30,
      height: 30,
      borderRadius: radii.pill,
      backgroundColor: theme.accentSoft,
    },
    micIconWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    micIconWrapActive: {
      backgroundColor: theme.accentSoft,
      width: 30,
      height: 30,
      borderRadius: radii.pill,
    },
    voiceErrorCaption: {
      paddingTop: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    voiceErrorText: {
      ...typography.small,
      color: theme.danger,
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
  });
}
