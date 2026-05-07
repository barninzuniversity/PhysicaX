"use client";

import { useCallback, useEffect, useState } from "react";

type Snapshot<T> = {
  data: T | null;
  error: string | null;
  checking: boolean;
  lastCheckedAt: number | null;
};

type StoreOptions = {
  intervalMs: number;
  timeoutMs: number;
  pauseWhenHidden: boolean;
};

type Store<T> = Snapshot<T> & {
  endpoint: string;
  listeners: Set<() => void>;
  subscribers: number;
  intervalId: number | null;
  inflight: Promise<T | null> | null;
  options: StoreOptions;
};

type UseCfdStatusOptions = Partial<StoreOptions> & {
  enabled?: boolean;
};

const stores = new Map<string, Store<unknown>>();

const defaultOptions: StoreOptions = {
  intervalMs: 30000,
  timeoutMs: 5000,
  pauseWhenHidden: true
};

const createStore = <T,>(endpoint: string, options: StoreOptions): Store<T> => ({
  endpoint,
  listeners: new Set(),
  subscribers: 0,
  intervalId: null,
  inflight: null,
  options,
  data: null,
  error: null,
  checking: false,
  lastCheckedAt: null
});

const emit = <T,>(store: Store<T>) => {
  store.listeners.forEach((listener) => listener());
};

const getStore = <T,>(endpoint: string, options: StoreOptions): Store<T> => {
  const existing = stores.get(endpoint) as Store<T> | undefined;
  if (existing) {
    const intervalChanged = existing.options.intervalMs !== options.intervalMs;
    existing.options = options;
    if (intervalChanged && existing.intervalId != null && typeof window !== "undefined") {
      window.clearInterval(existing.intervalId);
      existing.intervalId = null;
    }
    return existing;
  }
  const next = createStore<T>(endpoint, options);
  stores.set(endpoint, next as Store<unknown>);
  return next;
};

const fetchStore = async <T,>(store: Store<T>): Promise<T | null> => {
  if (store.inflight) {
    return store.inflight;
  }

  store.checking = true;
  emit(store);

  const run = (async () => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), store.options.timeoutMs);
    try {
      const response = await fetch(store.endpoint, {
        cache: "no-store",
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`CFD status request failed with HTTP ${response.status}.`);
      }
      const payload = (await response.json()) as T;
      store.data = payload;
      store.error = null;
      store.lastCheckedAt = Date.now();
      return payload;
    } catch (error) {
      store.error = error instanceof Error ? error.message : "CFD status request failed.";
      return null;
    } finally {
      window.clearTimeout(timer);
      store.checking = false;
      store.inflight = null;
      emit(store);
    }
  })();

  store.inflight = run;
  return run;
};

const startStore = <T,>(store: Store<T>) => {
  if (typeof window === "undefined" || store.intervalId != null) {
    return;
  }

  const tick = () => {
    if (store.options.pauseWhenHidden && typeof document !== "undefined" && document.hidden) {
      return;
    }
    void fetchStore(store);
  };

  tick();
  store.intervalId = window.setInterval(tick, store.options.intervalMs);
};

const stopStore = <T,>(store: Store<T>) => {
  if (typeof window !== "undefined" && store.intervalId != null) {
    window.clearInterval(store.intervalId);
  }
  store.intervalId = null;
};

export function useCfdStatus<T>(endpoint: string | null, options: UseCfdStatusOptions = {}) {
  const resolvedOptions: StoreOptions = {
    intervalMs: options.intervalMs ?? defaultOptions.intervalMs,
    timeoutMs: options.timeoutMs ?? defaultOptions.timeoutMs,
    pauseWhenHidden: options.pauseWhenHidden ?? defaultOptions.pauseWhenHidden
  };
  const enabled = options.enabled ?? true;
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({
    data: null,
    error: null,
    checking: Boolean(endpoint && enabled),
    lastCheckedAt: null
  });

  useEffect(() => {
    if (!endpoint || !enabled) {
      setSnapshot({
        data: null,
        error: null,
        checking: false,
        lastCheckedAt: null
      });
      return;
    }

    const store = getStore<T>(endpoint, resolvedOptions);
    const sync = () => {
      setSnapshot({
        data: store.data,
        error: store.error,
        checking: store.checking,
        lastCheckedAt: store.lastCheckedAt
      });
    };

    store.listeners.add(sync);
    store.subscribers += 1;
    sync();
    startStore(store);

    return () => {
      store.listeners.delete(sync);
      store.subscribers = Math.max(0, store.subscribers - 1);
      if (store.subscribers === 0) {
        stopStore(store);
      }
    };
  }, [enabled, endpoint, resolvedOptions.intervalMs, resolvedOptions.pauseWhenHidden, resolvedOptions.timeoutMs]);

  const refresh = useCallback(async () => {
    if (!endpoint || !enabled || typeof window === "undefined") {
      return null;
    }
    const store = getStore<T>(endpoint, resolvedOptions);
    return fetchStore(store);
  }, [enabled, endpoint, resolvedOptions.intervalMs, resolvedOptions.pauseWhenHidden, resolvedOptions.timeoutMs]);

  return {
    ...snapshot,
    refresh
  };
}
