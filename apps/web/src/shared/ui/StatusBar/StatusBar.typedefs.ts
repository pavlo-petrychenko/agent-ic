import type { StatusTone } from '@/shared/ui/StatusBar/StatusBar.constants';

export interface StatusBarAction {
  label: string;
  onClick: () => void;
}

export interface StatusBarProps {
  tone?: StatusTone;
  label: string;
  detail?: string | null;
  action?: StatusBarAction | null;
  className?: string;
}
