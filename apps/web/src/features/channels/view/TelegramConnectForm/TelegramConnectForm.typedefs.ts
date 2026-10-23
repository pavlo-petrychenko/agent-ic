import type { SelectOption } from '@/shared/ui/inputs/Select';

export interface TelegramConnectFormProps {
  readonly token: string;
  readonly tokenError: string | null;
  readonly agentId: string;
  readonly agentOptions: readonly SelectOption[];
  readonly onTokenChange: (value: string) => void;
  readonly onAgentChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
}
