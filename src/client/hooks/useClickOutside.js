import { useEffect } from 'react';

// Calls `handler` when a pointer or focus event lands outside `ref`.
// `enabled` lets callers cheaply gate the listener (e.g., only while open).
export default function useClickOutside(ref, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;

    function onPointerDown(event) {
      const node = ref.current;
      if (!node || node.contains(event.target)) return;
      handler(event);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [ref, handler, enabled]);
}
