import { describe, expect, it } from 'vitest';
import { door, guideFor, type Seen } from './gate';

const base: Seen = { installed: true, browserOk: false, signedIn: true, fetching: false, cloud: true, sandbox: false };

describe('door', () => {
  it('asks a browser to install first', () => {
    expect(door({ ...base, installed: false, signedIn: false })).toBe('install');
    expect(door({ ...base, installed: false })).toBe('install');
  });
  it('lets a computer go on in the browser, to the sign-in', () => {
    expect(door({ ...base, installed: false, browserOk: true, signedIn: false })).toBe('sign-in');
  });
  it('opens an installed app on the sign-in until signed in', () => {
    expect(door({ ...base, signedIn: false })).toBe('sign-in');
    expect(door(base)).toBe('app');
  });
  it('waits for the cloud save right after signing in', () => {
    expect(door({ ...base, fetching: true })).toBe('sign-in');
  });
  it('skips the sign-in when the cloud is not set up, and every door in the sandbox', () => {
    expect(door({ ...base, signedIn: false, cloud: false })).toBe('app');
    expect(door({ ...base, installed: false, signedIn: false, sandbox: true })).toBe('app');
  });
});

describe('guideFor', () => {
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1';
  it('tells the phones apart', () => {
    expect(guideFor(iphone)).toBe('ios-safari');
    expect(guideFor(iphone.replace('Version/26.1', 'CriOS/142.0'))).toBe('ios-other');
    expect(guideFor(`${iphone} Instagram 400.0`)).toBe('in-app');
    expect(guideFor('Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0 Mobile Safari/537.36')).toBe('android');
    expect(guideFor('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Safari/605.1.15')).toBe('desktop');
  });
  it('counts an iPad, which says it is a Mac, by its touch screen', () => {
    expect(guideFor('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Safari/605.1.15', true)).toBe('ios-safari');
  });
});
