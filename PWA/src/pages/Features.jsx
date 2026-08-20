import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Trash2, ChevronDown, Users, Plus, RefreshCw, Flame, CheckCircle2, Palette, Monitor, Smartphone } from 'lucide-react';

import GradientBackground from '../components/GradientBackground';
import PrimaryButton from '../components/PrimaryButton';
import MarketingNav from '../components/marketing/MarketingNav';
import MarketingFooter from '../components/marketing/MarketingFooter';
import { useLanguage } from '../context/LanguageContext';
import styles from './Features.module.css';

function FocusMockup({ t }) {
  return (
    <div className={styles.mockCard}>
      <div className={styles.mockFocusHeader}>
        <Star size={13} className={styles.mockAccentIcon} fill="currentColor" />
        <span className={styles.mockLabel}>{t('marketing.features.mockup.focusLabel')}</span>
        <span className={styles.mockCount}>{t('marketing.features.mockup.focusCount')}</span>
      </div>
      {[t('marketing.features.mockup.task1'), t('marketing.features.mockup.task2')].map((row) => (
        <div key={row} className={styles.mockFocusRow}>
          <span className={styles.mockDot} />
          <span>{row}</span>
        </div>
      ))}
      <div className={[styles.mockFocusRow, styles.mockRowDone].join(' ')}>
        <span className={[styles.mockDot, styles.mockDotDone].join(' ')} />
        <span className={styles.mockStrike}>{t('marketing.features.mockup.task3')}</span>
      </div>
    </div>
  );
}

function DumpMockup({ t }) {
  return (
    <div className={styles.mockCard}>
      <div className={styles.mockDumpHeader}>
        <Trash2 size={13} className={styles.mockMutedIcon} />
        <span className={styles.mockLabel}>{t('marketing.features.mockup.dumpLabel')}</span>
        <span className={styles.mockCount}>{t('marketing.features.mockup.dumpCount')}</span>
        <ChevronDown size={14} className={styles.mockMutedIcon} />
      </div>
      {[
        t('marketing.features.mockup.dumpTask1'),
        t('marketing.features.mockup.dumpTask2'),
        t('marketing.features.mockup.dumpTask3'),
      ].map((row) => (
        <div key={row} className={[styles.mockPlainRow, styles.mockRowDone].join(' ')}>
          <CheckCircle2 size={14} className={styles.mockSuccessIcon} />
          <span className={styles.mockStrike}>{row}</span>
        </div>
      ))}
    </div>
  );
}

function GroupStacksMockup({ t }) {
  return (
    <div className={styles.mockCard}>
      <div className={styles.mockAvatarRow}>
        {['J', 'M', 'R'].map((initial) => (
          <span key={initial} className={styles.mockAvatar}>{initial}</span>
        ))}
        <span className={styles.mockAvatarAdd}><Plus size={14} /></span>
      </div>
      <div className={styles.mockPlainRow}>
        <span className={styles.mockDot} />
        <span>{t('marketing.features.mockup.groupTask1')}</span>
        <span className={styles.mockTag}>J</span>
      </div>
      <div className={styles.mockPlainRow}>
        <span className={styles.mockDot} />
        <span>{t('marketing.features.mockup.groupTask2')}</span>
        <span className={styles.mockTag}>R</span>
      </div>
    </div>
  );
}

function SyncMockup() {
  return (
    <div className={styles.mockSyncRow}>
      <div className={styles.mockDevice}>
        <span className={styles.mockDeviceDot} />
        <span className={styles.mockDeviceDot} />
        <span className={styles.mockDeviceDot} />
      </div>
      <RefreshCw size={20} className={styles.mockAccentIcon} />
      <div className={styles.mockDevice}>
        <span className={styles.mockDeviceDot} />
        <span className={styles.mockDeviceDot} />
        <span className={styles.mockDeviceDot} />
      </div>
    </div>
  );
}

