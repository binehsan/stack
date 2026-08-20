import { useState } from 'react';
import { Plus } from 'lucide-react';

import { useLanguage } from '../../context/LanguageContext';
import styles from './GroupTaskInput.module.css';

// The add-a-task box at the top of a group stack's task list — the web
// counterpart of TaskInput.js, minus voice input (mobile-only feature).
export default function GroupTaskInput({ onSubmit, placeholder }) {
  const { t } = useLanguage();
  const resolvedPlaceholder = placeholder ?? t('groups.groupTaskInput.placeholder');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setText('');
    try {
      await onSubmit(trimmed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={resolvedPlaceholder}
        maxLength={280}
        disabled={submitting}
      />
      <button
        type="submit"
        className={styles.button}
        disabled={text.trim().length === 0 || submitting}
        aria-label={t('groups.groupTaskInput.addAria')}
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>
    </form>
  );
}
