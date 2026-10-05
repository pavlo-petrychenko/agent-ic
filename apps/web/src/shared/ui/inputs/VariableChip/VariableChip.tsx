import clsx from 'clsx';
import {
  VARIABLE_CHIP_CLOSE,
  VARIABLE_CHIP_OPEN,
} from '@/shared/ui/inputs/VariableChip/VariableChip.constants';
import type { VariableChipProps } from '@/shared/ui/inputs/VariableChip/VariableChip.typedefs';
import styles from '@/shared/ui/inputs/VariableChip/VariableChip.module.scss';

export function VariableChip({ path, className }: VariableChipProps) {
  return (
    <span className={clsx(styles.root, className)}>
      {`${VARIABLE_CHIP_OPEN}${path}${VARIABLE_CHIP_CLOSE}`}
    </span>
  );
}
