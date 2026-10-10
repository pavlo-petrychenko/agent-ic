import type { PauseMode } from '@/shared/api/generated/schema.generated';

export interface PauseAgentModalProps {
  agentName: string;
  statusLabel: string;
  liveVersionNumber: number | null;
  mode: PauseMode;
  awayMessage: string;
  awayMessageError: string | null;
  submitting: boolean;
  error: string | null;
  onModeChange: (mode: PauseMode) => void;
  onAwayMessageChange: (text: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}
