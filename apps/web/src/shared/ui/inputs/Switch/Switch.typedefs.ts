interface SwitchBaseProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
}

interface SwitchLabelledProps {
  label: string;
  'aria-label'?: string;
}

interface SwitchUnlabelledProps {
  label?: null;
  'aria-label': string;
}

export type SwitchProps = SwitchBaseProps & (SwitchLabelledProps | SwitchUnlabelledProps);
