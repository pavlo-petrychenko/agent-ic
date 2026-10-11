export interface DeleteAgentModalProps {
  agentName: string;
  versionCount: number;
  typedName: string;
  confirmed: boolean;
  submitting: boolean;
  error: string | null;
  onTypedNameChange: (text: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}
