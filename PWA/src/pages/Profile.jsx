import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Award, Calendar, CheckCircle2, Star, Zap } from 'lucide-react';

import Avatar from '../components/groups/Avatar';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import StatTile from '../components/StatTile';
import { fetchGroupMemberProfile } from '../api/groupStacks';
import { useLanguage } from '../context/LanguageContext';
import styles from './Profile.module.css';

function formatDate(isoDateOnly) {
  if (!isoDateOnly) return '';
  const parsed = new Date(`${isoDateOnly}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatShortDate(isoDateOnly) {
  if (!isoDateOnly) return '';
  const parsed = new Date(`${isoDateOnly}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// A group-stack member's profile — avatar, handle, and "Stack Member
// Since {date}" always, plus their stats (streaks/totals) if — and only
// if — they've opted in via Settings' "share stats with groupmates"
// toggle. Reached by tapping a member chip in MemberList, scoped to the
// stack both viewer and target share (see family/views.py's
// GroupMemberProfileView — a non-groupmate gets a 404, same as any other
// stack-scoped endpoint here).
export default function Profile() {
  const { stackId, userId } = useParams();
  const { t } = useLanguage();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchGroupMemberProfile(stackId, userId)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || t('profile.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stackId, userId]);

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <Link to={`/stacks/${stackId}`} className={styles.backLink} aria-label={t('profile.backAria')}>
          <ArrowLeft size={18} strokeWidth={2.25} />
        </Link>
        <h1 className={`text-title ${styles.title}`}>
          {profile ? `@${profile.username}` : t('profile.fallbackHeading')}
        </h1>
      </div>

      {loading ? (
        <div className={styles.loadingWrap}>
          <LoadingSpinner />
        </div>
      ) : loadError ? (
        <div className={styles.emptyState}>
          <p className={`text-body-strong ${styles.emptyTitle}`}>{t('profile.couldNotLoad')}</p>
          <p className={`text-small ${styles.emptySubtitle}`}>{loadError}</p>
        </div>
      ) : (
        <>
          <Card className={styles.identityCard}>
            <Avatar uri={profile.avatar} label={profile.username} size={72} />
            <p className={`text-title ${styles.handle}`}>@{profile.username}</p>
            <p className="text-small text-muted">
              {t('profile.memberSince', { date: formatDate(profile.member_since) })}
            </p>
          </Card>

          <Card className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className="text-title">{t('profile.statsHeading')}</h2>
            </div>

            {profile.stats ? (
              <div className={styles.statsGrid}>
                <StatTile
                  Icon={Zap}
                  value={profile.stats.current_streak}
                  label={t('settings.stats.hotStreak')}
                  sublabel={
                    profile.stats.current_streak === 1 ? t('settings.stats.day') : t('settings.stats.days')
                  }
                />
                <StatTile
                  Icon={Award}
                  value={profile.stats.longest_streak}
                  label={t('settings.stats.recordStreak')}
                  sublabel={
                    profile.stats.longest_streak === 1 ? t('settings.stats.day') : t('settings.stats.days')
                  }
                  delay={0.04}
                />
                <StatTile
                  Icon={CheckCircle2}
                  value={profile.stats.total_completed}
                  label={t('settings.stats.tasksCrushed')}
                  delay={0.08}
                />
                <StatTile
                  Icon={Calendar}
                  value={profile.stats.days_active}
                  label={t('settings.stats.stackSessions')}
                  delay={0.12}
                />
                {profile.stats.best_day && (
                  <StatTile
                    Icon={Star}
                    value={profile.stats.best_day.completed}
                    label={t('settings.stats.bestDayEver')}
                    sublabel={formatShortDate(profile.stats.best_day.date)}
                    delay={0.16}
                  />
                )}
              </div>
            ) : (
              <p className="text-small text-muted">{t('profile.statsPrivate')}</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
