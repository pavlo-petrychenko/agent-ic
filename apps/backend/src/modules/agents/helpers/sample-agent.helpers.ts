import { PortName } from '@agent-ic/flow';
import {
  EXAMPLE_HANDOFF_EXIT,
  EXAMPLE_TRIGGER_KEY,
} from '@/modules/agents/constants/flow-example-nodes.constants';
import {
  SAMPLE_AGENT_DESCRIPTION,
  SAMPLE_AGENT_NAME,
  SAMPLE_ANSWER_KEY,
  SAMPLE_ANSWER_LABEL,
  SAMPLE_HAND_OFF_KEY,
  SAMPLE_HAND_OFF_LABEL,
  SAMPLE_HAND_OFF_REASON,
  SAMPLE_REPLY_KEY,
  SAMPLE_REPLY_LABEL,
  SAMPLE_REPLY_VARIABLE,
} from '@/modules/agents/constants/sample-agent.constants';
import { SamplePromptKey } from '@/modules/agents/constants/sample-prompt.constants';
import {
  exampleAgent,
  exampleHandOff,
  examplePrompt,
  exampleSendReply,
  exampleTrigger,
  link,
} from '@/modules/agents/helpers/flow-example-nodes.helpers';
import type { FlowExample } from '@/modules/agents/typedefs/flow-example.typedefs';
import type { SamplePromptRefs } from '@/modules/agents/typedefs/sample-prompt.typedefs';

export const sampleAgentExample = (prompts: SamplePromptRefs): FlowExample => ({
  name: SAMPLE_AGENT_NAME,
  description: SAMPLE_AGENT_DESCRIPTION,
  nodes: [
    exampleTrigger([0, 0]),
    exampleAgent(
      SAMPLE_ANSWER_KEY,
      SAMPLE_ANSWER_LABEL,
      [0, 1],
      examplePrompt(prompts[SamplePromptKey.CafeAssistant]),
      [],
      EXAMPLE_HANDOFF_EXIT,
    ),
    exampleSendReply(SAMPLE_REPLY_KEY, SAMPLE_REPLY_LABEL, [0, 2], SAMPLE_REPLY_VARIABLE),
    exampleHandOff(SAMPLE_HAND_OFF_KEY, SAMPLE_HAND_OFF_LABEL, [1, 2], SAMPLE_HAND_OFF_REASON),
  ],
  edges: [
    link(EXAMPLE_TRIGGER_KEY, SAMPLE_ANSWER_KEY),
    link(SAMPLE_ANSWER_KEY, SAMPLE_REPLY_KEY),
    link(SAMPLE_ANSWER_KEY, SAMPLE_HAND_OFF_KEY, PortName.Error),
  ],
});
