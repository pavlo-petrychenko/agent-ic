import { EditorContent } from '@tiptap/react';
import clsx from 'clsx';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { useId, useMemo } from 'react';
import { KnownVariablesContext } from '@/shared/ui/inputs/PromptEditor/knownVariables.context';
import {
  PROMPT_EDITOR_MENU_SIDE_OFFSET,
  PROMPT_EDITOR_MENU_SUFFIX,
  PROMPT_EDITOR_MESSAGE_SUFFIX,
  PROMPT_EDITOR_OPTION_SUFFIX,
} from '@/shared/ui/inputs/PromptEditor/PromptEditor.constants';
import type { PromptEditorProps } from '@/shared/ui/inputs/PromptEditor/PromptEditor.typedefs';
import { usePromptEditor } from '@/shared/ui/inputs/PromptEditor/usePromptEditor';
import { useVariableMenu } from '@/shared/ui/inputs/PromptEditor/useVariableMenu';
import styles from '@/shared/ui/inputs/PromptEditor/PromptEditor.module.scss';

export function PromptEditor({
  value,
  onChange,
  variables,
  label,
  menuLabel,
  height = null,
  invalid = false,
  error = null,
  readOnly = false,
  readOnlyReason = null,
  disabled = false,
  placeholder = null,
  className,
}: PromptEditorProps) {
  const id = useId();
  const menuId = `${id}${PROMPT_EDITOR_MENU_SUFFIX}`;
  const messageId = `${id}${PROMPT_EDITOR_MESSAGE_SUFFIX}`;
  const editable = !readOnly && !disabled;
  const message = error ?? (readOnly ? readOnlyReason : null);
  const hasError = invalid || error !== null;

  const menu = useVariableMenu({ variables, enabled: editable });
  const activeOption = menu.open ? menu.options[menu.activeIndex] : undefined;
  const optionId = (index: number) => `${id}${PROMPT_EDITOR_OPTION_SUFFIX}${index}`;

  const editor = usePromptEditor({
    value,
    onChange,
    editable,
    label,
    invalid: hasError,
    readOnly,
    describedBy: message === null ? null : messageId,
    menuId,
    activeOptionId: activeOption === undefined ? null : optionId(menu.activeIndex),
    onSync: menu.sync,
    onKeyDown: menu.handleKeyDown,
  });

  const knownVariables = useMemo(
    () => new Set(variables.map((variable) => variable.id)),
    [variables],
  );
  const anchorRef = useMemo(
    () => ({ current: { getBoundingClientRect: () => menu.anchor ?? new DOMRect() } }),
    [menu.anchor],
  );

  return (
    <div className={clsx(styles.root, disabled && styles.disabled, className)}>
      <div
        className={clsx(styles.surface, hasError && styles.invalid, readOnly && styles.readOnly)}
        style={height === null ? undefined : { height }}
      >
        {placeholder !== null && value === '' && (
          <span aria-hidden="true" className={styles.placeholder}>
            {placeholder}
          </span>
        )}
        <KnownVariablesContext.Provider value={knownVariables}>
          <EditorContent editor={editor} />
        </KnownVariablesContext.Provider>
      </div>
      {message !== null && (
        <p id={messageId} className={clsx(styles.message, hasError && styles.error)}>
          {message}
        </p>
      )}
      <PopoverPrimitive.Root open={menu.open} onOpenChange={(next) => !next && menu.dismiss()}>
        <PopoverPrimitive.Anchor virtualRef={anchorRef} />
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            side="bottom"
            align="start"
            sideOffset={PROMPT_EDITOR_MENU_SIDE_OFFSET}
            className={styles.popover}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
          >
            <div
              id={menuId}
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
              role="listbox"
              tabIndex={-1}
              aria-label={menuLabel}
              className={styles.menu}
              onMouseDown={(event) => event.preventDefault()}
            >
              {menu.options.map((option, index) => (
                // oxlint-disable-next-line jsx-a11y/click-events-have-key-events
                <div
                  key={option.id}
                  id={optionId(index)}
                  // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
                  role="option"
                  tabIndex={-1}
                  aria-selected={index === menu.activeIndex}
                  className={styles.option}
                  onMouseMove={() => menu.setActiveIndex(index)}
                  onClick={() => menu.insert(option)}
                >
                  <span className={styles.optionLabel}>{option.label}</span>
                  <span className={styles.optionGroup}>{option.group}</span>
                </div>
              ))}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}
