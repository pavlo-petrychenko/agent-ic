import type { IconName } from '@/shared/ui/Icon/Icon.constants';

export interface NavSectionLabelAction {
  label: string;
  onClick: () => void;
  icon?: IconName;
}

export interface NavSectionLabelProps {
  label: string;
  id?: string;
  action?: NavSectionLabelAction | null;
  className?: string;
}
