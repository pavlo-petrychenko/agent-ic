import type { Density } from '@/features/flow-builder/constants/density.constants';

export interface CanvasToolbarProps {
  density: Density;
  onDensityChange: (density: Density) => void;
}
