import type { DividerOrientation } from '@/shared/ui/layout/Divider/Divider.constants';

export interface DividerProps {
  orientation?: DividerOrientation;
  decorative?: boolean;
  className?: string;
}
