"use client";

import { useCallback, useEffect, useState } from "react";

export interface AsyncState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  /** Re-runs the loader, keeping the current data on screen until the new result lands. */
  reload: () => void;
}

interface Settled<T> {
  /** Which request this result belongs to. */
  key: object | null;
  data: T | undefined;
  error: Error | undefined;
}

/**
 * Loads data from an api.ts function and re-runs when `deps` change.
 *
 * Every combination of deps gets a fresh `key`; `loading` is simply "the last
 * settled result isn't for the current key". Results of superseded requests are
 * dropped, so a slow earlier request can never overwrite a newer one (e.g. typing
 * quickly into the content search box). Data from the previous request stays
 * visible while the next one loads.
 */
export function useAsync<T>(load: () => Promise<T>, deps: React.DependencyList): AsyncState<T> {
  const [nonce, setNonce] = useState(0);
  // A new key whenever deps or the reload nonce change — React's "adjust state when
  // a prop changes" pattern (state set during render, guarded by the comparison).
  const [request, setRequest] = useState({ deps, nonce, key: {} as object });
  if (nonce !== request.nonce || !sameDeps(deps, request.deps)) {
    setRequest({ deps, nonce, key: {} });
  }
  const key = request.key;
  const [settled, setSettled] = useState<Settled<T>>({ key: null, data: undefined, error: undefined });

  useEffect(() => {
    let cancelled = false;
    load().then(
      (data) => {
        if (!cancelled) setSettled({ key, data, error: undefined });
      },
      (err: unknown) => {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error(String(err));
          setSettled((previous) => ({ key, data: previous.data, error }));
        }
      },
    );
    return () => {
      cancelled = true;
    };
    // `load` is intentionally not a dependency: callers pass an inline closure, and
    // `deps` (via `key`) is what decides when it should run again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const current = settled.key === key;
  return {
    data: settled.data,
    error: current ? settled.error : undefined,
    loading: !current,
    reload,
  };
}

function sameDeps(a: React.DependencyList, b: React.DependencyList): boolean {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
}
