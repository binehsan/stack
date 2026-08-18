import QRCode from 'react-qr-code';
import { Smartphone } from 'lucide-react';

import { MOBILE_APP_LINK } from '../config';
import styles from './GetTheAppCard.module.css';

// Reusable "get the free mobile app" unit: a QR code (scannable link,
// destination controlled by MOBILE_APP_LINK in src/config.js) plus the same
// link as visible text for anyone reading on the device they'd tap it from.
// The QR code itself always renders in fixed white/near-black regardless of
// the active theme, since scannability requires strong contrast a themed
// palette can't guarantee at every accent color, everything AROUND it
// (card, border, text) follows the site theme normally.
export default function GetTheAppCard({ compact = false }) {
  const size = compact ? 72 : 128;

  return (
    <div className={[styles.wrap, compact && styles.compact].filter(Boolean).join(' ')}>
      <div className={styles.qrTile} style={{ width: size + 16, height: size + 16 }}>
        <QRCode value={MOBILE_APP_LINK} size={size} fgColor="#1A1A1A" bgColor="#FFFFFF" />
      </div>
      <div className={styles.textCol}>
        <div className={styles.label}>
          <Smartphone size={compact ? 14 : 16} strokeWidth={2.25} />
          <span>Scan to get the free app</span>
        </div>
        <a href={MOBILE_APP_LINK} className={styles.link}>
          {MOBILE_APP_LINK.replace(/^https?:\/\//, '')}
        </a>
      </div>
    </div>
  );
}
