import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
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
import { useFocusEffect } from '@react-navigation/native';
import { NestableScrollContainer } from 'react-native-draggable-flatlist';
import * as SecureStore from 'expo-secure-store';
import { MotiView } from 'moti';
import { RefreshCw, Moon, Sun, SunMoon, User, X, CheckCircle2, Plus } from 'lucide-react-native';

import GradientBackground from '../components/GradientBackground';
import Logo from '../components/Logo';
import TaskInput from '../components/TaskInput';
import TaskList from '../components/TaskList';
import FocusSection from '../components/FocusSection';
import DumpSection from '../components/DumpSection';
import CarryForwardModal from '../components/CarryForwardModal';
import RecapModal from '../components/RecapModal';
import Avatar from '../components/Avatar';
import GuestCTABanner from '../components/GuestCTABanner';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { radii, spacing, typography } from '../theme';
import * as accountTasksApi from '../api/tasks';
import * as localTasksApi from '../api/localTasks';
import { fetchCarryForwardCandidates, fetchRecap, submitCarryForward } from '../api/tasks';
import { fetchProfile } from '../api/auth';
import { fetchMyGroupStacks } from '../api/groupStacks';

const RECAP_SHOWN_KEY = 'stack_recap_shown_date';
const MAX_FOCUS_STARS = 3;
// How long a freshly-completed task lingers in the active list (showing its
// strike-through) before sliding into the Dump. Matches TaskItem's 320ms
// strike-through duration so the swoosh into the Dump starts right as the
// strike finishes drawing, instead of sitting idle for an extra beat.
const DUMP_DELAY_MS = 320;

