import type { AgentTemplateKey } from '@agent-ic/flow';
import type {
  GuideDefinition,
  GuideExample,
} from '@/features/flow-builder/typedefs/guide.typedefs';

export interface GuideDetailProps {
  guide: GuideDefinition;
  title: string;
  example: GuideExample | null;
  workspaceId: string;
  agentId: string;
  focusTitle: boolean;
  onBack: () => void;
  onClose: () => void;
  onUseTemplate: (key: AgentTemplateKey) => void;
}
