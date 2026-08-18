import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutList, Users, Settings as SettingsIcon, Moon, Sun, SunMoon, LogOut } from 'lucide-react';

import Logo from './Logo';
import GradientBackground from './GradientBackground';
import PermissionsPrompt from './PermissionsPrompt';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import styles from './AppShell.module.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'My Stack', icon: LayoutList },
  { to: '/stacks', label: 'Group Stacks', icon: Users },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

// Shared authenticated-area layout — Dashboard, Group Stacks, and Settings
// all render inside this so nav/theme-toggle/logout live in exactly one
// place instead of being reimplemented per page. Every signed-in visitor
// gets full access; the app has no paid tier.
export default function AppShell({ children }) {
  const { toggleTheme, themeName, isSystemTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <GradientBackground className={styles.shell}>
      <header className={styles.topbar}>
        <NavLink to="/dashboard" className={styles.brand} aria-label="Stack home">
          <Logo size={32} />
        </NavLink>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => [styles.navLink, isActive && styles.navLinkActive].filter(Boolean).join(' ')}
            >
              <Icon size={17} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <button type="button" className={styles.iconButton} onClick={toggleTheme} aria-label="Toggle theme">
            {isSystemTheme ? <SunMoon size={17} /> : themeName === 'dawn' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button type="button" className={styles.iconButton} onClick={handleLogout} aria-label="Log out">
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <nav className={styles.mobileNav}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => [styles.mobileNavLink, isActive && styles.navLinkActive].filter(Boolean).join(' ')}
          >
            <Icon size={20} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <main className={styles.main}>{children}</main>

      <PermissionsPrompt />
    </GradientBackground>
  );
}
