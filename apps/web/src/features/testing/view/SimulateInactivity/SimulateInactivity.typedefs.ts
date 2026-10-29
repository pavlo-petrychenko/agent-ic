export interface SimulateInactivityProps {
  hint: string;
  loading: boolean;
  disabled: boolean;
  error: string | null;
  onSimulate: () => void;
}
