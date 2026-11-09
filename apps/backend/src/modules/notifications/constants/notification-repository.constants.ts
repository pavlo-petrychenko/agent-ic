import { sql } from 'drizzle-orm';

export const RUNS_SCHEMA = 'runs';
export const RUN_STEPS_TABLE = 'run_steps';
export const RUNS_TABLE = 'runs';
export const NOTIFICATIONS_TABLE = 'notifications';
export const CONVERSATIONS_SCHEMA = 'conversations';
export const CONVERSATIONS_TABLE = 'conversations';
export const NEEDS_PERSON_CONVERSATION_FILTER = sql`c.mode = 'live' and c.state = 'waiting'`;
