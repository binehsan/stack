import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';

import styles from './TaskInput.module.css';

// The single text box for dumping a new task. Auto-focuses on mount so
// typing is immediate — no click needed before the first task of the day.
// Mirrors frontend/src/components/TaskInput.js's submit flow (minus voice
// input, which is a native-only feature not part of the web MVP).
export default function TaskInput({
  onSubmit,
  placeholder = "What's on your plate today?",
  autoFocus = true,
}) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);
  // Ref, not state: blocks a double-submit synchronously (rapid Enter +
  // click could otherwise fire twice before either re-render lands).
  const submittingRef = useRef(false);

  async function submitTrimmed(trimmed) {
    if (trimmed.length === 0 || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setText('');
    try {
      await onSubmit(trimmed);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitTrimmed(text.trim());
  }

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        className={styles.input}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={submitting}
        maxLength={280}
        aria-label="New task"
      />
      <button
        type="submit"
        className={styles.button}
        disabled={text.trim().length === 0 || submitting}
        aria-label="Add task"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>
    </form>
  );
}
