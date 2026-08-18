import { useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// Polls `onTick` on an interval, but only while this screen is both focused
// AND the app is foregrounded — combines the two signals HomeScreen already
// uses separately (useFocusEffect + an AppState listener) into one hook, so
// a screen using this never polls while backgrounded or navigated away
// from, whichever happens first. Meant for screens where a shared resource
// (a group stack) is more likely to change out from under you mid-session
// than a solo one — not used app-wide, since polling the most-visited
// screen (Home) would cost the most battery for the least benefit.
export function usePollingOnFocus(onTick, intervalMs = 6000) {
  // Ref, not a dependency: lets the interval always call the latest
  // `onTick` without having to tear down and restart the interval/AppState
  // listener every time the caller's callback identity changes.
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  // Guards against a slow response still being in flight when the next
  // interval tick fires, rather than cancelling/racing requests.
  const isFetchingRef = useRef(false);

  const runTick = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      await onTickRef.current();
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let intervalId = null;

      function start() {
        if (intervalId) return;
        // Tick right away, not just on the first interval — otherwise
        // whatever another member changed while this screen was
        // unfocused/backgrounded stays invisible for up to a full
        // `intervalMs` after you come back, which reads as a stuck/stale
        // copy of the group stack rather than "still polling."
        runTick();
        intervalId = setInterval(runTick, intervalMs);
      }
      function stop() {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }

      if (AppState.currentState === 'active') start();

      const subscription = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') start();
        else stop();
      });

      return () => {
        stop();
        subscription.remove();
      };
    }, [runTick, intervalMs])
  );
}
