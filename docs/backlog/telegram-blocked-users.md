# Telegram users who blocked the bot

## Now
- Telegram answers 403 "bot was blocked by the user" when a bot messages someone who blocked it. Nothing records this.
- Proactive runs (schedule and inactivity triggers) can pick these conversations and fail on delivery every time.

## When the Telegram adapter lands
1. A 403 "blocked" on delivery sets `conversations.end_user_blocked_at`.
2. The next incoming message from that user clears it.
3. The schedule candidate query and the inactivity timer check skip conversations with `end_user_blocked_at` set.
4. A delivery listener test with the Telegram fake.

## Depends on
- The Telegram outbound adapter in the channels area.
