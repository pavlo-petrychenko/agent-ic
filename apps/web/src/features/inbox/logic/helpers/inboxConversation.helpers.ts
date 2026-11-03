import {
  InboxActionId,
  InboxDividerKind,
  InboxFooterKind,
  InboxMessageKind,
  InboxProvider,
  InboxReplyState,
} from '@/features/inbox/constants/inbox.constants';
import type {
  InboxActionSpec,
  InboxBannerResolver,
  InboxConversation,
  InboxConversationAction,
  InboxConversationBanner,
  InboxConversationFooter,
  InboxFooterContext,
  InboxFooterResolver,
  InboxMessage,
  InboxStoredMessage,
  InboxTranslate,
  InboxStoredDivider,
} from '@/features/inbox/typedefs/inbox.typedefs';
import { ButtonVariant } from '@/shared/ui/actions/Button';
import { BannerTone } from '@/shared/ui/display/Banner';
import { IconName } from '@/shared/ui/foundations/Icon';

const action = (
  id: InboxActionId,
  variant: ButtonVariant,
  icon: IconName | null,
  label: InboxActionSpec['label'],
): InboxActionSpec => ({ id, variant, icon, label });

const takeOver = (variant: ButtonVariant, label: InboxActionSpec['label']): InboxActionSpec =>
  action(InboxActionId.TakeOver, variant, IconName.Hand, label);

const INBOX_ACTIONS: Readonly<Record<InboxReplyState, readonly InboxActionSpec[]>> = {
  [InboxReplyState.Mine]: [
    action(InboxActionId.Close, ButtonVariant.Secondary, null, (_conversation, t) =>
      t('header.closeChat'),
    ),
    action(InboxActionId.HandBack, ButtonVariant.Primary, IconName.Hand, (_conversation, t) =>
      t('header.handBack'),
    ),
  ],
  [InboxReplyState.Waiting]: [
    takeOver(ButtonVariant.Primary, (_conversation, t) => t('header.takeOver')),
  ],
  [InboxReplyState.Operator]: [
    takeOver(ButtonVariant.Secondary, (conversation, t) =>
      t('header.takeOverFrom', { name: conversation.assigneeName ?? '' }),
    ),
  ],
  [InboxReplyState.Agent]: [
    takeOver(ButtonVariant.Secondary, (_conversation, t) => t('header.takeOverAgain')),
  ],
  [InboxReplyState.Closed]: [],
};

const INBOX_BANNERS: Readonly<Record<InboxReplyState, InboxBannerResolver>> = {
  [InboxReplyState.Mine]: (_conversation, t) => ({
    tone: BannerTone.Info,
    icon: IconName.Hand,
    text: t('banner.mine'),
  }),
  [InboxReplyState.Waiting]: (conversation, t) => ({
    tone: BannerTone.Warn,
    icon: IconName.Pause,
    text: t('banner.waiting', { count: conversation.minutesAgo }),
  }),
  [InboxReplyState.Operator]: (conversation, t) => ({
    tone: BannerTone.Info,
    icon: IconName.Hand,
    text: t('banner.other', {
      name: conversation.assigneeName ?? '',
      time: conversation.facts.handledSince ?? '',
    }),
  }),
  [InboxReplyState.Agent]: () => null,
  [InboxReplyState.Closed]: () => null,
};

const INBOX_FOOTERS: Readonly<Record<InboxReplyState, InboxFooterResolver>> = {
  [InboxReplyState.Mine]: (conversation, context, t) => ({
    kind: InboxFooterKind.Composer,
    note: t('footer.replyAs', {
      name: context.currentUserName,
      channel: context.providerLabels[conversation.provider],
    }),
    placeholder: t('footer.placeholder'),
    sendLabel: t('footer.send'),
    value: context.composer.value,
    sending: context.composer.sending,
    onChange: context.composer.onChange,
    onSend: context.composer.onSend,
  }),
  [InboxReplyState.Waiting]: (_conversation, context, t) => ({
    kind: InboxFooterKind.TakeOver,
    label: t('footer.takeOver'),
    disabled: context.takeOverPending,
    onTakeOver: context.onTakeOver,
  }),
  [InboxReplyState.Operator]: (conversation, _context, t) => ({
    kind: InboxFooterKind.Note,
    text:
      conversation.provider === InboxProvider.Api ? t('footer.apiWebhook') : t('footer.telegram'),
  }),
  [InboxReplyState.Agent]: (_conversation, _context, t) => ({
    kind: InboxFooterKind.Note,
    text: t('footer.agentAnswering'),
  }),
  [InboxReplyState.Closed]: (_conversation, _context, t) => ({
    kind: InboxFooterKind.Note,
    text: t('footer.closed'),
  }),
};

const dividerText = (message: InboxStoredDivider, t: InboxTranslate): string => {
  switch (message.divider) {
    case InboxDividerKind.FlowPaused:
      return t('divider.flowPaused', {
        name: message.name,
        time: message.time,
        tookAt: message.tookAt ?? '',
      });
    case InboxDividerKind.Escalated:
      return t('divider.escalated', { time: message.time });
    case InboxDividerKind.TookOver:
      return t('divider.tookOver', {
        name: message.name,
        time: message.time,
      });
    case InboxDividerKind.HandedBack:
      return t('divider.handedBack', { name: message.name, time: message.time });
  }
};

const inboxMessage = (message: InboxStoredMessage, t: InboxTranslate): InboxMessage => {
  switch (message.kind) {
    case InboxMessageKind.Divider:
      return {
        kind: InboxMessageKind.Divider,
        id: message.id,
        text: dividerText(message, t),
        icon: message.icon,
      };
    case InboxMessageKind.Escalation:
      return {
        kind: InboxMessageKind.Escalation,
        id: message.id,
        title: t('escalation.title'),
        detail: message.detail,
        time: message.time,
        linkLabel: t('details.openInLangfuse'),
      };
    case InboxMessageKind.Customer:
    case InboxMessageKind.Agent:
    case InboxMessageKind.Operator:
      return {
        kind: message.kind,
        id: message.id,
        author: message.self ? t('authorYou', { name: message.author }) : message.author,
        time: message.time,
        text: message.text,
      };
  }
};

export const inboxMessages = (
  conversation: InboxConversation,
  t: InboxTranslate,
): readonly InboxMessage[] => conversation.messages.map((message) => inboxMessage(message, t));

export const inboxBanner = (
  conversation: InboxConversation,
  t: InboxTranslate,
): InboxConversationBanner | null => INBOX_BANNERS[conversation.replyState](conversation, t);

export const inboxActions = (
  conversation: InboxConversation,
  t: InboxTranslate,
  pendingAction: InboxActionId | null,
): readonly InboxConversationAction[] =>
  INBOX_ACTIONS[conversation.replyState].map((spec) => ({
    id: spec.id,
    label: spec.label(conversation, t),
    variant: spec.variant,
    icon: spec.icon,
    disabled: pendingAction !== null,
  }));

export const inboxFooter = (
  conversation: InboxConversation,
  context: InboxFooterContext,
  t: InboxTranslate,
): InboxConversationFooter => INBOX_FOOTERS[conversation.replyState](conversation, context, t);
