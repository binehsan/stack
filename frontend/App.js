import { ActivityIndicator, LogBox, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';

import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import MyStackScreen from './src/screens/MyStackScreen';
import GroupStacksScreen from './src/screens/GroupStacksScreen';
import GroupStackDetailScreen from './src/screens/GroupStackDetailScreen';

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

// Three states: authenticated (full stack, including group stacks),
// guest (Home + MyStack only — group stacks/stats/sync all need a real
// account), or neither (Login/Register). Swapping the whole navigator
// (rather than guarding routes individually) keeps the auth boundary in
// one obvious place.
function RootNavigator() {
  const { isReady, isAuthenticated, isGuest } = useAuth();
  const { theme } = useTheme();

  if (!isReady) {
    return (
      <LinearGradient colors={theme.gradient} style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.accent} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <Stack.Navigator
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
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="MyStack" component={MyStackScreen} />
          <Stack.Screen name="GroupStacks" component={GroupStacksScreen} />
          <Stack.Screen name="GroupStackDetail" component={GroupStackDetailScreen} />
        </>
      ) : isGuest ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="MyStack" component={MyStackScreen} />
          {/* Reachable from MyStack's sign-up CTA — registering/logging in
              flips isAuthenticated, which swaps this whole navigator out
              from under these screens (see the ternary above), so there's
              no explicit "exit guest mode" navigation needed here. */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
