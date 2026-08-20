import { UserPlus } from 'lucide-react';

import Avatar from './Avatar';
import { useLanguage } from '../../context/LanguageContext';
import styles from './MemberList.module.css';

// The row of member chips on a group stack's detail page, plus the toggle
// that reveals InviteCard — matches GroupStackDetailScreen's membersRow.
export default function MemberList({ members, inviteOpen, onToggleInvite }) {
  const { t } = useLanguage();
  return (
    <div className={styles.row}>
      {members.map((member) => (
        <div key={member.id} className={styles.chip}>
          <Avatar uri={member.avatar} label={member.username} size={24} />
          <span className={`text-tiny ${styles.chipText}`}>@{member.username}</span>
        </div>
      ))}
      <button
        type="button"
        className={[styles.inviteToggle, inviteOpen && styles.inviteToggleActive].filter(Boolean).join(' ')}
        onClick={onToggleInvite}
        aria-expanded={inviteOpen}
      >
        <UserPlus size={14} strokeWidth={2.5} />
        <span>{t('groups.memberList.invite')}</span>
      </button>
    </div>
  );
}
