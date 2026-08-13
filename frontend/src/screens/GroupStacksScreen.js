import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import Avatar from '../components/Avatar';
import AuthTextField from '../components/AuthTextField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorBanner from '../components/ErrorBanner';
import { useTheme } from '../context/ThemeContext';
import { radii, spacing, typography } from '../theme';
import {
  createGroupStack,
  fetchGroupInvites,
  fetchMyGroupStacks,
  respondToGroupInvite,
} from '../api/groupStacks';
import { registerForPushNotificationsAsync } from '../notifications/pushRegistration';

// The "hub" for group stacks: every stack you're already in (tap to open),
// pending invites, and a form to create another one. Reachable from the
// dashboard's "+ New / Join" card and from MyStack's "Group Stacks" row —
// unlike the old single-family-stack setup screen, this isn't a one-time
// gate, since a user can belong to any number of stacks at once.
export default function GroupStacksScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const [loading, setLoading] = useState(true);
  const [stacks, setStacks] = useState([]);
  const [invites, setInvites] = useState([]);
  const [respondingId, setRespondingId] = useState(null);

  const [createName, setCreateName] = useState('');
  const [createError, setCreateError] = useState(null);
  const [creating, setCreating] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [myStacks, pending] = await Promise.all([fetchMyGroupStacks(), fetchGroupInvites()]);
      setStacks(myStacks);
      setInvites(pending);
    } catch (err) {
      console.warn('Failed to load group stacks:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleCreate() {
    const name = createName.trim();
    if (!name) {
      setCreateError('Give your group stack a name.');
      return;
    }
    setCreateError(null);
    setCreating(true);
    try {
      const stack = await createGroupStack(name);
      setStacks((prev) => [stack, ...prev]);
      setCreateName('');
      // Fire-and-forget: the first time someone has a group stack at all is
      // the natural moment to ask for push permission (not on app launch,
      // before they have any reason to want it). Never blocks navigation.
      registerForPushNotificationsAsync();
      navigation.navigate('GroupStackDetail', { stackId: stack.id, stackName: stack.name });
    } catch (err) {
      setCreateError(err.message || 'Something went wrong — try again.');
    } finally {
      setCreating(false);
    }
  }

  async function handleRespond(invite, action) {
    setRespondingId(invite.id);
    try {
      if (action === 'accept') {
        const stack = await respondToGroupInvite(invite.id, 'accept');
        setStacks((prev) => [stack, ...prev.filter((s) => s.id !== stack.id)]);
        registerForPushNotificationsAsync();
      } else {
        await respondToGroupInvite(invite.id, 'decline');
      }
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
    } catch (err) {
      console.warn('Failed to respond to invite:', err.message);
    } finally {
      setRespondingId(null);
    }
  }

  return (
    <LinearGradient
      colors={theme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={8}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Group Stacks</Text>
          <View style={styles.backButton} />
        </View>

        {loading ? (
          <ActivityIndicator color={theme.accent} style={styles.loading} />
        ) : (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
          >
            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.tagline}>ur stack, wherever u are</Text>

              {stacks.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Your stacks</Text>
                  {stacks.map((stack) => (
                    <TouchableOpacity
                      key={stack.id}
                      style={styles.stackRow}
                      onPress={() =>
                        navigation.navigate('GroupStackDetail', {
                          stackId: stack.id,
                          stackName: stack.name,
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <Avatar uri={stack.image} label={stack.name} size={40} />
                      <View style={styles.stackRowText}>
                        <Text style={styles.stackRowName}>{stack.name}</Text>
                        <Text style={styles.stackRowMeta}>
                          {stack.members.length} member{stack.members.length === 1 ? '' : 's'}
                        </Text>
                      </View>
                      <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {invites.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Pending invites</Text>
                  {invites.map((invite) => (
                    <View key={invite.id} style={styles.inviteCard}>
                      <Text style={styles.inviteCardText}>
                        <Text style={styles.inviteCardStrong}>@{invite.invited_by_username}</Text>{' '}
                        invited you to{' '}
                        <Text style={styles.inviteCardStrong}>{invite.stack_name}</Text>
                      </Text>
                      <View style={styles.inviteActions}>
                        <TouchableOpacity
                          style={styles.declineButton}
                          onPress={() => handleRespond(invite, 'decline')}
                          disabled={respondingId === invite.id}
                        >
                          <Text style={styles.declineText}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.acceptButton}
                          onPress={() => handleRespond(invite, 'accept')}
                          disabled={respondingId === invite.id}
                        >
                          <Text style={styles.acceptText}>
                            {respondingId === invite.id ? 'Joining…' : 'Accept'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {stacks.length === 0 && invites.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>👥</Text>
                  <Text style={styles.emptyTitle}>No group stacks yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Create one to share a task list with family, friends, roommates — anyone.
                    Everyone can add items and see who's on the hook.
                  </Text>
                </View>
              )}

              <View style={styles.createSection}>
                <Text style={styles.sectionLabel}>Create a new stack</Text>
                <ErrorBanner message={createError} />
                <AuthTextField
                  label="Stack name"
                  value={createName}
                  onChangeText={setCreateName}
                  placeholder="The Smiths, College Friends…"
                  returnKeyType="done"
                  onSubmitEditing={handleCreate}
                />
                <PrimaryButton title="Create group stack" onPress={handleCreate} loading={creating} />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
      <StatusBar style={theme.statusBarStyle} />
    </LinearGradient>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backText: {
      fontSize: 24,
      color: theme.text,
      fontWeight: '600',
    },
    title: {
      ...typography.title,
      color: theme.text,
    },
    loading: {
      marginTop: spacing.xl,
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    tagline: {
      ...typography.small,
      fontWeight: '400',
      color: theme.textMuted,
      marginBottom: spacing.lg,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionLabel: {
      ...typography.tiny,
      color: theme.textMuted,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    stackRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: radii.md,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    stackRowText: {
      flex: 1,
    },
    stackRowName: {
      ...typography.bodyStrong,
      color: theme.text,
    },
    stackRowMeta: {
      ...typography.small,
      fontWeight: '400',
      color: theme.textMuted,
    },
    chevron: {
      fontSize: 22,
      color: theme.textMuted,
    },
    inviteCard: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: radii.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    inviteCardText: {
      ...typography.small,
      fontWeight: '400',
      color: theme.text,
      marginBottom: spacing.sm,
    },
    inviteCardStrong: {
      fontWeight: '700',
    },
    inviteActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
    },
    declineButton: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radii.md,
    },
    declineText: {
      ...typography.small,
      color: theme.textMuted,
      fontWeight: '600',
    },
    acceptButton: {
      backgroundColor: theme.accent,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radii.md,
    },
    acceptText: {
      ...typography.small,
      color: '#fff',
      fontWeight: '700',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xl,
      gap: spacing.xs,
      marginBottom: spacing.lg,
    },
    emptyEmoji: {
      fontSize: 40,
      marginBottom: spacing.sm,
    },
    emptyTitle: {
      ...typography.bodyStrong,
      color: theme.text,
      textAlign: 'center',
    },
    emptySubtitle: {
      ...typography.small,
      fontWeight: '400',
      color: theme.textMuted,
      textAlign: 'center',
    },
    createSection: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: radii.md,
      padding: spacing.md,
    },
  });
}
