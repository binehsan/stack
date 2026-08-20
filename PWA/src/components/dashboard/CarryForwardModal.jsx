import { useState } from 'react';
import { Check } from 'lucide-react';

import { useLanguage } from '../../context/LanguageContext';
import BottomSheet from '../BottomSheet';
import styles from './CarryForwardModal.module.css';

// Opt-in only, per spec: nothing carries forward automatically. This shows
// once, right when the app notices yesterday's unresolved unfinished tasks,
// and lets the user pick exactly which ones (if any) to bring into today.
// Web counterpart of frontend/src/components/CarryForwardModal.js.
export default function CarryForwardModal({ visible, candidates, onSubmit }) {
  const { t } = useLanguage();
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
    <BottomSheet open={visible} dismissible={false} label={t('dashboard.carryForwardModal.ariaLabel')}>
      <h3 className={`text-title ${styles.title}`}>{t('dashboard.carryForwardModal.heading')}</h3>
      <p className={`text-small ${styles.subtitle}`}>
        {candidates.length === 1
          ? t('dashboard.carryForwardModal.oneTask')
          : t('dashboard.carryForwardModal.manyTasks', { count: candidates.length })}{' '}
        {t('dashboard.carryForwardModal.subtitleTail')}
      </p>

      <div className={styles.list}>
        {candidates.map((task) => {
          const isSelected = selected.has(task.id);
          return (
            <button
              key={task.id}
              type="button"
              className={[styles.item, isSelected && styles.itemSelected].filter(Boolean).join(' ')}
              onClick={() => toggle(task.id)}
            >
              <span className={[styles.checkbox, isSelected && styles.checkboxChecked].filter(Boolean).join(' ')}>
                {isSelected && <Check size={12} strokeWidth={3} color="var(--color-on-accent)" />}
              </span>
              <span className={`text-body ${styles.itemText}`}>{task.text}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.skipButton} onClick={() => handleSubmit([])}>
          {t('dashboard.carryForwardModal.notToday')}
        </button>
        <button type="button" className={styles.primaryButton} onClick={() => handleSubmit([...selected])}>
          {selected.size === 0
            ? t('dashboard.carryForwardModal.startFresh')
            : t('dashboard.carryForwardModal.bringForward', { count: selected.size })}
        </button>
      </div>
    </BottomSheet>
  );
}
