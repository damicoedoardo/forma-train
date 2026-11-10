'use client';

import { api, Offline } from '@/platform/api';
import type { Cheer } from './cheers';
import { FEED_LIMIT, type Post, type WorkoutCard } from './feed';
import type { FriendsList, MyCard, Profile } from './friends';

/* The talking side of friends, cheers and the feed (rules and types next to it). Every call needs
   sign-in. */

async function json<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const detail = ((await r.json().catch(() => null)) as { detail?: string } | null)?.detail;
    throw new Error(typeof detail === 'string' ? detail : `Request failed (${r.status})`);
  }
  return (await r.json()) as T;
}

async function gone(r: Response) {
  if (!r.ok && r.status !== 404) throw new Error(`Request failed (${r.status})`);
}

export { Offline };

// Friends

/** Send your card; also the heartbeat that shows you online. */
export const sendCard = async (card: Partial<MyCard>) => json<{ code: string; name: string }>(await api('PUT', '/me', card));
export const getFriends = async () => json<FriendsList>(await api('GET', '/friends'));
/** Add by code: "asked", or "friends" when they had asked you first. */
export const addFriend = async (code: string) => json<{ status: 'asked' | 'friends'; name: string }>(await api('POST', '/friends', { code }));
export const acceptFriend = async (id: string) => json<{ status: string }>(await api('POST', `/friends/${id}/accept`));
export const removeFriend = async (id: string) => gone(await api('DELETE', `/friends/${id}`));
/** Where you live and a line about you (friends only). */
export const saveProfile = async (place: string, about: string) => json<Profile>(await api('PUT', '/me/profile', { place, about }));
/** Your photo: a base64 JPEG from `shrinkPhoto`, or null to take it down. */
export const savePhoto = async (photo: string | null) => json<Profile>(photo ? await api('PUT', '/me/photo', { photo }) : await api('DELETE', '/me/photo'));

// Cheers

/** Cheer a friend on: "sent", with how many more you can send them today. */
export const sendCheer = async (to: string, text: string) => json<{ status: string; left_today: number }>(await api('POST', '/cheers', { to, text }));
/** What friends cheered you since the last look (each cheer only once). */
export const takeCheers = async () => json<{ cheers: Cheer[] }>(await api('POST', '/cheers/take'));

// Feed

/** Yours and your friends' posts, newest first; `before` (a post's `at`) for the next page. */
export const getFeed = async (before?: string) => json<{ posts: Post[]; more: boolean }>(await api('GET', `/feed${before ? `?before=${encodeURIComponent(before)}` : ''}`));
/** Share a finished workout, with a line and a photo (base64 JPEG from `shrinkPhoto`) if you like. */
export const sharePost = async (workout: WorkoutCard, text: string, photo: string | null) => json<Post>(await api('POST', '/feed', { workout, text, ...(photo ? { photo } : {}) }));
/** Give a post fire, or take yours back. */
export const firePost = async (id: string) => json<{ flamed: boolean; flames: number }>(await api('POST', `/feed/${id}/flame`));
/** Comment on a post: the post back, with every comment. */
export const commentPost = async (id: string, text: string) => json<Post>(await api('POST', `/feed/${id}/comments`, { text }));
export const deletePost = async (id: string) => gone(await api('DELETE', `/feed/${id}`));
export const deleteComment = async (id: string) => gone(await api('DELETE', `/feed/comments/${id}`));

// Photos need sign-in, so an <img> can't fetch them itself: fetch once, keep a blob link.

const photos = new Map<string, Promise<string>>();
function blobUrl(key: string, path: string): Promise<string> {
  let p = photos.get(key);
  if (!p) {
    p = api('GET', path).then(async (r) => {
      if (!r.ok) throw new Error(`Request failed (${r.status})`);
      return URL.createObjectURL(await r.blob());
    });
    p.catch(() => photos.delete(key));
    photos.set(key, p);
  }
  return p;
}

/** A post's photo. */
export const postPhotoUrl = (id: string) => blobUrl(`post:${id}`, `/feed/${id}/photo`);
/** A person's photo; `version` is the profile's `photo` time, so a new one is fetched again. */
export const profilePhotoUrl = (id: string, version: string) => blobUrl(`person:${id}@${version}`, `/profiles/${id}/photo`);

/** The canvas as a JPEG under `bytes`: lower quality until it fits. */
function encode(canvas: HTMLCanvasElement, bytes: number): { base64: string; preview: string } {
  for (const q of [0.82, 0.7, 0.55, 0.4]) {
    const url = canvas.toDataURL('image/jpeg', q);
    const base64 = url.slice(url.indexOf(',') + 1);
    if ((base64.length * 3) / 4 <= bytes) return { base64, preview: url };
  }
  throw new Error('That photo is too big. Try another one.');
}

/** A photo from the phone, made small enough to send: at most `edge` on its long side, a JPEG
    under `bytes`. `square` crops the middle square first (a profile photo). An <img> follows the
    photo's turn-and-flip note on every browser (createImageBitmap doesn't on iPhone), so the
    photo is decoded through one. Returns base64 (no "data:" head) and a preview link. */
export async function shrinkPhoto(file: File, { edge = FEED_LIMIT.photoEdge as number, bytes = FEED_LIMIT.photoBytes as number, square = false }: { edge?: number; bytes?: number; square?: boolean } = {}): Promise<{ base64: string; preview: string }> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  try {
    img.src = url;
    await img.decode();
  } catch {
    throw new Error("Couldn't open that photo. Try another one.");
  } finally {
    URL.revokeObjectURL(url);
  }
  const w = img.naturalWidth,
    h = img.naturalHeight;
  const side = Math.min(w, h);
  const [sx, sy, sw, sh] = square ? [(w - side) / 2, (h - side) / 2, side, side] : [0, 0, w, h];
  const scale = Math.min(1, edge / Math.max(sw, sh));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  canvas.getContext('2d')?.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return encode(canvas, bytes);
}
