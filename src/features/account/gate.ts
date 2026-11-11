/* The way in. Forma lives on the phone: in a browser it first asks to be put on the Home
   Screen, and once installed it opens on the sign-in, so everything inside the app can count on
   being signed in. Pure: the screens pass in what they see. */

export type Door = 'install' | 'sign-in' | 'app';

export interface Seen {
  /** Opened from the Home Screen (display-mode standalone). */
  installed: boolean;
  /** Chose to go on in this browser (only offered on a computer). */
  browserOk: boolean;
  signedIn: boolean;
  /** Signed in on this screen, and the cloud save hasn't been fetched yet: wait, so a returning
      person doesn't see the setup questions flash before their save comes down. */
  fetching: boolean;
  /** Sign-in is set up (the cloud settings are there). Off in dev and tests. */
  cloud: boolean;
  /** The sandbox (a test save): no doors. */
  sandbox: boolean;
}

export function door(s: Seen): Door {
  if (s.sandbox) return 'app';
  if (!s.installed && !s.browserOk) return 'install';
  if (!s.cloud) return 'app';
  if (!s.signedIn || s.fetching) return 'sign-in';
  return 'app';
}

/** Which install steps to show. */
export type Guide = 'ios-safari' | 'ios-other' | 'in-app' | 'android' | 'desktop';

/** Reads the browser's user agent. iPads say they are Macs, so a touch screen counts too. */
export function guideFor(ua: string, touch = false): Guide {
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touch);
  // Apps that open links in their own browser can't add to the Home Screen.
  if (/FBAN|FBAV|Instagram|Line\/|LinkedInApp|Twitter|TikTok|musical_ly|Snapchat|; wv\)/.test(ua)) return 'in-app';
  if (ios) return /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua) ? 'ios-other' : 'ios-safari';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}
