import { useRef, useState } from 'react';
import { NameFieldKey } from '@/features/flow-builder/constants/nameField.constants';
import type { InlineEditFieldProps } from '@/features/flow-builder/view/InlineEditField/InlineEditField.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Input } from '@/shared/ui/inputs/Input';

export function InlineEditField({
  value,
  placeholder,
  editLabel,
  inputLabel,
  maxLength,
  required,
  current,
  onCommit,
}: InlineEditFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const editing = useRef(false);

  const start = () => {
    editing.current = true;
    setDraft(value ?? '');
  };

  const finish = () => {
    editing.current = false;
    setDraft(null);
  };

  const commit = () => {
    const wasEditing = editing.current;
    const next = draft?.trim() ?? '';
    finish();
    if (wasEditing && (next !== '' || !required) && next !== (value ?? '')) {
      onCommit(next);
    }
  };

  return draft === null ? (
    <Button
      variant={ButtonVariant.Ghost}
      title={editLabel}
      aria-current={current ? 'page' : undefined}
      onClick={start}
    >
      {value ?? placeholder}
    </Button>
  ) : (
    <Input
      aria-label={inputLabel}
      value={draft}
      maxLength={maxLength}
      ref={(element) => element?.focus()}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === NameFieldKey.Commit) {
          commit();
        }
        if (event.key === NameFieldKey.Cancel) {
          finish();
        }
      }}
    />
  );
}
