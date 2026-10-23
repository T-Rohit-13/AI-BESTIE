/**
 * INARO — Dump Mode Notification Message Pool & Rotation (Member 4)
 * 
 * Strict safety guidelines:
 * - Gentle, funny, slightly witty reminders.
 * - Feels like a message from a supportive, playful friend.
 * - Zero medical advice, mental-health warnings, guilt trips, or streak pressure.
 * - Zero mention of missed days, diagnoses, or clinical evaluations.
 */

export interface DumpReminderMessage {
  id: string;
  text: string;
  payload: {
    type: 'dump_reminder';
    route: '/dump';
  };
}

export const DUMP_REMINDER_MESSAGES: readonly DumpReminderMessage[] = [
  {
    id: 'tabs-37',
    text: 'Your brain has 37 tabs open. Wanna dump a few? 👀',
    payload: { type: 'dump_reminder', route: '/dump' },
  },
  {
    id: 'storage-space',
    text: 'Got some thoughts taking up storage space?',
    payload: { type: 'dump_reminder', route: '/dump' },
  },
  {
    id: 'spill-space',
    text: "Okay, spill. We've got space. 👀",
    payload: { type: 'dump_reminder', route: '/dump' },
  },
  {
    id: 'today-episode',
    text: "Today's episode of 'What even happened today?' is waiting.",
    payload: { type: 'dump_reminder', route: '/dump' },
  },
  {
    id: 'brain-storage',
    text: 'Brain storage almost full. Time for a dump? 🧠',
    payload: { type: 'dump_reminder', route: '/dump' },
  },
  {
    id: 'thoughts-called',
    text: "Your thoughts called. They said they're waiting. 👀",
    payload: { type: 'dump_reminder', route: '/dump' },
  },
  {
    id: 'fine-talk',
    text: "Somewhere between 'I'm fine' and 'I need to talk about this'... Dump Mode exists.",
    payload: { type: 'dump_reminder', route: '/dump' },
  },
  {
    id: 'mental-clutter',
    text: "Got a little mental clutter? We've got space.",
    payload: { type: 'dump_reminder', route: '/dump' },
  },
];

/**
 * Selects a message from the pool, ensuring rotation so the user does not receive
 * the exact same message twice in a row.
 * 
 * @param previousMessageId The ID of the message previously sent to this user.
 * @param seed Optional random/index seed for deterministic testing.
 */
export function selectRotatedMessage(
  previousMessageId?: string | null,
  seed?: number
): DumpReminderMessage {
  const eligible = previousMessageId
    ? DUMP_REMINDER_MESSAGES.filter((m) => m.id !== previousMessageId)
    : DUMP_REMINDER_MESSAGES;

  const pool = eligible.length > 0 ? eligible : DUMP_REMINDER_MESSAGES;

  const index = seed !== undefined
    ? Math.abs(seed) % pool.length
    : Math.floor(Math.random() * pool.length);

  return pool[index];
}
