import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';

import { uploadAvatar } from '../../api/auth';
import styles from './AvatarUpload.module.css';

// Avatar preview + upload control. `profile` is the current profile object
// (or null while loading), `email` is used as a fallback initial before the
// profile has loaded. `onUploaded` is called after a successful upload so
// the parent can refetch /auth/profile/ and pick up the new avatar URL
// (the PATCH response already includes it, but re-fetching keeps a single
// source of truth in the parent instead of this component owning profile
// state too).
export default function AvatarUpload({ profile, email, onUploaded }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      await uploadAvatar(file);
      await onUploaded?.();
    } catch (err) {
      setError(err.message || 'Failed to upload avatar.');
    } finally {
      setUploading(false);
    }
  }

  const initial = (profile?.username || email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className={styles.wrap}>
      <div className={styles.avatarShell}>
        {profile?.avatar ? (
          <img src={profile.avatar} alt="" className={styles.avatarImage} />
        ) : (
          <span className={styles.avatarFallback}>{initial}</span>
        )}
        <button
          type="button"
          className={styles.editBadge}
          onClick={() => inputRef.current?.click()}
          aria-label="Change avatar"
          disabled={uploading}
        >
          <Camera size={13} strokeWidth={2.5} />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className={styles.hiddenInput}
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>
      <div className={styles.meta}>
        <span className="text-body-strong">
          {profile?.username ? `@${profile.username}` : 'Your avatar'}
        </span>
        {uploading && <span className="text-small text-muted">Uploading…</span>}
        {error && <span className={styles.error}>{error}</span>}
      </div>
    </div>
  );
}
