import { useEffect, useRef } from 'react';

type Cleanup = void | (() => void);

/**
 * useDebouncedEffect
 * Runs the provided effect after a debounce delay when dependencies change.
 * If a cleanup function is returned by the effect, it will be invoked on
 * dependency change and unmount (after clearing any pending timeout).
 */
export function useDebouncedEffect(
  effect: () => Cleanup,
  deps: React.DependencyList,
  delay: number,
) {
  const cleanupRef = useRef<Cleanup>(undefined);

  useEffect(() => {
    const handler = setTimeout(
      () => {
        cleanupRef.current = effect();
      },
      Math.max(0, delay),
    );

    return () => {
      clearTimeout(handler);
      if (typeof cleanupRef.current === 'function') {
        try {
          cleanupRef.current();
        } catch {
          // no-op
        }
      }
      cleanupRef.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}
