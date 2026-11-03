import { INBOX_RUN_STEP_ICON } from '@/features/inbox/constants/inbox.constants';
import type {
  InboxConversation,
  InboxDetailRow,
  InboxDetailsProps,
  InboxGuardView,
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

const addRow = <T>(
  rows: InboxDetailRow[],
  value: T | null,
  build: (value: T) => InboxDetailRow,
): void => {
  if (value !== null) {
    rows.push(build(value));
  }
};

const guardView = (conversation: InboxConversation, t: InboxTranslate): InboxGuardView | null =>
  conversation.guard === null
    ? null
    : {
        title: t('details.guard'),
        badge: t('details.completion'),
        lines: [
          t('details.needsHuman'),
          t('details.reason', { reason: conversation.guard.reason }),
        ],
      };

const runView = (conversation: InboxConversation, t: InboxTranslate): InboxRunView | null =>
  conversation.run === null
    ? null
    : {
        title: t('details.pathInRun'),
        linkLabel: t('details.openInLangfuse'),
        steps: conversation.run.steps.map((step) => ({
          id: step.id,
          icon: INBOX_RUN_STEP_ICON[step.kind],
          label: t(`steps.${step.kind}`),
          value: step.value,
        })),
        footer: t('details.runMeta', {
          id: conversation.run.id,
          time: conversation.run.time,
          duration: conversation.run.duration,
        }),
      };

const inboxDetailRows = (
  conversation: InboxConversation,
  providerLabels: InboxProviderLabels,
  t: InboxTranslate,
): readonly InboxDetailRow[] => {
  const { facts } = conversation;
  const rows: InboxDetailRow[] = [
    detailRow(
      'agent',
      t('details.agent'),
      `${conversation.agentName} · v${conversation.agentVersion}`,
    ),
    detailRow(
      'channel',
      t('details.channel'),
      `${providerLabels[conversation.provider]} · ${facts.channel}`,
    ),
  ];
  addRow(rows, facts.replyTarget, (value) =>
    detailRow('reply-target', t('details.repliesGoTo'), value),
  );
  addRow(rows, facts.startedAt, (value) => detailRow('started', t('details.started'), value));
  addRow(rows, facts.escalatedAt, (value) => detailRow('escalated', t('details.escalated'), value));
  addRow(rows, facts.notified, (value) => detailRow('notified', t('details.notified'), value));
  addRow(rows, facts.handledBy, (value) => detailRow('handled-by', t('details.handledBy'), value));
  addRow(rows, facts.runs, (value) => detailRow('runs', t('details.runs'), String(value)));
  if (facts.agentAnswering) {
    rows.push(detailRow('status', t('details.status'), null, t('details.agentAnswering')));
  }
  addRow(rows, facts.closedAt, (value) => detailRow('closed', t('details.closed'), value));
  return rows;
};

export const inboxDetails = (
  conversation: InboxConversation,
  providerLabels: InboxProviderLabels,
  t: InboxTranslate,
): InboxDetailsProps => ({
  label: t('details.label'),
  title: t('details.whyEscalated'),
  guard: guardView(conversation, t),
  run: runView(conversation, t),
  conversation: {
    title: t('details.conversation'),
    rows: inboxDetailRows(conversation, providerLabels, t),
  },
  sessionLinkLabel: conversation.guard === null ? t('details.openSessionInLangfuse') : null,
});
