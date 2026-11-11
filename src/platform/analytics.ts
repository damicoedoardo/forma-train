import type { PostHog } from 'posthog-js';

/* Product analytics with PostHog (the same project the FORMA game used). Page views and taps are
   counted on their own; `identify` ties them to the account once someone signs in. Off in local
   dev and in the sandbox; the library loads only once the page is up, so it never slows the app. */

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? 'phc_xqQdq6BAxbC6oxW793KMdnNv2ymFSk5pfbJsZwn8iQL4';
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

let client: Promise<PostHog | null> | null = null;

function on(): boolean {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production' || !KEY) return false;
  return !new URLSearchParams(window.location.search).has('sandbox');
}

/** Starts PostHog once; null when analytics are off here. */
export function startAnalytics(): Promise<PostHog | null> {
  client ??= on()
    ? import('posthog-js').then(({ default: posthog }) => {
        posthog.init(KEY, { api_host: HOST, person_profiles: 'identified_only', capture_pageview: true });
        return posthog;
      })
    : Promise.resolve(null);
  return client;
}

/** Ties this phone's events to the signed-in account (null on sign-out). */
export function identify(userId: string | null): void {
  void startAnalytics().then((posthog) => {
    if (!posthog) return;
    if (userId) posthog.identify(userId);
    else posthog.reset();
  });
}
