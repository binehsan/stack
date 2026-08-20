import { motion } from 'framer-motion';

import { useLanguage } from '../context/LanguageContext';
import GradientBackground from '../components/GradientBackground';
import Card from '../components/Card';
import MarketingNav from '../components/marketing/MarketingNav';
import MarketingFooter from '../components/marketing/MarketingFooter';
import styles from './Legal.module.css';

const LAST_UPDATED = 'August 18, 2026';
const CONTACT_EMAIL = 'stack@hellosyntax.dev';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function Privacy() {
  const { t } = useLanguage();
  const emailLink = (
    <a href={`mailto:${CONTACT_EMAIL}`} dir="ltr">
      {CONTACT_EMAIL}
    </a>
  );

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
            <p className="text-tiny text-accent">{t('common.privacy.eyebrow')}</p>
            <h1 className={styles.title}>{t('common.privacy.title')}</h1>
            <p className={`text-small text-muted ${styles.updated}`}>
              {t('common.privacy.updated', { date: LAST_UPDATED })}
            </p>

            <div className={styles.body}>
              <p>{t('common.privacy.intro')}</p>

              <h2>{t('common.privacy.collectsHeading')}</h2>
              <ul>
                <li>
                  <strong>{t('common.privacy.collectsAccountLabel')}</strong>
                  {t('common.privacy.collectsAccountBody')}
                </li>
                <li>
                  <strong>{t('common.privacy.collectsContentLabel')}</strong>
                  {t('common.privacy.collectsContentBody')}
                </li>
                <li>
                  <strong>{t('common.privacy.collectsDeviceLabel')}</strong>
                  {t('common.privacy.collectsDeviceBody')}
                </li>
                <li>
                  <strong>{t('common.privacy.collectsTechLabel')}</strong>
                  {t('common.privacy.collectsTechBody')}
                </li>
              </ul>

              <h2>{t('common.privacy.notHeading')}</h2>
              <ul>
                <li>{t('common.privacy.notAd')}</li>
                <li>{t('common.privacy.notTracking')}</li>
                <li>{t('common.privacy.notVoice')}</li>
              </ul>

              <h2>{t('common.privacy.whereHeading')}</h2>
              <p>{t('common.privacy.whereBody')}</p>

              <h2>{t('common.privacy.rightsHeading')}</h2>
              <p>
                {(() => {
                  const [before, after] = t('common.privacy.rightsBody1').split('{{email}}');
                  return (
                    <>
                      {before}
                      {emailLink}
                      {after}
                    </>
                  );
                })()}
              </p>
              <p>{t('common.privacy.rightsBody2')}</p>

              <h2>{t('common.privacy.cookiesHeading')}</h2>
              <p>{t('common.privacy.cookiesBody')}</p>

              <h2>{t('common.privacy.childrenHeading')}</h2>
              <p>{t('common.privacy.childrenBody')}</p>

              <h2>{t('common.privacy.changesHeading')}</h2>
              <p>{t('common.privacy.changesBody')}</p>

              <h2>{t('common.privacy.contactHeading')}</h2>
              <p>
                {emailLink}
                {t('common.privacy.contactBody')}
              </p>
            </div>
          </Card>
        </motion.div>
      </section>

      <MarketingFooter />
    </GradientBackground>
  );
}
