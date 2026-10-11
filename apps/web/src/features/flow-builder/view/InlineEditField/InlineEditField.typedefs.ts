export interface InlineEditFieldProps {
  value: string | null;
  placeholder: string;
  editLabel: string;
  inputLabel: string;
  maxLength: number;
  required: boolean;
  current: boolean;
  inheritFont?: boolean;
  flush?: boolean;
  onCommit: (value: string) => void;
}
