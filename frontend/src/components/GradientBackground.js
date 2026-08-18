import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

import { useTheme } from '../context/ThemeContext';

const TRANSITION_MS = 450;

// Every screen's backdrop. Three layers:
//   1. base — always the CURRENT theme's gradient, drawn instantly (never
//      itself animated, so there's zero lag between the theme actually
//      changing and the right colors being on screen).
//   2. a transient "ghost" of the PREVIOUS theme's gradient, full-opacity,
//      fading to transparent on top of the base — this is the whole
//      trick: since the correct new background is already there
//      underneath from frame one, dissolving the old snapshot away reads
//      as a smooth crossfade rather than a hard cut. Unmounts itself once
//      the fade finishes.
//   3. the drift layer — an oversized copy of the CURRENT gradient that
//      settles into a slightly offset position once on mount (see below).
//
// Switching themes (manual toggle, or the OS setting changing under
// 'system' preference) swaps `theme.gradient` outright, which would
// otherwise be an instant, jarring cut — that's what layer 2 is for.
export default function GradientBackground({ style, children }) {
  const { theme } = useTheme();
  const prevGradientRef = useRef(theme.gradient);
  const outgoingKeyRef = useRef(0);
  const [outgoing, setOutgoing] = useState(null);

  useEffect(() => {
    if (theme.gradient === prevGradientRef.current) return;
    const oldGradient = prevGradientRef.current;
    prevGradientRef.current = theme.gradient;
    const key = ++outgoingKeyRef.current;
    setOutgoing({ colors: oldGradient, key });

    const timer = setTimeout(() => {
      setOutgoing((current) => (current?.key === key ? null : current));
    }, TRANSITION_MS + 50);
    return () => clearTimeout(timer);
  }, [theme.gradient]);

  return (
    <View style={[styles.fill, style]}>
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {outgoing && (
        <MotiView
          key={outgoing.key}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          from={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ type: 'timing', duration: TRANSITION_MS }}
        >
          <LinearGradient
            colors={outgoing.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </MotiView>
      )}

      {/* Deliberately not a flipped/rotated duplicate of the base gradient:
          two differently-angled copies of the same 3-stop palette cross
          each other and blend into a visible seam wherever their
          diagonals intersect (showed up as a stripe across small elements
          like the group-stack input). An identical copy, offset in
          position only, never creates that seam. Settles once on mount
          rather than looping forever — a permanent full-screen
          re-composite was a constant tax on the same UI-thread/GPU budget
          drag/scroll/list animations need, and it showed up as jank
          everywhere, not just here. */}
      <MotiView
        pointerEvents="none"
        style={styles.driftLayer}
        from={{ translateX: -16, translateY: -16, opacity: 0.2 }}
        animate={{ translateX: 12, translateY: 12, opacity: 0.4 }}
        transition={{ type: 'timing', duration: 1400 }}
      >
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fill}
        />
      </MotiView>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  driftLayer: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
  },
});
