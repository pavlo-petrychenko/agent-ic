import type { ReactNode } from 'react';
import type {
  CHECKBOX_INDETERMINATE,
  CheckboxAlign,
} from '@/shared/ui/Checkbox/Checkbox.constants';

export type CheckboxCheckedState = boolean | typeof CHECKBOX_INDETERMINATE;

interface CheckboxBaseProps {
  checked: CheckboxCheckedState;
  onCheckedChange: (checked: boolean) => void;
  description?: ReactNode | null;
  align?: CheckboxAlign;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
  id?: string;
  className?: string;
}

interface CheckboxLabelledProps {
  label: ReactNode;
  'aria-label'?: string;
}

interface CheckboxUnlabelledProps {
  label?: null;
  'aria-label': string;
}

export type CheckboxProps = CheckboxBaseProps & (CheckboxLabelledProps | CheckboxUnlabelledProps);
