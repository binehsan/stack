import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';

import GradientBackground from './src/components/GradientBackground';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import MyStackScreen from './src/screens/MyStackScreen';
import GroupStacksScreen from './src/screens/GroupStacksScreen';
import GroupStackDetailScreen from './src/screens/GroupStackDetailScreen';
import InvitePromptModal from './src/components/InvitePromptModal';

// `moti`'s package entry re-exports an internal MotiSafeAreaView helper that
// imports React Native's own deprecated SafeAreaView purely to wrap it —
// just importing MotiView (which we use throughout) loads that file and
// trips RN's one-time deprecation warning. Our own code already uses
// react-native-safe-area-context exclusively; this is upstream noise.
LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);

// Without this, a push notification that arrives while the app is open
// doesn't show anything by default — this makes a nudge visible immediately
// instead of only appearing in the OS notification center after the fact.
// Must run at module scope (not inside a component) per expo-notifications.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const Stack = createNativeStackNavigator();

function authBranchOf(isAuthenticated, isGuest) {
  return isAuthenticated ? 'auth' : isGuest ? 'guest' : 'anon';
}

// A SINGLE, unconditional route table — every screen is always registered,
// for every auth state. This used to conditionally render a different set
// of <Stack.Screen> children per auth branch (plus, at one point, a `key`
// to force a remount when the branch changed). Both approaches depended on
// React Navigation's remount/reconciliation timing lining up with an
// imperative reset call, and in practice it didn't reliably: Login/Register
// exist in more than one branch, so the navigator could end up treating
// them as "the same" route across a swap and never actually land on the
// newly-available Home — tapping "Continue without account" flipped
// `isGuest` but the visible screen just sat on Login.
//
// With a static table there's nothing to race: "Home" and "Login" are
// always valid route names from the very first render onward, so
// `resetRoot` below can never target a route that isn't registered yet.
// Screens that are meaningless outside a given auth state (GroupStacks*
// need a real account) are simply never navigated to from the UI in that
// state — same as before — they just don't need to be conditionally
// present in the table to enforce that.
function RootNavigator({ navigationRef }) {
  const { isReady, isAuthenticated, isGuest } = useAuth();
  const { theme } = useTheme();
  const authBranch = authBranchOf(isAuthenticated, isGuest);

  // Group-invite notification tap -> a popup to accept/decline right here,
  // rather than dropping the user onto GroupStacksScreen to hunt for it in
  // the pending-invites list. Nudge notification tap -> straight to that
  // task's group stack. Both read the `data` payload family/push.py already
  // attaches to every push it sends (see family/views.py's two
  // send_expo_push calls).
  const [pendingInviteId, setPendingInviteId] = useState(null);

  useEffect(() => {
    if (!isReady) return undefined;

    function handleResponse(response) {
      const data = response?.notification?.request?.content?.data || {};
      if (data.inviteId) {
        setPendingInviteId(String(data.inviteId));
      } else if (data.stackId) {
        navigationRef.current?.navigate('GroupStackDetail', {
          stackId: data.stackId,
          stackName: data.stackName || '',
        });
      }
    }

    // Cold start: the app was launched BY tapping the notification, not
    // just brought to the foreground — the live listener below was never
    // running yet when that tap happened, so it alone would miss this case.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => subscription.remove();
  }, [isReady, navigationRef]);

  // null until the first time `isReady` flips true, so this effect skips
  // that initial hydration entirely — `initialRouteName` below already
  // matches the persisted auth state on that first real render, so an
  // extra resetRoot() right after mount would just be a redundant, visible
  // flash. Every run *after* that first one is a genuine auth change
  // (login, logout, guest toggle) and should force the active screen.
  const previousBranchRef = useRef(null);
  useEffect(() => {
    if (!isReady) return;
    if (previousBranchRef.current === null) {
      previousBranchRef.current = authBranch;
      return;
    }
    if (previousBranchRef.current === authBranch) return;
    previousBranchRef.current = authBranch;
    const target = authBranch === 'anon' ? 'Login' : 'Home';
    navigationRef.current?.resetRoot({ index: 0, routes: [{ name: target }] });
  }, [authBranch, isReady, navigationRef]);

  if (!isReady) {
    return (
      <GradientBackground style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.accent} />
        </View>
      </GradientBackground>
    );
  }

  return (
    <>
      <Stack.Navigator
        initialRouteName={authBranch === 'anon' ? 'Login' : 'Home'}
        screenOptions={{
          headerShown: false,
          // Native-stack's default screen background is opaque white, so the
          // transition between two gradient screens shows a white flash at the
          // edges before each screen's own gradient paints. Matching it to the
          // current theme's base color makes the transition seamless.
          contentStyle: { backgroundColor: theme.gradient[0] },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MyStack" component={MyStackScreen} />
        <Stack.Screen name="GroupStacks" component={GroupStacksScreen} />
        <Stack.Screen name="GroupStackDetail" component={GroupStackDetailScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
      <InvitePromptModal
        inviteId={pendingInviteId}
        onClose={() => setPendingInviteId(null)}
        onAccepted={(stack) => {
          setPendingInviteId(null);
          navigationRef.current?.navigate('GroupStackDetail', { stackId: stack.id, stackName: stack.name });
        }}
      />
    </>
  );
}

export default function App() {
  const navigationRef = useNavigationContainerRef();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <NavigationContainer ref={navigationRef}>
              <RootNavigator navigationRef={navigationRef} />
            </NavigationContainer>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
