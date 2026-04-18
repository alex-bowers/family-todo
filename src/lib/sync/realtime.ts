interface RealtimeBridgeOptions {
  onReconnect: () => Promise<void> | void;
  onOffline?: () => Promise<void> | void;
  onPoll?: () => Promise<void> | void;
  onRealtimeEvent?: () => Promise<void> | void;
  pollMs?: number;
}

export function startRealtimeBridge(options: RealtimeBridgeOptions): () => void {
  const pollInterval = Math.max(options.pollMs ?? 15000, 5000);

  const handleOnline = (): void => {
    void options.onReconnect();
  };

  const handleOffline = (): void => {
    void options.onOffline?.();
  };

  const timer =
    options.onPoll && typeof window !== 'undefined'
      ? window.setInterval(() => {
          if (navigator.onLine) {
            void options.onPoll?.();
          }
        }, pollInterval)
      : null;

  const realtimeTimer =
    options.onRealtimeEvent && typeof window !== 'undefined'
      ? window.setInterval(() => {
          if (navigator.onLine) {
            void options.onRealtimeEvent?.();
          }
        }, pollInterval)
      : null;

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
    if (timer !== null && typeof window !== 'undefined') {
      window.clearInterval(timer);
    }
    if (realtimeTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(realtimeTimer);
    }
  };
}