export default function HomeScreen({ navigation }) {
  const { theme, toggleTheme, themeName, isSystemTheme } = useTheme();
  const { isAuthenticated, importedTaskCount, clearImportedTaskCount } = useAuth();
  const styles = makeStyles(theme);

  // Guest mode reads/writes tasks entirely on-device instead of hitting the
  // backend — same function signatures on both sides, so every handler
  // below (optimistic-update logic included) works unmodified either way.
  const tasksApi = isAuthenticated ? accountTasksApi : localTasksApi;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groupStacks, setGroupStacks] = useState([]);
  // Just for the header's account button — shows the user's real avatar
  // instead of a generic person icon once it's loaded.
  const [profile, setProfile] = useState(null);
  const [justCompletedIds, setJustCompletedIds] = useState(() => new Set());
  const dumpTimers = useRef({});
  const isFirstFocus = useRef(true);

  const [recap, setRecap] = useState(null);
  const [showRecap, setShowRecap] = useState(false);
  const [carryCandidates, setCarryCandidates] = useState([]);
  const [showCarryForward, setShowCarryForward] = useState(false);

  useEffect(() => {
    tasksApi
      .fetchTasks()
      .then(setTasks)
      .catch((err) => console.warn('Failed to load tasks:', err.message))
      .finally(() => setLoading(false));

    // Group stacks, recap, and carry-forward are all account-only features
    // — a guest has no server-side history for any of them to draw from.
    if (isAuthenticated) {
      fetchMyGroupStacks()
        .then(setGroupStacks)
        .catch(() => {});
      fetchProfile()
        .then(setProfile)
        .catch(() => {});

      loadDailyPrompts();
    }

    const timers = dumpTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Cross-device sync: pull fresh state whenever this screen regains focus
  // (e.g. coming back from myStack/a group stack) or the app returns to the
  // foreground — catches changes made from another device in the meantime
  // without needing a persistent connection.
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      tasksApi.fetchTasks().then(setTasks).catch((err) => console.warn('Failed to refresh tasks:', err.message));
      if (isAuthenticated) {
        fetchMyGroupStacks()
          .then(setGroupStacks)
          .catch(() => {});
        fetchProfile()
          .then(setProfile)
          .catch(() => {});
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        tasksApi.fetchTasks().then(setTasks).catch((err) => console.warn('Failed to refresh tasks:', err.message));
      }
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      setTasks(await tasksApi.fetchTasks());
    } catch (err) {
      console.warn('Failed to refresh:', err.message);
    } finally {
      setRefreshing(false);
    }
  }

  const loadCarryForward = useCallback(async () => {
    try {
      const candidates = await fetchCarryForwardCandidates();
      if (candidates.length > 0) {
        setCarryCandidates(candidates);
        setShowCarryForward(true);
      }
    } catch (err) {
      console.warn('Failed to load carry-forward candidates:', err.message);
    }
  }, []);

  const loadDailyPrompts = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const lastShown = await SecureStore.getItemAsync(RECAP_SHOWN_KEY);
    let recapShown = false;

    if (lastShown !== today) {
      await SecureStore.setItemAsync(RECAP_SHOWN_KEY, today);
      try {
        const data = await fetchRecap();
        if (data) {
          setRecap(data);
          setShowRecap(true);
          recapShown = true;
        }
      } catch (err) {
        console.warn('Failed to load recap:', err.message);
      }
    }

    // Recap and carry-forward both compete for the user's attention on the
    // first open of a new day — show recap first, then the prompt, rather
    // than stacking two modals at once.
    if (!recapShown) {
      loadCarryForward();
    }
  }, [loadCarryForward]);

  function handleRecapClose() {
    setShowRecap(false);
    loadCarryForward();
  }

  async function handleCarryForwardSubmit(ids) {
    setShowCarryForward(false);
    if (ids.length === 0) return;
    try {
      const created = await submitCarryForward(ids);
      setTasks((prev) => [...created, ...prev]);
    } catch (err) {
      console.warn('Failed to carry tasks forward:', err.message);
    }
  }

  // Optimistic UI throughout: every action updates local state immediately,
  // then syncs to the backend in background, rolling back on failure.

  async function handleAdd(text) {
    const tempId = `temp-${Date.now()}`;
    const optimisticTask = {
      id: tempId,
      // Stays constant across the optimistic->real swap below, unlike `id`.
      // TaskList keys rows on this so the row keeps its React identity (and
      // doesn't replay its entrance animation) once the server responds.
      localId: tempId,
      text,
      completed: false,
      starred: false,
      created_at: new Date().toISOString(),
    };
    setTasks((prev) => [optimisticTask, ...prev]);

    try {
      const saved = await tasksApi.createTask(text);
      setTasks((prev) => prev.map((t) => (t.id === tempId ? { ...saved, localId: tempId } : t)));
    } catch (err) {
      console.warn('Failed to add task:', err.message);
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
    }
  }

  function clearDumpTimer(id) {
    if (dumpTimers.current[id]) {
      clearTimeout(dumpTimers.current[id]);
      delete dumpTimers.current[id];
    }
  }

  async function handleToggle(task) {
    const nextCompleted = !task.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t))
    );

    clearDumpTimer(task.id);
    if (nextCompleted) {
      // Stay visible in the active list just long enough to show the
      // strike-through animation, then drop into the Dump.
      setJustCompletedIds((prev) => new Set(prev).add(task.id));
      dumpTimers.current[task.id] = setTimeout(() => {
        setJustCompletedIds((prev) => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
        delete dumpTimers.current[task.id];
      }, DUMP_DELAY_MS);
    } else {
      // Un-completing from the Dump — reappear in the active list immediately.
      setJustCompletedIds((prev) => {
        if (!prev.has(task.id)) return prev;
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }

    try {
      await tasksApi.updateTask(task.id, { completed: nextCompleted });
    } catch (err) {
      console.warn('Failed to update task:', err.message);
      clearDumpTimer(task.id);
      setJustCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t))
      );
    }
  }

  async function handleToggleStar(task) {
    const nextStarred = !task.starred;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, starred: nextStarred } : t))
    );

    try {
      await tasksApi.updateTask(task.id, { starred: nextStarred });
    } catch (err) {
      console.warn('Failed to update focus star:', err.message);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, starred: task.starred } : t))
      );
    }
  }

  async function handleDelete(id) {
    const previousTasks = tasks;
    clearDumpTimer(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await tasksApi.deleteTask(id);
    } catch (err) {
      console.warn('Failed to delete task:', err.message);
      setTasks(previousTasks);
    }
  }

  async function handleReorder(orderedIds) {
    setTasks((prev) => {
      const byId = new Map(prev.map((t) => [String(t.id), t]));
      const reorderedActive = orderedIds.map((id) => byId.get(String(id))).filter(Boolean);
      const reorderedIdSet = new Set(orderedIds.map(String));
      const rest = prev.filter((t) => !reorderedIdSet.has(String(t.id)));
      return [...reorderedActive, ...rest];
    });

    try {
      await tasksApi.reorderTasks(orderedIds);
    } catch (err) {
      console.warn('Failed to save new order:', err.message);
    }
  }

  // Memoized so an unrelated re-render (e.g. the refresh-icon spin, which is
  // just local `refreshing` state) doesn't hand the draggable list a fresh
  // array reference every time — react-native-draggable-flatlist treats a
  // new `data` reference as "this may have changed" and re-diffs, which
  // adds up as a list grows. Recomputes only when the inputs actually do.
  const starredCount = useMemo(() => tasks.filter((t) => t.starred).length, [tasks]);
  const activeTasks = useMemo(
    () => tasks.filter((t) => !t.completed || justCompletedIds.has(t.id)),
    [tasks, justCompletedIds]
  );
  const doneTasks = useMemo(
    () => tasks.filter((t) => t.completed && !justCompletedIds.has(t.id)),
    [tasks, justCompletedIds]
  );
  const starProps = { onToggleStar: handleToggleStar, starDisabled: starredCount >= MAX_FOCUS_STARS };

  return (
    <GradientBackground style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        >
          <View style={styles.container}>
            <View style={styles.headerRow}>
              <Logo size={36} />
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleRefresh}
                  disabled={refreshing}
                  hitSlop={8}
                >
                  <MotiView
                    animate={{ rotate: refreshing ? '360deg' : '0deg' }}
                    transition={
                      refreshing
                        ? { type: 'timing', duration: 700, loop: true, repeatReverse: false }
                        : { type: 'timing', duration: 0 }
                    }
                  >
                    <RefreshCw size={16} color={theme.text} />
                  </MotiView>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={toggleTheme} hitSlop={8}>
                  {/* Shows which mode is active, not which one a tap leads
                      to — with three stops (system → dawn → dusk → …) a
                      "destination" icon stops being obviously readable at
                      a glance the way it was for a plain two-way toggle. */}
                  {isSystemTheme ? (
                    <SunMoon size={16} color={theme.text} />
                  ) : themeName === 'dawn' ? (
                    <Sun size={16} color={theme.text} />
                  ) : (
                    <Moon size={16} color={theme.text} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => navigation.navigate('MyStack')}
                  hitSlop={8}
                >
                  {profile ? (
                    <Avatar uri={profile.avatar} label={profile.username} size={30} />
                  ) : (
                    <User size={16} color={theme.text} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {importedTaskCount !== null && (
              <MotiView
                from={{ opacity: 0, translateY: -6 }}
                animate={{ opacity: 1, translateY: 0 }}
                style={styles.importBanner}
              >
                <View style={styles.importBannerTextRow}>
                  <CheckCircle2 size={14} color={theme.success} />
                  <Text style={styles.importBannerText}>
                    {importedTaskCount} task{importedTaskCount === 1 ? '' : 's'} imported from
                    guest mode
                  </Text>
                </View>
                <TouchableOpacity onPress={clearImportedTaskCount} hitSlop={8}>
                  <X size={16} color={theme.success} />
                </TouchableOpacity>
              </MotiView>
            )}

            {!isAuthenticated && (
              <GuestCTABanner onPress={() => navigation.navigate('Register')} />
            )}

            {isAuthenticated && (
            <View style={styles.stacksSection}>
              <Text style={styles.stacksLabel}>Your Group Stacks</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stacksRow}
              >
                {groupStacks.map((stack) => (
                  <TouchableOpacity
                    key={stack.id}
                    style={styles.stackCard}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation.navigate('GroupStackDetail', {
                        stackId: stack.id,
                        stackName: stack.name,
                      })
                    }
                  >
                    <Avatar uri={stack.image} label={stack.name} size={52} />
                    <Text style={styles.stackCardName} numberOfLines={1}>
                      {stack.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.stackCard}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('GroupStacks')}
                >
                  <View style={styles.stackAddCircle}>
                    <Plus size={22} color={theme.accent} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.stackCardName} numberOfLines={1}>
                    {groupStacks.length > 0 ? 'New' : 'Start one'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
            )}

            {isAuthenticated && <View style={styles.divider} />}

            <TaskInput onSubmit={handleAdd} />

            <View style={styles.listArea}>
              {!loading && (
                <NestableScrollContainer
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <FocusSection tasks={tasks} onToggle={handleToggle} />
                  <TaskList
                    tasks={activeTasks}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onReorder={handleReorder}
                    {...starProps}
                    EmptyIcon={doneTasks.length > 0 ? CheckCircle2 : Sun}
                    emptyTitle={doneTasks.length > 0 ? 'All done for today' : undefined}
                    emptySubtitle={
                      doneTasks.length > 0
                        ? 'Everything you added is in the Dump below.'
                        : undefined
                    }
                  />
                  <DumpSection
                    tasks={doneTasks}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    {...starProps}
                  />
                </NestableScrollContainer>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <RecapModal visible={showRecap} recap={recap} onClose={handleRecapClose} />
      <CarryForwardModal
        visible={showCarryForward}
        candidates={carryCandidates}
        onSubmit={handleCarryForwardSubmit}
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
    container: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    headerActions: {
      flexDirection: 'row',
      gap: spacing.xs,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: radii.pill,
      padding: spacing.xs,
    },
    iconButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    importBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.success + '1A',
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: radii.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    importBannerTextRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flex: 1,
    },
    importBannerText: {
      ...typography.small,
      fontWeight: '600',
      color: theme.success,
      flex: 1,
    },
    divider: {
      height: 1,
      backgroundColor: theme.cardBorder,
      marginBottom: spacing.lg,
    },
    stacksSection: {
      marginBottom: spacing.lg,
    },
    stacksLabel: {
      ...typography.tiny,
      color: theme.textMuted,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    stacksRow: {
      gap: spacing.md,
      paddingRight: spacing.sm,
    },
    stackCard: {
      alignItems: 'center',
      width: 68,
      gap: spacing.xs,
    },
    stackCardName: {
      ...typography.tiny,
      color: theme.text,
      fontWeight: '600',
    },
    stackAddCircle: {
      width: 52,
      height: 52,
      borderRadius: radii.pill,
      borderWidth: 1.5,
      borderColor: theme.cardBorder,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.card,
    },
    listArea: {
      flex: 1,
      // Clips a dragged card to the scroll area's bounds — without this,
      // a card mid-drag (elevated above everything else, unclamped by the
      // drag library) can render past the top/bottom of the list, over the
      // header or Dump section, instead of staying inside its own list.
      overflow: 'hidden',
      // The negative margin + matching padding cancel out for child layout
      // (cards end up the same width as before), but they push the actual
      // clip boundary a few px further out than the cards' own edges — so
      // a dragging card's highlight border/shadow has room to render
      // without being clipped by the overflow:hidden above.
      marginHorizontal: -6,
      paddingHorizontal: 6,
    },
    scrollContent: {
      flexGrow: 1,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
    },
  });
}
