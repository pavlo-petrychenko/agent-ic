export interface RunScheduleOption {
  id: string;
  name: string;
}

export interface RunScheduleCheck {
  id: string;
  label: string;
  met: boolean;
}

export interface RunScheduleProps {
  options: readonly RunScheduleOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  checks: readonly RunScheduleCheck[];
  loading: boolean;
  disabledReason: string | null;
  error: string | null;
  onRun: () => void;
}
