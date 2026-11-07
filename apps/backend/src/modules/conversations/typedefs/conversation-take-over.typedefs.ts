import type { TelegramTakeOverOutcomeKind } from '@/modules/conversations/constants/conversation-take-over.constants';
import type { ConversationView } from '@/modules/conversations/typedefs/simulation.typedefs';

export type TelegramTakeOverOutcome =
  | {
      readonly kind: TelegramTakeOverOutcomeKind.TakenOver;
      readonly conversation: ConversationView;
    }
  | { readonly kind: TelegramTakeOverOutcomeKind.SameUser }
  | { readonly kind: TelegramTakeOverOutcomeKind.OtherUser; readonly name: string | null }
  | { readonly kind: TelegramTakeOverOutcomeKind.Closed };
