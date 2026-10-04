export interface ServerStatusProps {
  version: string | null;
  uptimeLabel: string | null;
  loading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}
