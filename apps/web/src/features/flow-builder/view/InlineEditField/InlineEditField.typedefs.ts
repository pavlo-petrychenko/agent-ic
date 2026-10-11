export interface InlineEditFieldProps {
  value: string | null;
  placeholder: string;
  editLabel: string;
  inputLabel: string;
  maxLength: number;
  required: boolean;
  current: boolean;
  onCommit: (value: string) => void;
}
