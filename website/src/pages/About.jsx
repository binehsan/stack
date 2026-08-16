import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Trash2, Users, Sparkles } from 'lucide-react';

import GradientBackground from '../components/GradientBackground';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import MarketingNav from '../components/marketing/MarketingNav';
import MarketingFooter from '../components/marketing/MarketingFooter';
import styles from './About.module.css';

const PILLARS = [
  {
    icon: Star,
    title: 'Focus, not features',
    body: 'Starring today\'s three priorities is the only "organization" Stack asks of you. Everything else is just a list.',
  },
  {
    icon: Trash2,
    title: 'Nothing to feel guilty about',
    body: 'There\'s no backlog to fall behind on. Today\'s tasks are today\'s tasks — finish them, dump them, and start fresh tomorrow.',
  },
  {
    icon: Users,
    title: 'Built for more than one person',
    body: 'Life isn\'t solo. Group Stacks let a household, roommates, or a friend group share one list without a group chat full of "did anyone get X?"',
  },
  {
    icon: Sparkles,
    title: 'Calm on purpose',
    body: 'Soft gradients, generous spacing, and animations that feel satisfying instead of showy. It should feel more like a nice notes app than software.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function About() {
  return (
    <GradientBackground>
      <MarketingNav />

      <section className={styles.hero}>
        <motion.div
          className={styles.heroInner}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <p className="text-tiny text-accent">About Stack</p>
          <h1 className={styles.heroTitle}>A to-do list that doesn't ask much of you</h1>
          <p className={styles.heroBody}>
            Most task apps eventually become a second job — projects, tags, due dates, a backlog
            you're quietly ashamed of. Stack skips all of it. Write down what you need to do
            today, knock it out, and start clean tomorrow.
          </p>
        </motion.div>
      </section>

      <section className={styles.storySection}>
        <motion.div
          className={styles.storyBlock}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45 }}
        >
          <h2 className={styles.storyTitle}>Why we built it</h2>
          <p className={styles.storyBody}>
            We kept reaching for a to-do app and closing it thirty seconds later, overwhelmed by
            fields we didn't need — due dates for things due today, categories for a list of six
            items, a backlog stretching back weeks. So we built the list we actually wanted: type
            a task, hit enter, see it. Star what matters most right now. Cross things off and
            watch them land somewhere satisfying instead of just disappearing.
          </p>
          <p className={styles.storyBody}>
            Then we noticed most of our own lists weren't really solo — "pick up the kids,"
            "restock the fridge," "book the Airbnb" all involved someone else. So Stack grew a
            second gear: Group Stacks, a shared list for the people you actually split tasks
            with, without turning into a project management tool for your household.
          </p>
        </motion.div>
      </section>

      <section className={styles.pillars}>
        <div className={styles.pillarsGrid}>
          {PILLARS.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Card elevated className={styles.pillarCard}>
                <div className={styles.pillarIcon}>
                  <Icon size={18} strokeWidth={2.25} />
                </div>
                <h3 className={styles.pillarTitle}>{title}</h3>
                <p className={styles.pillarBody}>{body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className={styles.closing}>
        <motion.div
          className={styles.closingInner}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className={styles.closingTitle}>Try it for today's list</h2>
          <p className={styles.closingBody}>Free to start. No credit card, no setup.</p>
          <PrimaryButton as={Link} to="/signup" title="Get started free" variant="solid" />
        </motion.div>
      </section>

      <MarketingFooter />
    </GradientBackground>
  );
}
