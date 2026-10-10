import { useRef, useState } from 'react';
import { NameFieldKey } from '@/features/flow-builder/constants/nameField.constants';
import type { InlineEditFieldProps } from '@/features/flow-builder/view/InlineEditField/InlineEditField.typedefs';
import { Input } from '@/shared/ui/inputs/Input';
import styles from '@/features/flow-builder/view/InlineEditField/InlineEditField.module.scss';

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
    <button
      type="button"
      title={editLabel}
      aria-current={current ? 'page' : undefined}
      className={styles.value}
      onClick={start}
    >
      {value ?? placeholder}
    </button>
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
