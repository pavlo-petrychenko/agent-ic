import type { FlowDocument } from '@agent-ic/flow';
import type { SaveState } from '@/features/flow-builder/constants/saveState.constants';

export interface PublishDialogProps {
  agentId: string;
  agentName: string;
  document: FlowDocument;
  revision: number;
  saveState: SaveState;
  onFix: (nodeId: string) => void;
  onPublished: () => void;
  onClose: () => void;
}