function RecapMockup({ t }) {
  return (
    <div className={styles.mockStatRow}>
      <div className={styles.mockStatTile}>
        <span className={styles.mockStatValue}>6</span>
        <span className={styles.mockStatLabel}>{t('marketing.features.mockup.recapDoneToday')}</span>
      </div>
      <div className={styles.mockStatTile}>
        <span className={styles.mockStatValue}><Flame size={18} className={styles.mockAccentIcon} /> 4</span>
        <span className={styles.mockStatLabel}>{t('marketing.features.mockup.recapDayStreak')}</span>
      </div>
    </div>
  );
}

function ThemeMockup() {
  return (
    <div className={styles.mockThemeRow}>
      {['#A8551C', '#7C3AED', '#1F6B45', '#1C5F9E'].map((color, i) => (
        <span
          key={color}
          className={[styles.mockSwatch, i === 0 && styles.mockSwatchActive].filter(Boolean).join(' ')}
          style={{ background: color }}
        />
      ))}
    </div>
  );
}

const SECTION_ICONS = [Star, Trash2, Users, RefreshCw, Flame, Palette];
const SECTION_KEYS = ['focus', 'dump', 'group', 'sync', 'recap', 'appearance'];
const SECTION_MOCKUPS = [FocusMockup, DumpMockup, GroupStacksMockup, SyncMockup, RecapMockup, ThemeMockup];

export default function Features() {
  const { t } = useLanguage();

  const SECTIONS = SECTION_KEYS.map((key, i) => ({
    icon: SECTION_ICONS[i],
    eyebrow: t(`marketing.features.sections.${key}.eyebrow`),
    title: t(`marketing.features.sections.${key}.title`),
    body: t(`marketing.features.sections.${key}.body`),
    Mockup: SECTION_MOCKUPS[i],
  }));

  return (
    <GradientBackground>
      <MarketingNav />

      <section className={styles.hero}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={styles.heroInner}
        >
          <p className="text-tiny text-accent">{t('marketing.features.eyebrow')}</p>
          <h1 className={styles.heroTitle}>{t('marketing.features.heroTitle')}</h1>
          <p className={styles.heroBody}>{t('marketing.features.heroBody')}</p>
        </motion.div>
      </section>

      <div className={styles.sections}>
        {SECTIONS.map(({ icon: Icon, eyebrow, title, body, Mockup }, i) => (
          <motion.section
            key={eyebrow}
            className={[styles.row, i % 2 === 1 && styles.rowReverse].filter(Boolean).join(' ')}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45 }}
          >
            <div className={styles.textCol}>
              <div className={styles.iconBadge}>
                <Icon size={20} strokeWidth={2.25} />
              </div>
              <p className={styles.eyebrow}>{eyebrow}</p>
              <h2 className={styles.sectionTitle}>{title}</h2>
              <p className={styles.sectionBody}>{body}</p>
            </div>
            <div className={styles.visualCol}>
              <Mockup t={t} />
            </div>
          </motion.section>
        ))}
      </div>

      <section className={styles.closing}>
        <motion.div
          className={styles.closingInner}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className={styles.closingTitle}>{t('marketing.features.closingTitle')}</h2>
          <p className={styles.closingChoice}>
            <span className={styles.closingChoiceItem}>
              <Monitor size={15} strokeWidth={2.25} /> {t('marketing.features.closingDesktop')}
            </span>
            <span className={styles.closingChoiceDivider}>·</span>
            <span className={styles.closingChoiceItem}>
              <Smartphone size={15} strokeWidth={2.25} /> {t('marketing.features.closingPhone')}
            </span>
            <span className={styles.closingChoiceDivider}>·</span>
            <span className={styles.closingChoiceItem}>{t('marketing.features.closingFree')}</span>
          </p>
          <PrimaryButton as={Link} to="/signup" title={t('marketing.features.closingCta')} variant="solid" />
          <Link to="/install" className={styles.closingInstallLink}>
            {t('marketing.features.closingInstallLink')}
          </Link>
        </motion.div>
      </section>

      <MarketingFooter />
    </GradientBackground>
  );
}
