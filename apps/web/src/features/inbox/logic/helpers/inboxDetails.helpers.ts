import {
  InboxGuardKind,
  InboxNotifyChannel,
  InboxReplyState,
  InboxReplyTarget,
} from '@/features/inbox/constants/inbox.constants';
import type {
  InboxConversation,
  InboxConversationFacts,
  InboxDetailRow,
  InboxDetailsView,
  InboxGuardView,
  InboxNotified,
  InboxProviderLabels,
  InboxRunView,
  InboxTranslate,
} from '@/features/inbox/typedefs/inbox.typedefs';

const detailRow = (
  id: string,
  label: string,
  value: string | null,
  badge: string | null = null,
): InboxDetailRow => ({ id, label, value, badge });

const push = (rows: InboxDetailRow[], row: InboxDetailRow | null): void => {
  if (row !== null) {
    rows.push(row);
  }
};

const NOTIFY_CHANNEL_KEY = {
  [InboxNotifyChannel.InPlatform]: 'details.notifyChannels.inPlatform',
  [InboxNotifyChannel.Email]: 'details.notifyChannels.email',
  [InboxNotifyChannel.Telegram]: 'details.notifyChannels.telegram',
} as const;

const REPLY_TARGET_KEY = {
  [InboxReplyTarget.Response]: 'details.theApiCaller',
  [InboxReplyTarget.Webhook]: 'details.yourWebhook',
} as const;

const GUARD_BADGE_KEY = {
  [InboxGuardKind.Completion]: 'details.completion',
  [InboxGuardKind.Agent]: 'details.agent',
  [InboxGuardKind.Escalation]: 'details.escalation',
} as const;

const notifiedValue = (notified: InboxNotified, t: InboxTranslate): string => {
  const names = notified.allOperators ? t('details.allOperators') : notified.names.join(', ');
  const channels = notified.channels.map((channel) => t(NOTIFY_CHANNEL_KEY[channel])).join(', ');
  return names === '' ? channels : `${names} · ${channels}`;
};

const handledValue = (facts: InboxConversationFacts, t: InboxTranslate): string | null => {
  if (facts.handledBy === null) {
    return null;
  }
  if (facts.handledSince !== null && facts.handledUntil !== null) {
    return `${facts.handledBy} · ${facts.handledSince}–${facts.handledUntil}`;
  }
  if (facts.handledSince === null) {
    return facts.handledBy;
  }
  return `${facts.handledBy} · ${t('details.since', { time: facts.handledSince })}`;
};

const guardView = (conversation: InboxConversation, t: InboxTranslate): InboxGuardView | null => {
  const { guard } = conversation;
  if (guard === null) {
    return null;
  }
  const reason =
    guard.reason === null || guard.reason === ''
      ? []
      : [t('details.reason', { reason: guard.reason })];
  return {
    title: guard.label === '' ? t('details.guard') : guard.label,
    badge: t(GUARD_BADGE_KEY[guard.kind]),
    lines: [t('details.needsHuman'), ...reason],
  };
};

const runView = (conversation: InboxConversation, t: InboxTranslate): InboxRunView | null => {
  const { run } = conversation;
  if (run === null) {
    return null;
  }
  return {
    title: t('details.pathInRun'),
    linkLabel: t('details.openInLangfuse'),
    steps: run.steps.map((step) => ({
      id: step.id,
      icon: step.icon,
      label: step.label,
      value: step.value,
    })),
    footer: t('details.runMeta', {
      id: run.id,
      time: run.time,
      duration: run.duration,
    }),
  };
};

const baseRows = (
  conversation: InboxConversation,
  providerLabels: InboxProviderLabels,
  t: InboxTranslate,
): InboxDetailRow[] => [
  detailRow(
    'agent',
    t('details.agent'),
    `${conversation.agentName} · v${conversation.run?.agentVersion ?? conversation.agentVersion}`,
  ),
  detailRow(
    'channel',
    t('details.channel'),
    conversation.facts.channel === ''
      ? providerLabels[conversation.provider]
      : `${providerLabels[conversation.provider]} · ${conversation.facts.channel}`,
  ),
];

const replyTargetRow = (facts: InboxConversationFacts, t: InboxTranslate): InboxDetailRow | null =>
  facts.replyTarget === null
    ? null
    : detailRow('reply-target', t('details.repliesGoTo'), t(REPLY_TARGET_KEY[facts.replyTarget]));

const waitingRows = (
  conversation: InboxConversation,
  providerLabels: InboxProviderLabels,
  t: InboxTranslate,
): readonly InboxDetailRow[] => {
  const { facts } = conversation;
  const rows = baseRows(conversation, providerLabels, t);
  push(rows, replyTargetRow(facts, t));
  push(
    rows,
    facts.escalatedAt === null
      ? null
      : detailRow('escalated', t('details.escalated'), facts.escalatedAt),
  );
  push(
    rows,
    facts.notified === null
      ? null
      : detailRow('notified', t('details.notified'), notifiedValue(facts.notified, t)),
  );
  return rows;
};

