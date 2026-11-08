/**
 * Tracks every beforeunload listener so removeAll() can detach them before OAuth
 * navigation (Firefox ignores stopImmediatePropagation). Import this first in index.tsx.
 */

type ListenerEntry = {
  listener: EventListenerOrEventListenerObject;
  options?: AddEventListenerOptions;
};

const tracked: ListenerEntry[] = [];
const originalAdd = window.addEventListener.bind(window);
const originalRemove = window.removeEventListener.bind(window);

// Patch addEventListener to intercept beforeunload registrations.
window.addEventListener = function patchedAddEventListener(
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
) {
  if (type === "beforeunload" && listener) {
    const normalizedOptions: AddEventListenerOptions | undefined = typeof options === 'boolean' 
      ? { capture: options } 
      : options;
    tracked.push({ listener, options: normalizedOptions });
  }
  return originalAdd(type, listener, options);
};

// Patch removeEventListener to keep tracked list in sync.
window.removeEventListener = function patchedRemoveEventListener(
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: EventListenerOptions,
) {
  if (type === "beforeunload") {
    const idx = tracked.findIndex((e) => e.listener === listener);
    if (idx !== -1) tracked.splice(idx, 1);
  }
  return originalRemove(type, listener, options);
};

/**
 * Removes all tracked beforeunload listeners and returns a restore function.
 * Restore also runs automatically once on `pagehide`.
 */
export function suppressAllBeforeunloadListeners(): () => void {
  // Take a snapshot and detach every tracked listener.
  const snapshot = [...tracked];
  for (const { listener, options } of snapshot) {
    originalRemove("beforeunload", listener, options);
    // Remove from tracked so our patched removeEventListener doesn't double-splice.
    const idx = tracked.findIndex((e) => e.listener === listener);
    if (idx !== -1) tracked.splice(idx, 1);
  }

  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    originalRemove("pagehide", onPageHide);
    for (const { listener, options } of snapshot) {
      originalAdd("beforeunload", listener, options);
      tracked.push({ listener, options });
    }
  };

  // Auto-restore on pagehide so that if user presses Back the listeners work again.
  const onPageHide = () => restore();
  originalAdd("pagehide", onPageHide, { once: true });

  return restore;
}
