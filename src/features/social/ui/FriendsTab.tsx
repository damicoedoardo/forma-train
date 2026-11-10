'use client';

import { useCallback, useEffect, useState } from 'react';
import { Flame, MessageCircle, Plus, Share2, UserPlus } from 'lucide-react';
import { Avatar, Button, Chip, Glass, Segmented } from '@/ui';
import { cloudConfigured } from '@/platform/api';
import { CHEER_LIMIT, cleanCheer, quickCheers } from '../cheers';
import { cleanLine, FEED_LIMIT, type Post } from '../feed';
import { inviteLink, showCode, statusOf, ago, type FriendCard, type FriendsList } from '../friends';
import { acceptFriend, addFriend, commentPost, firePost, getFeed, getFriends, postPhotoUrl, profilePhotoUrl, removeFriend, sendCheer } from '../client';

/* The Friends tab: who is training now (cheer them on), your friends, adding one by code; and
   the feed of workouts friends shared. */

type View = 'friends' | 'feed';
const REFRESH_MS = 30_000;

export function FriendsTab({ signedIn, code, onSignIn }: { signedIn: boolean; code: string | null; onSignIn: () => void }) {
  const [view, setView] = useState<View>('friends');
  return (
    <>
      <div className="mx-auto w-[220px]">
        <Segmented
          label="Friends"
          options={[
            { value: 'friends', label: 'Friends' },
            { value: 'feed', label: 'Feed' },
          ]}
          value={view}
          onChange={setView}
        />
      </div>
      {!signedIn ? (
        <Glass className="mt-8 flex flex-col gap-4 px-5 py-5">
          <span className="text-[15px] leading-[21px] text-ink-soft">{cloudConfigured ? 'Sign in to train with friends: see who is training, cheer them on, share your workouts.' : 'Training with friends comes soon.'}</span>
          {cloudConfigured && (
            <Button kind="glass" onClick={onSignIn}>
              Sign in
            </Button>
          )}
        </Glass>
      ) : view === 'friends' ? (
        <Friends code={code} />
      ) : (
        <Feed />
      )}
    </>
  );
}

/** A photo that needs sign-in, shown once fetched. */
function usePhoto(load: (() => Promise<string>) | null): string | null {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let gone = false;
    setSrc(null);
    load?.()
      .then((u) => !gone && setSrc(u))
      .catch(() => {});
    return () => {
      gone = true;
    };
  }, [load]);
  return src;
}

function FriendAvatar({ f, size }: { f: Pick<FriendCard, 'id' | 'name' | 'photo'>; size: number }) {
  const load = useCallback(() => profilePhotoUrl(f.id, f.photo!), [f.id, f.photo]);
  const src = usePhoto(f.photo ? load : null);
  return <Avatar name={f.name} src={src} size={size} />;
}

