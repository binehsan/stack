import { useRef, useState } from 'react';
import { Mic, Plus } from 'lucide-react';

import { useVoiceInput } from '../../voice/useVoiceInput';
import styles from './TaskInput.module.css';

// The single text box for dumping a new task. Auto-focuses on mount so
// typing is immediate — no click needed before the first task of the day.
// Mirrors frontend/src/components/TaskInput.js's submit flow, including
// voice input via the Web Speech API (see useVoiceInput's own comment for
// why it's unavailable on an installed iOS PWA specifically).
export default function TaskInput({
  onSubmit,
  placeholder = "What's on your plate today?",
  autoFocus = true,
}) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const inputRef = useRef(null);
  // Ref, not state: blocks a double-submit synchronously (rapid Enter +
  // click could otherwise fire twice before either re-render lands).
  const submittingRef = useRef(false);
  const textRef = useRef('');
  const voiceErrorTimeoutRef = useRef(null);

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
      inputRef.current?.focus();
    }
  }

  function showVoiceError(message) {
    if (voiceErrorTimeoutRef.current) clearTimeout(voiceErrorTimeoutRef.current);
    setVoiceError(message);
    voiceErrorTimeoutRef.current = setTimeout(() => setVoiceError(null), 3200);
  }

  const { supported: voiceSupported, unavailableReason, recognizing, start, stop } = useVoiceInput({
    onResult: updateText,
    onEnd: (hadResult) => {
      if (hadResult) submitTrimmed(textRef.current.trim());
    },
    onError: (error) => {
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        showVoiceError('Enable microphone access for this site in your browser settings to use voice input.');
      } else if (error === 'no-speech') {
        showVoiceError("Didn't catch that — try again.");
      } else {
        showVoiceError('Voice input had a hiccup — try again.');
      }
    },
  });

  function handleSubmit(event) {
    event.preventDefault();
    submitTrimmed(text.trim());
  }

  function handleMicClick() {
    if (recognizing) {
      stop();
      return;
    }
    if (!voiceSupported) {
      showVoiceError(unavailableReason);
      return;
    }
    start();
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.container} onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className={styles.input}
          value={text}
          onChange={(event) => updateText(event.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={submitting}
          maxLength={280}
          aria-label="New task"
        />
        <button
          type="button"
          className={[styles.micButton, recognizing && styles.micButtonActive].filter(Boolean).join(' ')}
          onClick={handleMicClick}
          disabled={submitting}
          aria-label={recognizing ? 'Stop voice input' : 'Add task by voice'}
          title={voiceSupported ? undefined : unavailableReason}
        >
          <Mic size={18} strokeWidth={2.25} />
        </button>
        <button
          type="submit"
          className={styles.button}
          disabled={text.trim().length === 0 || submitting}
          aria-label="Add task"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </form>
      {voiceError && <p className={`text-tiny ${styles.voiceError}`}>{voiceError}</p>}
    </div>
  );
}
