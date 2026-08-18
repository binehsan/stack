import { useCallback, useEffect, useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { MotiView } from 'moti';
import { ChevronLeft, Clipboard, CheckCircle2 } from 'lucide-react-native';

import GradientBackground from '../components/GradientBackground';
import Avatar from '../components/Avatar';
import AuthTextField from '../components/AuthTextField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorBanner from '../components/ErrorBanner';
import TaskInput from '../components/TaskInput';
import GroupTaskItem from '../components/GroupTaskItem';
import GroupDumpSection from '../components/GroupDumpSection';
import NudgeModal from '../components/NudgeModal';
import { useTheme } from '../context/ThemeContext';
import { usePollingOnFocus } from '../hooks/usePollingOnFocus';
import { registerForPushNotificationsAsync } from '../notifications/pushRegistration';
import { radii, spacing, typography } from '../theme';
import {
  createGroupTask,
  deleteGroupTask,
  fetchGroupStack,
  fetchGroupTasks,
  leaveGroupStack,
  nudgeGroupTask,
  sendGroupInvite,
  updateGroupStack,
  updateGroupTask,
} from '../api/groupStacks';

// How often to poll for changes made by other members while this screen is
// open — frequent enough to feel responsive for a small group, infrequent
// enough not to hammer the API from a screen someone might leave open.
const POLL_INTERVAL_MS = 6000;
// Re-fetch the stack itself (name/photo/members) only every Nth tick —
// those change far less often than the task list does.
const STACK_REFRESH_EVERY_N_TICKS = 3;

export default function GroupStackDetailScreen({ navigation, route }) {
  const { stackId, stackName } = route.params;
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const [loading, setLoading] = useState(true);
  const [stack, setStack] = useState(null);
  const [tasks, setTasks] = useState([]);

  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [inviting, setInviting] = useState(false);

  const [nudgeTask, setNudgeTask] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [stackData, taskData] = await Promise.all([
        fetchGroupStack(stackId),
        fetchGroupTasks(stackId),
      ]);
      setStack(stackData);
      setTasks(taskData);
    } catch (err) {
      console.warn('Failed to load group stack:', err.message);
    } finally {
      setLoading(false);
    }
  }, [stackId]);

  useEffect(() => {
    loadAll();
    // Every visit to a group stack is a chance to (re)register this device
    // for push — not just create/accept-invite (see GroupStacksScreen),
    // since a member who joined before that flow existed, or whose token
    // registration silently failed once, would otherwise never get nudged.
    // registerForPushNotificationsAsync no-ops instantly if already granted
    // and registered, so this is cheap to call on every mount.
    registerForPushNotificationsAsync();
  }, [loadAll]);

  const pollTickRef = useRef(0);
  usePollingOnFocus(
    useCallback(async () => {
      pollTickRef.current += 1;
      try {
        setTasks(await fetchGroupTasks(stackId));
        if (pollTickRef.current % STACK_REFRESH_EVERY_N_TICKS === 0) {
          setStack(await fetchGroupStack(stackId));
        }
      } catch (err) {
        console.warn('Failed to poll group stack:', err.message);
      }
    }, [stackId]),
    POLL_INTERVAL_MS
  );

  async function handlePickPhoto() {
    setPhotoError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoError('Allow photo access to set a stack photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;

    setPhotoUploading(true);
    try {
      const updated = await updateGroupStack(stackId, { image: result.assets[0].uri });
      setStack(updated);
    } catch (err) {
      setPhotoError(err.message || 'Failed to upload photo.');
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleInvite() {
    const username = inviteUsername.trim();
    if (!username) {
      setInviteError('Enter a username to invite.');
      return;
    }
    setInviteError(null);
    setInviteSuccess(null);
    setInviting(true);
    try {
      await sendGroupInvite(stackId, username);
      setInviteSuccess(`Invited @${username.replace(/^@/, '').toLowerCase()}`);
      setInviteUsername('');
      setTimeout(() => setInviteSuccess(null), 3000);
    } catch (err) {
      setInviteError(err.message || 'Something went wrong — try again.');
    } finally {
      setInviting(false);
    }
  }

  async function handleAddTask(text) {
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      localId: tempId,
      text,
      completed: false,
      created_by: null,
      assigned_to: null,
      created_at: new Date().toISOString(),
    };
    setTasks((prev) => [optimistic, ...prev]);
    try {
      const saved = await createGroupTask(stackId, text);
      setTasks((prev) => prev.map((t) => (t.id === tempId ? { ...saved, localId: tempId } : t)));
    } catch (err) {
      console.warn('Failed to add group task:', err.message);
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
    }
  }

  async function handleToggleTask(task) {
    const nextCompleted = !task.completed;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t)));
    try {
      await updateGroupTask(stackId, task.id, { completed: nextCompleted });
    } catch (err) {
      console.warn('Failed to update group task:', err.message);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)));
    }
  }

  async function handleDeleteTask(id) {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteGroupTask(stackId, id);
    } catch (err) {
      console.warn('Failed to delete group task:', err.message);
      setTasks(previous);
    }
  }

  async function handleNudgeSelect(username) {
    if (!nudgeTask) return;
    const taskId = nudgeTask.id;
    try {
      const updated = await nudgeGroupTask(stackId, taskId, username);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      console.warn('Failed to nudge task:', err.message);
    } finally {
      setNudgeTask(null);
    }
  }

  async function handleLeave() {
    try {
      await leaveGroupStack(stackId);
      navigation.goBack();
    } catch (err) {
      console.warn('Failed to leave group stack:', err.message);
    }
  }

  const activeTasks = tasks.filter((t) => !t.completed);
  const doneTasks = tasks.filter((t) => t.completed);

  return (
    <GradientBackground style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={8}
          >
            <ChevronLeft size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {stack ? stack.name : stackName}
          </Text>
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
            <View style={styles.body}>
              <View style={styles.photoRow}>
                <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.7} disabled={photoUploading}>
                  <MotiView
                    animate={{ opacity: photoUploading ? 0.5 : 1 }}
                    transition={{ type: 'timing', duration: 150 }}
                  >
                    <Avatar uri={stack?.image} label={stack?.name} size={56} />
                  </MotiView>
                </TouchableOpacity>
                <View style={styles.membersRow}>
                  {(stack?.members || []).map((member) => (
                    <View key={member.id} style={styles.memberChip}>
                      <Avatar uri={member.avatar} label={member.username} size={24} />
                      <Text style={styles.memberChipText}>@{member.username}</Text>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.inviteToggle}
                    onPress={() => setShowInviteForm((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.inviteToggleText}>+ Invite</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <ErrorBanner message={photoError} />

              {showInviteForm && (
                <MotiView
                  from={{ opacity: 0, translateY: -6 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 200 }}
                  style={styles.inviteForm}
                >
                  <ErrorBanner message={inviteError} />
                  {inviteSuccess && <Text style={styles.inviteSuccess}>{inviteSuccess}</Text>}
                  <View style={styles.inviteRow}>
                    <AuthTextField
                      label="Invite by @username"
                      value={inviteUsername}
                      onChangeText={setInviteUsername}
                      placeholder="username"
                      returnKeyType="done"
                      onSubmitEditing={handleInvite}
                    />
                  </View>
                  <PrimaryButton title="Send invite" onPress={handleInvite} loading={inviting} />
                </MotiView>
              )}

              <TaskInput
                onSubmit={handleAddTask}
                placeholder="Add something to the stack…"
                autoFocus={false}
              />

              <ScrollView
                style={styles.taskScroll}
                contentContainerStyle={styles.taskScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {tasks.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Clipboard size={40} color={theme.textMuted} strokeWidth={1.5} style={styles.emptyIcon} />
                    <Text style={styles.emptyTitle}>Nothing on this stack yet</Text>
                    <Text style={styles.emptySubtitle}>Add something above, or nudge it to someone.</Text>
                  </View>
                ) : activeTasks.length === 0 ? (
                  <View style={styles.emptyState}>
                    <CheckCircle2 size={40} color={theme.textMuted} strokeWidth={1.5} style={styles.emptyIcon} />
                    <Text style={styles.emptyTitle}>All done for now</Text>
                    <Text style={styles.emptySubtitle}>Everything's in the Dump below.</Text>
                  </View>
                ) : (
                  activeTasks.map((task) => (
                    <GroupTaskItem
                      key={task.localId ?? task.id}
                      task={task}
                      onToggle={handleToggleTask}
                      onDelete={handleDeleteTask}
                      onNudge={setNudgeTask}
                    />
                  ))
                )}

                <GroupDumpSection
                  tasks={doneTasks}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                  onNudge={setNudgeTask}
                />

                <TouchableOpacity style={styles.leaveButton} onPress={handleLeave} activeOpacity={0.7}>
                  <Text style={styles.leaveText}>Leave this stack</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>

      <NudgeModal
        visible={Boolean(nudgeTask)}
        task={nudgeTask}
        members={(stack?.members || []).filter((m) => m.id !== nudgeTask?.assigned_to?.id)}
        onSelect={handleNudgeSelect}
        onClose={() => setNudgeTask(null)}
      />

      <StatusBar style={theme.statusBarStyle} />
    </GradientBackground>
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
    title: {
      ...typography.title,
      color: theme.text,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: spacing.sm,
    },
    loading: {
      marginTop: spacing.xl,
    },
    body: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    photoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    membersRow: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.xs,
    },
    memberChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: radii.pill,
      paddingVertical: spacing.xs,
      paddingRight: spacing.sm,
      paddingLeft: spacing.xs / 2,
    },
    memberChipText: {
      ...typography.tiny,
      color: theme.text,
    },
    inviteToggle: {
      backgroundColor: theme.accentSoft,
      borderRadius: radii.pill,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    inviteToggleText: {
      ...typography.tiny,
      color: theme.accent,
      fontWeight: '700',
    },
    inviteForm: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: radii.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    inviteRow: {
      marginBottom: 0,
    },
    inviteSuccess: {
      ...typography.small,
      color: theme.success,
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    taskScroll: {
      flex: 1,
      marginTop: spacing.md,
    },
    taskScrollContent: {
      paddingBottom: spacing.xl,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xl,
      gap: spacing.xs,
    },
    emptyIcon: {
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
    leaveButton: {
      alignSelf: 'center',
      marginTop: spacing.lg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    leaveText: {
      ...typography.small,
      color: theme.danger,
      fontWeight: '600',
    },
  });
}
