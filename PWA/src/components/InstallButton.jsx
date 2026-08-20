import { Link, useNavigate } from 'react-router-dom';

import PrimaryButton from './PrimaryButton';
import { useInstallPrompt } from '../pwa/useInstallPrompt';
import { useLanguage } from '../context/LanguageContext';

// One button, three behaviors depending on what the platform actually
// allows: a real one-click native install on Chrome/Edge/Android (once
// `beforeinstallprompt` has fired), a jump to the guided Share-sheet steps
// on iOS (which has no programmatic install API at all), or a plain link to
// the full instructions everywhere else (Firefox, or Chrome before its own
// engagement heuristic has fired yet). Renders nothing once already
// installed — see useInstallPrompt.
export default function InstallButton({ variant = 'solid', iosScrollTargetId, className }) {
  const { canPromptInstall, isIOS, installed, promptInstall } = useInstallPrompt();
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (installed) return null;

  if (canPromptInstall) {
    return (
      <PrimaryButton
        variant={variant}
        title={t('common.installButton.installStack')}
        onClick={promptInstall}
        className={className}
      />
    );
  }

  if (isIOS) {
    function handleIOSClick() {
      if (iosScrollTargetId) {
        document.getElementById(iosScrollTargetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        navigate('/install');
      }
    }
    return (
      <PrimaryButton
        variant={variant}
        title={t('common.installButton.addToHomeScreen')}
        onClick={handleIOSClick}
        className={className}
      />
    );
  }

  return (
    <PrimaryButton
      as={Link}
      to="/install"
      variant={variant === 'solid' ? 'ghost' : variant}
      title={t('common.installButton.howToInstall')}
      className={className}
    />
  );
}
