import { ChannelSelectionMode, FLOW_SCHEMA_VERSION, NodeType } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import {
  INITIAL_TRIGGER_KEY,
  INITIAL_TRIGGER_LABEL,
  INITIAL_TRIGGER_POSITION,
} from '@/modules/agents/constants/agent.constants';

export const initialAgentFlow = (triggerNodeId: string): FlowDocument => ({
  schemaVersion: FLOW_SCHEMA_VERSION,
  nodes: [
    {
      id: triggerNodeId,
      key: INITIAL_TRIGGER_KEY,
      label: INITIAL_TRIGGER_LABEL,
      position: { ...INITIAL_TRIGGER_POSITION },
      type: NodeType.TriggerMessage,
      config: { channels: { mode: ChannelSelectionMode.All } },
    },
  ],
  edges: [],
});
