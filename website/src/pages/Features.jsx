import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Trash2, ChevronDown, Users, Plus, RefreshCw, Flame, CheckCircle2, Palette, Monitor, Smartphone } from 'lucide-react';

import GradientBackground from '../components/GradientBackground';
import PrimaryButton from '../components/PrimaryButton';
import MarketingNav from '../components/marketing/MarketingNav';
import MarketingFooter from '../components/marketing/MarketingFooter';
import styles from './Features.module.css';

function FocusMockup() {
  return (
    <div className={styles.mockCard}>
      <div className={styles.mockFocusHeader}>
        <Star size={13} className={styles.mockAccentIcon} fill="currentColor" />
        <span className={styles.mockLabel}>Today's focus</span>
        <span className={styles.mockCount}>2/3</span>
      </div>
      {['Finish quarterly report', 'Call the dentist'].map((t) => (
        <div key={t} className={styles.mockFocusRow}>
          <span className={styles.mockDot} />
          <span>{t}</span>
        </div>
      ))}
      <div className={[styles.mockFocusRow, styles.mockRowDone].join(' ')}>
        <span className={[styles.mockDot, styles.mockDotDone].join(' ')} />
        <span className={styles.mockStrike}>Pack gym bag</span>
      </div>
    </div>
  );
}

function DumpMockup() {
  return (
    <div className={styles.mockCard}>
      <div className={styles.mockDumpHeader}>
        <Trash2 size={13} className={styles.mockMutedIcon} />
        <span className={styles.mockLabel}>Dump</span>
        <span className={styles.mockCount}>4 done</span>
        <ChevronDown size={14} className={styles.mockMutedIcon} />
      </div>
      {['Reply to Sam', 'Water the plants', 'Book flights'].map((t) => (
        <div key={t} className={[styles.mockPlainRow, styles.mockRowDone].join(' ')}>
          <CheckCircle2 size={14} className={styles.mockSuccessIcon} />
          <span className={styles.mockStrike}>{t}</span>
        </div>
      ))}
    </div>
  );
}

function GroupStacksMockup() {
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
        <span>Buy groceries</span>
        <span className={styles.mockTag}>J</span>
      </div>
      <div className={styles.mockPlainRow}>
        <span className={styles.mockDot} />
        <span>Take out the trash</span>
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

function RecapMockup() {
  return (
    <div className={styles.mockStatRow}>
      <div className={styles.mockStatTile}>
        <span className={styles.mockStatValue}>6</span>
        <span className={styles.mockStatLabel}>done today</span>
      </div>
      <div className={styles.mockStatTile}>
        <span className={styles.mockStatValue}><Flame size={18} className={styles.mockAccentIcon} /> 4</span>
        <span className={styles.mockStatLabel}>day streak</span>
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

const SECTIONS = [
  {
    icon: Star,
    eyebrow: 'Focus',
    title: 'See today’s priorities, not your whole list',
    body: 'Star up to three tasks and they lift into a highlighted strip at the top of your stack. It’s optional, the app works fine with zero stars, but on a day with fifteen things to do, it’s the difference between a list and a plan.',
    Mockup: FocusMockup,
  },
  {
    icon: Trash2,
    eyebrow: 'Dump',
    title: 'Finished tasks stick around long enough to matter',
    body: 'Complete something and it doesn’t just disappear, it slides into the Dump, a collapsed strip you can expand to see everything you got done today. Satisfying to glance at, easy to ignore when you don’t need it.',
    Mockup: DumpMockup,
  },
  {
    icon: Users,
    eyebrow: 'Group Stacks',
    title: 'Share a list with the people you live and work with',
    body: 'Start a Group Stack for your household, roommates, or friend group. Everyone can add items, check things off, and see who added what, with invites to bring people in and nudges so nothing stalls out.',
    Mockup: GroupStacksMockup,
  },
  {
    icon: RefreshCw,
    eyebrow: 'Sync',
    title: 'One stack, every device',
    body: 'Stack syncs across every phone and tablet you own, no extra setup — and the same free account works on the web: keep working from any browser, or install Stack as a desktop app on Windows or macOS. Add a task on your laptop at work, cross it off from your phone on the way home, and it stays current everywhere in between. Any native desktop app or browser extension Stack ships later comes free too.',
    Mockup: SyncMockup,
  },
  {
    icon: Flame,
    eyebrow: 'Recap',
    title: 'A quick look back, and a reason to come back',
    body: 'Open the app and get a short recap of what you finished, plus a lightweight streak for days you got at least one thing done. No leaderboards, no shame spirals if you break it, just a nice nudge.',
    Mockup: RecapMockup,
  },
  {
    icon: Palette,
    eyebrow: 'Appearance',
    title: 'Make it feel like yours',
    body: 'Switch between Dawn and Dusk, or let Stack follow your system setting automatically. Classic, Purple, Forest Green, and Alpine Blue are all free, on the app and on the web.',
    Mockup: ThemeMockup,
  },
];

export default function Features() {
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
          <p className="text-tiny text-accent">Features</p>
          <h1 className={styles.heroTitle}>Everything Stack does, in detail</h1>
          <p className={styles.heroBody}>
            No due dates, no projects, no categories to configure. Just the handful of features
            that make a daily to-do list actually pleasant to use, alone or with other people.
          </p>
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
              <Mockup />
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
          <h2 className={styles.closingTitle}>See it for yourself</h2>
          <p className={styles.closingChoice}>
            <span className={styles.closingChoiceItem}>
              <Monitor size={15} strokeWidth={2.25} /> free on the web
            </span>
            <span className={styles.closingChoiceDivider}>or</span>
            <span className={styles.closingChoiceItem}>
              <Smartphone size={15} strokeWidth={2.25} /> free on mobile
            </span>
          </p>
          <PrimaryButton as={Link} to="/signup" title="Get Stack, free" variant="solid" />
        </motion.div>
      </section>

      <MarketingFooter />
    </GradientBackground>
  );
}