function Friends({ code }: { code: string | null }) {
  const [list, setList] = useState<FriendsList | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [cheering, setCheering] = useState<FriendCard | null>(null);
  const [open, setOpen] = useState<FriendCard | null>(null);
  const now = new Date();

  const load = useCallback(() => {
    getFriends()
      .then((l) => {
        setList(l);
        setErr(null);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);
  useEffect(() => {
    load();
    const t = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(t);
  }, [load]);

  if (!list) return <span className="mt-8 px-1 text-[14px] text-ink-faint">{err ?? 'Loading…'}</span>;
  const training = list.friends.filter((f) => f.training);
  const rest = list.friends.filter((f) => !f.training);
  const myCode = code ?? list.me.code;

  return (
    <div className="mt-7 flex flex-col gap-3">
      {training.map((f) => (
        <Glass key={f.id} className="flex items-center gap-3 px-4 py-3.5">
          <div className="relative">
            <FriendAvatar f={f} size={44} />
            <span aria-hidden className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-base bg-accent" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[16px] font-medium">{f.name}</span>
            <span className="truncate text-[13px] text-ink-muted">Training · {f.training}</span>
          </div>
          <button type="button" onClick={() => setCheering(f)} className="h-10 press btn-primary rounded-pill px-5 text-[14px] font-medium text-base">
            Cheer
          </button>
        </Glass>
      ))}

      {list.asks_in.map((f) => (
        <Glass key={f.id} className="flex items-center gap-3 px-4 py-3.5">
          <FriendAvatar f={f} size={40} />
          <span className="flex-1 text-[15px]">{f.name} wants to be friends</span>
          <button type="button" onClick={() => acceptFriend(f.id).then(load)} className="h-10 press btn-primary rounded-pill px-4 text-[14px] font-medium text-base">
            Accept
          </button>
        </Glass>
      ))}

      {rest.length > 0 && (
        <Glass className="flex flex-col px-4 py-1">
          {rest.map((f, i) => (
            <button key={f.id} type="button" onClick={() => setOpen(f)} className={`flex items-center gap-3 py-3 text-left ${i ? 'border-t hairline' : ''}`}>
              <FriendAvatar f={f} size={36} />
              <span className="flex-1 text-[15px]">{f.name}</span>
              <span className={`text-[13px] ${f.online ? 'text-ink-soft' : 'text-ink-faint'}`}>{statusOf(f, now)}</span>
            </button>
          ))}
        </Glass>
      )}

      {list.asks_out.length > 0 && <span className="px-1 text-[13px] text-ink-faint">Waiting on {list.asks_out.map((f) => f.name || 'a friend').join(', ')}</span>}

      <button type="button" onClick={() => setAdding(true)} className="glass flex h-14 items-center justify-center gap-2 rounded-pill text-[15px]">
        <UserPlus size={18} strokeWidth={1.8} aria-hidden /> Add a friend
      </button>

      {adding && <AddFriend code={myCode} onClose={() => setAdding(false)} onAdded={load} />}
      {cheering && <CheerSheet friend={cheering} onClose={() => setCheering(null)} />}
      {open && (
        <FriendSheet
          f={open}
          onClose={() => setOpen(null)}
          onRemove={() =>
            removeFriend(open.id).then(() => {
              setOpen(null);
              load();
            })
          }
        />
      )}
    </div>
  );
}

/** A sheet from the bottom, over a dim backdrop. */
function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fade fixed inset-0 z-30 flex items-end bg-black/55 px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }} onClick={onClose}>
      <div className="glass sheet mx-auto flex w-full max-w-[448px] flex-col gap-4 rounded-card !bg-[#16171C]/95 p-5" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function AddFriend({ code, onClose, onAdded }: { code: string; onClose: () => void; onAdded: () => void }) {
  const [their, setTheir] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const link = typeof window !== 'undefined' ? inviteLink(window.location.origin, code) : '';
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Train with me', url: link });
      else {
        await navigator.clipboard.writeText(link);
        setMsg('Link copied');
      }
    } catch {
      // Closed the share sheet: nothing to do.
    }
  };
  const add = async () => {
    try {
      const r = await addFriend(their);
      setMsg(r.status === 'friends' ? `You and ${r.name} are friends` : `Asked ${r.name}`);
      setTheir('');
      onAdded();
    } catch (e) {
      setMsg((e as Error).message);
    }
  };
  return (
    <Sheet onClose={onClose}>
      <div className="flex flex-col items-center gap-1 py-2">
        <span className="text-[13px] text-ink-muted">Your code</span>
        <span className="font-display text-[34px] font-medium tracking-[2px]">{showCode(code)}</span>
      </div>
      <Button kind="glass" onClick={share}>
        <Share2 size={17} strokeWidth={1.8} aria-hidden /> Send an invite
      </Button>
      <form
        className="glass flex h-14 items-center gap-2 rounded-pill pl-5 pr-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (their.trim()) void add();
        }}
      >
        <input value={their} onChange={(e) => setTheir(e.target.value)} placeholder="Their code" aria-label="Their code" maxLength={12} className="min-w-0 flex-1 bg-transparent text-[16px] uppercase tracking-[1px] text-ink outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-faint" />
        <button type="submit" aria-label="Add" disabled={!their.trim()} className="flex h-11 w-11 items-center justify-center press btn-primary rounded-full text-base disabled:opacity-30">
          <Plus size={18} strokeWidth={2.2} aria-hidden />
        </button>
      </form>
      {msg && <span className="text-center text-[14px] text-ink-soft">{msg}</span>}
    </Sheet>
  );
}

function CheerSheet({ friend, onClose }: { friend: FriendCard; onClose: () => void }) {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const send = async (t: string) => {
    const line = cleanCheer(t);
    if (!line) return;
    try {
      await sendCheer(friend.id, line);
      onClose();
    } catch (e) {
      setMsg((e as Error).message);
    }
  };
  return (
    <Sheet onClose={onClose}>
      <span className="text-[15px] text-ink-muted">Cheer {friend.name.split(' ')[0]}</span>
      <div className="flex flex-wrap gap-2">
        {quickCheers(friend.name).map((q) => (
          <Chip key={q} onClick={() => void send(q)}>
            {q}
          </Chip>
        ))}
      </div>
      <form
        className="glass flex h-14 items-center gap-2 rounded-pill pl-5 pr-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          void send(text);
        }}
      >
        <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Your words" aria-label="Your words" maxLength={CHEER_LIMIT.length} className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-faint" />
        <button type="submit" disabled={!text.trim()} className="h-11 press btn-primary rounded-pill px-4 text-[14px] font-medium text-base disabled:opacity-30">
          Send
        </button>
      </form>
      {msg && <span className="text-center text-[14px] text-ink-soft">{msg}</span>}
    </Sheet>
  );
}