const mineRows = (
  conversation: InboxConversation,
  providerLabels: InboxProviderLabels,
  t: InboxTranslate,
): readonly InboxDetailRow[] => {
  const { facts } = conversation;
  const rows = baseRows(conversation, providerLabels, t);
  push(
    rows,
    facts.startedAt === null ? null : detailRow('started', t('details.started'), facts.startedAt),
  );
  push(rows, replyTargetRow(facts, t));
  push(
    rows,
    facts.notified === null
      ? null
      : detailRow('notified', t('details.notified'), notifiedValue(facts.notified, t)),
  );
  push(rows, facts.runs === null ? null : detailRow('runs', t('details.runs'), String(facts.runs)));
  return rows;
};

const operatorRows = (
  conversation: InboxConversation,
  providerLabels: InboxProviderLabels,
  t: InboxTranslate,
): readonly InboxDetailRow[] => {
  const { facts } = conversation;
  const rows = baseRows(conversation, providerLabels, t);
  push(rows, replyTargetRow(facts, t));
  const handled = handledValue(facts, t);
  push(rows, handled === null ? null : detailRow('handled-by', t('details.handledBy'), handled));
  return rows;
};

const agentActiveRows = (
  conversation: InboxConversation,
  providerLabels: InboxProviderLabels,
  t: InboxTranslate,
): readonly InboxDetailRow[] => {
  const { facts } = conversation;
  const rows = baseRows(conversation, providerLabels, t);
  push(
    rows,
    facts.escalatedAt === null
      ? null
      : detailRow('escalated', t('details.escalated'), facts.escalatedAt),
  );
  const handled = handledValue(facts, t);
  push(rows, handled === null ? null : detailRow('handled-by', t('details.handledBy'), handled));
  push(
    rows,
    facts.agentAnswering
      ? detailRow('status', t('details.status'), null, t('details.agentAnswering'))
      : null,
  );
  return rows;
};

const closedRows = (
  conversation: InboxConversation,
  providerLabels: InboxProviderLabels,
  t: InboxTranslate,
): readonly InboxDetailRow[] => {
  const { facts } = conversation;
  const rows = baseRows(conversation, providerLabels, t);
  push(
    rows,
    facts.escalatedAt === null
      ? null
      : detailRow('escalated', t('details.escalated'), facts.escalatedAt),
  );
  const handled = handledValue(facts, t);
  push(rows, handled === null ? null : detailRow('handled-by', t('details.handledBy'), handled));
  push(
    rows,
    facts.closedAt === null ? null : detailRow('closed', t('details.closed'), facts.closedAt),
  );
  return rows;
};

const INBOX_DETAIL_ROWS: Readonly<
  Record<
    InboxReplyState,
    (
      conversation: InboxConversation,
      providerLabels: InboxProviderLabels,
      t: InboxTranslate,
    ) => readonly InboxDetailRow[]
  >
> = {
  [InboxReplyState.Waiting]: waitingRows,
  [InboxReplyState.Mine]: mineRows,
  [InboxReplyState.Operator]: operatorRows,
  [InboxReplyState.Agent]: agentActiveRows,
  [InboxReplyState.Closed]: closedRows,
};

const visibleGuard = (conversation: InboxConversation): boolean =>
  conversation.replyState === InboxReplyState.Waiting ||
  conversation.replyState === InboxReplyState.Mine ||
  conversation.replyState === InboxReplyState.Operator;

const visibleRun = (conversation: InboxConversation): boolean =>
  conversation.replyState === InboxReplyState.Mine;

const sessionLinkLabel = (conversation: InboxConversation, t: InboxTranslate): string | null => {
  if (visibleRun(conversation) && conversation.run !== null) {
    return null;
  }
  return visibleGuard(conversation) && conversation.guard !== null
    ? t('details.openRunInLangfuse')
    : t('details.openSessionInLangfuse');
};

export const inboxDetails = (
  conversation: InboxConversation,
  providerLabels: InboxProviderLabels,
  t: InboxTranslate,
): InboxDetailsView => ({
  label: t('details.label'),
  title: t('details.whyEscalated'),
  guard: visibleGuard(conversation) ? guardView(conversation, t) : null,
  run: visibleRun(conversation) ? runView(conversation, t) : null,
  conversation: {
    title: t('details.conversation'),
    rows: INBOX_DETAIL_ROWS[conversation.replyState](conversation, providerLabels, t),
  },
  sessionLinkLabel: sessionLinkLabel(conversation, t),
});
