import type { Conversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import type { SimulationSetup } from '@/modules/conversations/typedefs/simulation.typedefs';

export const hasSimulationSetup = (conversation: Conversation, setup: SimulationSetup): boolean =>
  conversation.simulationVersionId === setup.versionId &&
  conversation.channelKind === setup.channelKind &&
  conversation.endUserLanguage === setup.language;
