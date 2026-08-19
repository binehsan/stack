import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';

import styles from './TaskInput.module.css';

// The single text box for dumping a new task. Defaults to NOT auto-focusing
// — Dashboard mounts fresh every time you tap into "My Stack" (it's a
// route, not a persistent tab), and auto-focusing there was popping the
// mobile keyboard open on every single visit to the page, not just the
// first task of the day. Callers that genuinely want the keyboard up
// immediately (e.g. a dedicated "add task" entry point) can still pass
// `autoFocus` explicitly.
//
// Voice input is deliberately not wired in here — the Web Speech API
// (see voice/useVoiceInput.js, still intact and unused) turned out
// unreliable enough in real testing that the mic button did more harm
// (a control that visibly doesn't work) than good. Pulled from the UI
// rather than deleted, in case it's worth revisiting later.
export default function TaskInput({
  onSubmit,
  placeholder = "What's on your plate today?",
  autoFocus = false,
}) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);
  // Ref, not state: blocks a double-submit synchronously (rapid Enter +
  // click could otherwise fire twice before either re-render lands).
  const submittingRef = useRef(false);

  function updateText(value) {
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

  function handleSubmit(event) {
    event.preventDefault();
    submitTrimmed(text.trim());
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
          type="submit"
          className={styles.button}
          disabled={text.trim().length === 0 || submitting}
          aria-label="Add task"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
}
