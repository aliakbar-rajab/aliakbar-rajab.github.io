/**
 * Memoise an async loader, but only its successes.
 *
 * The obvious `cached ??= load()` caches the rejected promise too, so every
 * later call replays the original failure. That makes the retry the UI offers
 * ("لطفاً دوباره تلاش کنید") impossible to satisfy: the user reconnects, tries
 * again, and gets the same error forever. Clearing the slot on rejection means
 * the next call starts a fresh attempt, while concurrent callers still share
 * the one in flight.
 */
export function createRetryableLoader<T>(
  load: () => Promise<T>,
): () => Promise<T> {
  let pending: Promise<T> | undefined;
  return () => {
    pending ??= Promise.resolve()
      .then(load)
      .catch((error: unknown) => {
        pending = undefined;
        throw error;
      });
    return pending;
  };
}
