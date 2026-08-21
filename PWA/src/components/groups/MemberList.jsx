import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

import Avatar from './Avatar';
import { useLanguage } from '../../context/LanguageContext';
import styles from './MemberList.module.css';

// The row of member chips on a group stack's detail page, plus the toggle
// that reveals InviteCard — matches GroupStackDetailScreen's membersRow.
// Each chip links to that member's profile page (member-since + optional
// stats) — needs `stackId` since the profile route is scoped to a stack
// (a viewer can only see profiles of people they share a Group Stack with).
export default function MemberList({ members, stackId, inviteOpen, onToggleInvite }) {
  const { t } = useLanguage();
  return (
    <div className={styles.row}>
      {members.map((member) => (
        <Link
          key={member.id}
          to={`/stacks/${stackId}/members/${member.id}`}
          className={styles.chip}
        >
          <Avatar uri={member.avatar} label={member.username} size={24} />
          <span className={`text-tiny latin ${styles.chipText}`}>@{member.username}</span>
        </Link>
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
