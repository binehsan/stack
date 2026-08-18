import { motion } from 'framer-motion';

import GradientBackground from '../components/GradientBackground';
import Card from '../components/Card';
import MarketingNav from '../components/marketing/MarketingNav';
import MarketingFooter from '../components/marketing/MarketingFooter';
import styles from './Legal.module.css';

const LAST_UPDATED = 'August 18, 2026';
const CONTACT_EMAIL = 'amenbinehsan@gmail.com';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function Privacy() {
  return (
    <GradientBackground>
      <MarketingNav />

      <section className={styles.wrap}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.4 }}
        >
          <Card elevated className={styles.card}>
            <p className="text-tiny text-accent">Legal</p>
            <h1 className={styles.title}>Privacy Policy</h1>
            <p className={`text-small text-muted ${styles.updated}`}>Last updated {LAST_UPDATED}</p>

            <div className={styles.body}>
              <p>
                Stack is built by one person (see the About page), not a company with a legal
                team, so this is written in plain language on purpose — no filler, nothing here
                that isn&rsquo;t actually true of how the app works.
              </p>

              <h2>What Stack collects</h2>
              <ul>
                <li>
                  <strong>Account info</strong> — the email you sign up with, a password (stored
                  as an irreversible hash, never in plain text, never visible to anyone including
                  us), and a username (chosen or auto-generated from your email).
                </li>
                <li>
                  <strong>Content you add</strong> — your tasks, Group Stack names and shared
                  tasks, and an avatar photo if you choose to upload one.
                </li>
                <li>
                  <strong>Device/notification identifiers</strong> — if you turn on push
                  notifications, your browser or the mobile app registers a token/subscription
                  with us so we know where to deliver an invite or nudge notification. This
                  identifies a device, not you personally, and only exists to make notifications
                  work.
                </li>
                <li>
                  <strong>Basic technical data</strong> — your IP address is visible to our server
                  the same way it is for any website you visit (used for rate-limiting abusive
                  login attempts, nothing else), and if error monitoring is enabled, crash reports
                  may include your browser type and the page you were on when something broke —
                  never your password or task content.
                </li>
              </ul>

              <h2>What Stack does <em>not</em> do</h2>
              <ul>
                <li>No advertising, no ad networks, no selling or renting your data to anyone, ever.</li>
                <li>No tracking you across other websites or apps.</li>
                <li>
                  Voice input is processed by your own browser or device&rsquo;s built-in speech
                  recognition (not a service Stack operates or pays for). Depending on your
                  browser, that recognition may happen entirely on-device, or via your browser
                  vendor&rsquo;s own cloud service (e.g. Google&rsquo;s, for Chrome) — either way,
                  Stack itself never receives or stores your voice audio, only the transcribed
                  text you see appear in the task box, and only once you actually submit it as a
                  task.
                </li>
              </ul>

              <h2>Where your data lives</h2>
              <p>
                Stack&rsquo;s database and file storage run on a server we operate directly (not
                handed off to a third-party data warehouse). If you enable push notifications,
                delivering that notification necessarily involves your browser vendor&rsquo;s own
                push relay service (Google, Mozilla, or Apple, depending on your browser) — they
                see an encrypted payload and the device token, not your account details.
              </p>

              <h2>Your rights</h2>
              <p>
                You can change or delete your account content at any time from inside the app.
                Deleting your account (Settings → Account → the delete option) permanently and
                immediately removes your tasks, Group Stack memberships, avatar, and account
                record — this isn&rsquo;t a soft-delete, it&rsquo;s gone. If you&rsquo;d like a
                copy of your data before deleting, or have any other question about what&rsquo;s
                held about you, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and
                we&rsquo;ll sort it out directly — no ticket system, no runaround.
              </p>
              <p>
                If you&rsquo;re in the UK or EU, you have the rights GDPR guarantees you (access,
                correction, erasure, restriction, portability, objection), and the right to
                complain to your local data protection authority if you think we&rsquo;ve gotten
                something wrong — we&rsquo;d genuinely rather you email us first, since anything
                raised that way gets fixed directly.
              </p>

              <h2>Cookies and local storage</h2>
              <p>
                Stack doesn&rsquo;t use tracking or advertising cookies. Your login session is
                kept in your browser&rsquo;s local storage (not a cookie), scoped only to
                Stack&rsquo;s own site — nothing here is shared with or readable by any other
                website. A theme preference and a couple of small UI flags (like whether
                you&rsquo;ve already seen today&rsquo;s recap) are stored the same way, purely to
                remember your settings between visits.
              </p>

              <h2>Children</h2>
              <p>
                Stack isn&rsquo;t directed at children, and we don&rsquo;t knowingly collect
                information from anyone under 13. If you believe a child has created an account,
                email us and we&rsquo;ll remove it.
              </p>

              <h2>Changes to this policy</h2>
              <p>
                If this ever changes in a way that matters, the &ldquo;last updated&rdquo; date at
                the top will change with it. For a project this size, that&rsquo;s realistically
                going to be rare.
              </p>

              <h2>Contact</h2>
              <p>
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> — goes directly to the
                person who built and runs Stack.
              </p>
            </div>
          </Card>
        </motion.div>
      </section>

      <MarketingFooter />
    </GradientBackground>
  );
}
