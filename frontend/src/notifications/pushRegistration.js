import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { registerPushToken } from '../api/notifications';

// Called the first time a user creates/joins a group stack — not on app
// launch, since asking for notification permission before the user has any
// reason to want one tanks opt-in rates. Silently no-ops on any failure (no
// device support, permission denied, no EAS project linked yet) since push
// is a nice-to-have that should never block the group-stack flow that
// triggered this.
export async function registerForPushNotificationsAsync() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;
    if (finalStatus !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }
    if (finalStatus !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId || projectId === 'REPLACE_WITH_YOUR_EAS_PROJECT_ID') {
      // No EAS project linked yet (see backend/README.md's push-setup
      // checklist) — nothing to register a token against until then.
      return;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerPushToken(token);
  } catch (err) {
    console.warn('Failed to register for push notifications:', err.message);
  }
}
