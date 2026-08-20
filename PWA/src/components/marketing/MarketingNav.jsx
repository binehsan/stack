import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

import Logo from '../Logo';
import PrimaryButton from '../PrimaryButton';
import { useLanguage } from '../../context/LanguageContext';
import styles from './MarketingNav.module.css';

// Public-facing top nav for Landing/Features/About — deliberately separate
// from AppShell's authenticated topbar (different links, no logout/theme
// toggle, and it needs a collapsing mobile menu since there's no bottom
// tab bar to fall back on outside the logged-in app).
export default function MarketingNav() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const LINKS = [
    { to: '/', label: t('marketing.nav.home'), end: true },
    { to: '/features', label: t('marketing.nav.features') },
    { to: '/install', label: t('marketing.nav.install') },
    { to: '/about', label: t('marketing.nav.about') },
  ];

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand} onClick={closeMenu} aria-label={t('marketing.nav.brandLabel')}>
          <Logo size={44} />
        </Link>

        <nav className={styles.nav}>
          {LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => [styles.navLink, isActive && styles.navLinkActive].filter(Boolean).join(' ')}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <PrimaryButton as={Link} to="/login" title={t('marketing.nav.login')} variant="ghost" />
          <PrimaryButton as={Link} to="/signup" title={t('marketing.nav.getStarted')} variant="solid" />
        </div>

        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? t('marketing.nav.closeMenu') : t('marketing.nav.openMenu')}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.mobileMenu}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <nav className={styles.mobileNav}>
              {LINKS.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={closeMenu}
                  className={({ isActive }) => [styles.mobileNavLink, isActive && styles.navLinkActive].filter(Boolean).join(' ')}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className={styles.mobileActions}>
              <PrimaryButton as={Link} to="/login" title={t('marketing.nav.login')} variant="ghost" onClick={closeMenu} />
              <PrimaryButton as={Link} to="/signup" title={t('marketing.nav.getStarted')} variant="solid" onClick={closeMenu} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
