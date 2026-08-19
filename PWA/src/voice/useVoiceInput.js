import { useEffect, useRef, useState } from 'react';

const SpeechRecognitionCtor =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined;

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iP(hone|od|ad)/.test(navigator.platform) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

// iOS Safari's SpeechRecognition constructor exists even when installed as
// a home-screen PWA, but calling it silently fails to ever return a result
// in that context (confirmed via WebKit bug reports — it works fine in a
// regular Safari tab, just not standalone). Rather than let someone tap the
// mic and get nothing with no explanation, this is detected upfront so the
// UI can hide the button with a real reason instead of a dead control.
const BLOCKED_IOS_STANDALONE = isIOS() && isStandalone();

// Standalone version of the same check, for callers (e.g. PermissionsPrompt)
// that need to know whether voice input can ever work on this device without
// mounting the full useVoiceInput hook — e.g. to skip asking for mic
// permission, or hide voice-related copy/icons, when it can't.
export function isVoiceInputBlocked() {
  return BLOCKED_IOS_STANDALONE;
}

// Triggers the OS microphone-permission prompt directly, ahead of the first
// time someone actually taps the mic button — used by PermissionsPrompt so
// new users see the mic/notification asks together, once, right after
// signing in, the way a native app's onboarding screen would, rather than
// only ever being asked lazily mid-task. getUserMedia and SpeechRecognition
// share the same underlying browser microphone permission, so priming it
// this way covers voice input too even though it's a different API.
export async function primeMicPermission() {
  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

// Wraps the Web Speech API with the same event shape/behavior as the mobile
// app's mic (see frontend/src/components/TaskInput.js): live-updating
// transcript while listening, auto-submit on a successful end, a calm
// inline message on recoverable errors. `onResult`/`onEnd`/`onError` are
// read from refs on every call so callers don't need to worry about stale
// closures across start/stop.
export function useVoiceInput({ onResult, onEnd, onError }) {
  const [recognizing, setRecognizing] = useState(false);
  const recognitionRef = useRef(null);
  const hasResultRef = useRef(false);
  const erroredRef = useRef(false);

  const onResultRef = useRef(onResult);
  const onEndRef = useRef(onEnd);
  const onErrorRef = useRef(onError);
  onResultRef.current = onResult;
  onEndRef.current = onEnd;
  onErrorRef.current = onError;

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const supported = Boolean(SpeechRecognitionCtor) && !BLOCKED_IOS_STANDALONE;
  const unavailableReason = !SpeechRecognitionCtor
    ? 'Voice input needs a browser with speech recognition support (Chrome or Safari).'
    : BLOCKED_IOS_STANDALONE
      ? "Voice input isn't available once Stack is installed on iOS — open stack.hellosyntax.dev in Safari directly to use it."
      : null;

  function start() {
    if (!supported || recognizing) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setRecognizing(true);
      hasResultRef.current = false;
      erroredRef.current = false;
    };
    recognition.onresult = (event) => {
      const result = event.results[0];
      if (!result) return;
      hasResultRef.current = true;
      onResultRef.current?.(result[0].transcript.slice(0, 280));
    };
    recognition.onerror = (event) => {
      erroredRef.current = true;
      setRecognizing(false);
      onErrorRef.current?.(event.error);
    };
    recognition.onend = () => {
      setRecognizing(false);
      onEndRef.current?.(hasResultRef.current && !erroredRef.current);
    };

    try {
      recognition.start();
    } catch {
      onErrorRef.current?.('start-failed');
    }
  }

  function stop() {
    recognitionRef.current?.stop();
  }

  return { supported, unavailableReason, recognizing, start, stop };
}
