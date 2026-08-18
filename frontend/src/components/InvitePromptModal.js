import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MotiView } from 'moti';
import { Users } from 'lucide-react-native';

import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';
import { fetchGroupInvites, respondToGroupInvite } from '../api/groupStacks';

// Shown when the user taps a group-invite push notification (see App.js's
// notification response listener) — lets them accept/decline right from
// the tap instead of first landing on GroupStacksScreen and finding it in
// the pending-invites list themselves. There's no single-invite GET
// endpoint on the backend, so this fetches the full pending list and picks
// out the one the notification pointed at.
export default function InvitePromptModal({ inviteId, onClose, onAccepted }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!inviteId) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setInvite(null);

    fetchGroupInvites()
      .then((invites) => {
        if (cancelled) return;
        const match = invites.find((i) => String(i.id) === String(inviteId));
        if (!match) {
          setError("This invite isn't available anymore — it may already have been answered.");
        } else {
          setInvite(match);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this invite — try again from Group Stacks.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [inviteId]);

  async function handleRespond(action) {
    if (!invite || responding) return;
    setResponding(true);
    try {
      const stack = await respondToGroupInvite(invite.id, action);
      if (action === 'accept') {
        onAccepted(stack);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Something went wrong — try again.');
      setResponding(false);
    }
  }

  return (
    <Modal visible={Boolean(inviteId)} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <MotiView
          from={{ opacity: 0, translateY: 16, scale: 0.96 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 220 }}
          style={styles.card}
        >
          <View style={styles.iconWrap}>
            <Users size={26} color={theme.accent} strokeWidth={1.75} />
          </View>

          {loading ? (
            <ActivityIndicator color={theme.accent} style={styles.loading} />
          ) : error ? (
            <>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </>
          ) : invite ? (
            <>
              <Text style={styles.headline}>
                <Text style={styles.strong}>@{invite.invited_by_username}</Text> invited you to{' '}
                <Text style={styles.strong}>{invite.stack_name}</Text>
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => handleRespond('decline')}
                  disabled={responding}
                  activeOpacity={0.7}
                >
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleRespond('accept')}
                  disabled={responding}
                  activeOpacity={0.8}
                >
                  {responding ? (
                    <ActivityIndicator size="small" color={theme.onAccent} />
                  ) : (
                    <Text style={styles.acceptText}>Accept</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </MotiView>
      </View>
    </Modal>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 380,
      alignItems: 'center',
      backgroundColor: theme.cardElevated,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: spacing.xl,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    loading: {
      marginVertical: spacing.md,
    },
    headline: {
      ...typography.body,
      color: theme.text,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    strong: {
      fontWeight: '700',
    },
    errorText: {
      ...typography.small,
      fontWeight: '400',
      color: theme.textMuted,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    closeButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    closeText: {
      ...typography.small,
      color: theme.accent,
      fontWeight: '700',
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignSelf: 'stretch',
    },
    declineButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm + 4,
      borderRadius: radii.md,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    declineText: {
      ...typography.small,
      color: theme.textMuted,
      fontWeight: '700',
    },
    acceptButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm + 4,
      borderRadius: radii.md,
      backgroundColor: theme.accent,
    },
    acceptText: {
      ...typography.small,
      color: theme.onAccent,
      fontWeight: '700',
    },
  });
}