function FriendSheet({ f, onClose, onRemove }: { f: FriendCard; onClose: () => void; onRemove: () => void }) {
  const [sure, setSure] = useState(false);
  const s = f.stats;
  return (
    <Sheet onClose={onClose}>
      <div className="flex flex-col items-center gap-2 pt-2">
        <FriendAvatar f={f} size={72} />
        <span className="font-display text-[24px] font-medium">{f.name}</span>
        {(f.place || f.about) && <span className="text-center text-[14px] text-ink-muted">{[f.place, f.about].filter(Boolean).join(' · ')}</span>}
      </div>
      {s && (
        <div className="grid grid-cols-3 text-center">
          {[
            [s.workouts, 'workouts'],
            [s.week, 'this week'],
            [s.streak, 'week streak'],
          ].map(([v, l]) => (
            <div key={l} className="flex flex-col">
              <span className="font-display text-[22px] font-medium tabular-nums">{v}</span>
              <span className="text-[12px] text-ink-muted">{l}</span>
            </div>
          ))}
        </div>
      )}
      <Button kind="glass" className="text-ink-muted" onClick={() => (sure ? onRemove() : setSure(true))}>
        {sure ? 'Tap again to remove' : 'Remove friend'}
      </Button>
    </Sheet>
  );
}

function Feed() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    getFeed()
      .then((r) => setPosts(r.posts))
      .catch((e: Error) => setErr(e.message));
  }, []);
  if (!posts) return <span className="mt-8 px-1 text-[14px] text-ink-faint">{err ?? 'Loading…'}</span>;
  if (!posts.length) return <Glass className="mt-7 px-5 py-5 text-[15px] text-ink-muted">Workouts you and your friends share show here.</Glass>;
  const put = (p: Post) => setPosts((all) => all?.map((x) => (x.id === p.id ? p : x)) ?? null);
  return (
    <div className="mt-7 flex flex-col gap-3">
      {posts.map((p) => (
        <PostCard key={p.id} p={p} onChange={put} />
      ))}
    </div>
  );
}

function PostCard({ p, onChange }: { p: Post; onChange: (p: Post) => void }) {
  const [talk, setTalk] = useState(false);
  const [text, setText] = useState('');
  const load = useCallback(() => postPhotoUrl(p.id), [p.id]);
  const photo = usePhoto(p.photo ? load : null);
  const now = new Date();
  const author = { id: p.author.id, name: p.author.name, photo: 'photo' in p.author ? p.author.photo : null };
  const w = p.workout;
  const fire = async () => {
    const r = await firePost(p.id).catch(() => null);
    if (r) onChange({ ...p, flamed: r.flamed, flames: r.flames });
  };
  const comment = async () => {
    const line = cleanLine(text, FEED_LIMIT.comment);
    if (!line) return;
    const r = await commentPost(p.id, line).catch(() => null);
    if (r) {
      onChange(r);
      setText('');
    }
  };
  return (
    <article className="glass flex flex-col overflow-hidden rounded-card">
      <div className="flex items-center gap-3 px-[18px] py-4">
        <FriendAvatar f={author} size={36} />
        <div className="flex flex-1 flex-col">
          <span className="text-[15px] font-medium">{p.mine ? 'You' : p.author.name}</span>
          <span className="text-[13px] text-ink-faint">{ago(new Date(p.at), now)}</span>
        </div>
      </div>
      {photo && <img src={photo} alt="" className="max-h-[320px] w-full object-cover" />}
      {p.text && <p className="px-[18px] pt-4 text-[15px] leading-[21px] text-ink-soft">{p.text}</p>}
      <div className="grid grid-cols-3 px-[18px] py-4">
        {[
          [w.minutes ? `${w.minutes}m` : '–', w.title],
          [w.sets, 'sets'],
          [w.records ?? 0, (w.records ?? 0) === 1 ? 'record' : 'records'],
        ].map(([v, l], i) => (
          <div key={i} className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[20px] font-medium tabular-nums">{v}</span>
            <span className="truncate text-[12px] text-ink-muted">{l}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 px-[18px] pb-4 text-[14px] text-ink-soft">
        <button type="button" onClick={fire} aria-pressed={p.flamed} aria-label={`Fire, ${p.flames}`} className={`flex h-9 items-center gap-1.5 rounded-pill px-3 ${p.flamed ? 'bg-accent/25 text-ink' : 'bg-white/10 text-ink'}`}>
          <Flame size={14} strokeWidth={2} className="text-accent-soft" aria-hidden />
          {p.flames}
        </button>
        <button type="button" onClick={() => setTalk(!talk)} className="flex items-center gap-1.5">
          <MessageCircle size={15} strokeWidth={1.8} aria-hidden />
          {p.comments.length || ''}
        </button>
      </div>
      {talk && (
        <div className="flex flex-col gap-2 border-t hairline px-[18px] py-3">
          {p.comments.map((c) => (
            <span key={c.id} className="text-[14px] leading-5 text-ink-soft">
              <span className="font-medium text-ink">{c.mine ? 'You' : c.name}</span> {c.text}
            </span>
          ))}
          <form
            className="mt-1 flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void comment();
            }}
          >
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Comment" aria-label="Comment" maxLength={FEED_LIMIT.comment} className="h-10 min-w-0 flex-1 rounded-pill bg-white/[0.06] px-4 text-[14px] text-ink outline-none placeholder:text-ink-faint" />
            <button type="submit" disabled={!text.trim()} className="h-10 press btn-primary rounded-pill px-4 text-[13px] font-medium text-base disabled:opacity-30">
              Post
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
