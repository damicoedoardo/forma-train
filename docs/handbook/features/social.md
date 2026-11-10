---
type: conceptual
title: Social
description: Friends by code, the card and heartbeat, cheers sent mid-workout, the feed of shared workouts with fire and comments, and photos.
tags: [social, friends, cheers, feed, profile]
timestamp: 2026-11-10
---

# Social

`src/features/social/` is everything between friends. All of it needs sign-in; the server side is
`backend/app/routes/{friends,cheers,feed}.py` (see [the API](../backend/api.md)).

- **`friends.ts`**: your card (`myCard`: last trained, the workout you are doing, your stats),
  the stats friends see (`trainingStats`, and `statsNow` for a stale week), the short status line
  (`statusOf`: the workout, Online, Trained today, or how long ago), friend codes and invite links
  (`showCode`, `codeInUrl`, `inviteLink`), and `PROFILE_LIMIT`.
- **`cheers.ts`**: quick lines, `cleanCheer`, `CHEER_LIMIT`, and what friends see you training
  (`trainingLabel`).
- **`feed.ts`**: a finished session as a post card (`workoutCard`: title, minutes, sets,
  exercises, records), `FEED_LIMIT`, and `newPosts`.
- **`client.ts`**: every call (card, friends, profile and photo, cheers, feed, fire, comments),
  photos fetched once as blob links, and `shrinkPhoto` (an `<img>` decodes it, so phone photos
  stay upright).
- **`ui/useSocial.ts`**: while signed in, sends your card every 30 s (the heartbeat that shows
  you online), fetches cheers every 15 s while you train, and loads your own profile.
- **`ui/FriendsTab.tsx`**: Friends (training now with Cheer, asks to accept, the list, add by
  code or invite link, a friend's sheet with their numbers) and Feed (posts with photo, numbers,
  fire and comments).

The limits in `friends.ts`, `cheers.ts` and `feed.ts` match the server's: change both together.
The server calls fire a "flame" (`/feed/{id}/flame`); the screens say fire.
