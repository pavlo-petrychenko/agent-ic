import type { InboxActionId, InboxFooterKind } from '@/features/inbox/constants/inbox.constants';
import type {
  InboxProviderLabels,
  InboxTranslate,
} from '@/features/inbox/typedefs/common.typedefs';
import type { InboxConversation } from '@/features/inbox/typedefs/conversation.typedefs';
import type { ButtonVariant } from '@/shared/ui/actions/Button';
import type { BannerTone } from '@/shared/ui/display/Banner';
import type { IconName } from '@/shared/ui/foundations/Icon';

export interface InboxConversationAction {
  readonly id: InboxActionId;
  readonly label: string;
  readonly variant: ButtonVariant;
  readonly icon: IconName | null;
  readonly disabled: boolean;
}

export interface InboxConversationBanner {
  readonly tone: BannerTone;
  readonly icon: IconName | null;
  readonly text: string;
}

interface InboxComposerFooter {
  readonly kind: InboxFooterKind.Composer;
  readonly note: string;
  readonly placeholder: string;
  readonly sendLabel: string;
  readonly value: string;
  readonly sending: boolean;
  readonly onChange: (value: string) => void;
  readonly onSend: () => void;
}

interface InboxNoteFooter {
  readonly kind: InboxFooterKind.Note;
  readonly text: string;
}

interface InboxTakeOverFooter {
  readonly kind: InboxFooterKind.TakeOver;
  readonly label: string;
  readonly disabled: boolean;
  readonly onTakeOver: () => void;
}

export type InboxConversationFooter = InboxComposerFooter | InboxNoteFooter | InboxTakeOverFooter;

export interface InboxActionSpec {
  readonly id: InboxActionId;
  readonly variant: ButtonVariant;
  readonly icon: IconName | null;
  readonly label: (conversation: InboxConversation, t: InboxTranslate) => string;
}

export type InboxBannerResolver = (
  conversation: InboxConversation,
  t: InboxTranslate,
) => InboxConversationBanner | null;

export type InboxFooterResolver = (
  conversation: InboxConversation,
  context: InboxFooterContext,
  t: InboxTranslate,
) => InboxConversationFooter;

export interface InboxComposerState {
  readonly value: string;
  readonly sending: boolean;
  readonly onChange: (value: string) => void;
  readonly onSend: () => void;
}

export interface InboxFooterContext {
  readonly providerLabels: InboxProviderLabels;
  readonly composer: InboxComposerState;
  readonly currentUserName: string;
  readonly takeOverPending: boolean;
  readonly onTakeOver: () => void;
}
