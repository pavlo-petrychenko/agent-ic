import clsx from 'clsx';
import { type ChangeEvent, type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import {
  COMBOBOX_CHECK_SIZE,
  COMBOBOX_CHEVRON_SIZE,
  COMBOBOX_CREATE_VALUE,
  COMBOBOX_ERROR_ID_SUFFIX,
} from '@/shared/ui/inputs/Combobox/Combobox.constants';
import type {
  ComboboxGroup,
  ComboboxOption,
  ComboboxProps,
  ComboboxSection,
} from '@/shared/ui/inputs/Combobox/Combobox.typedefs';
import { SearchInput } from '@/shared/ui/inputs/SearchInput';
import { Popover } from '@/shared/ui/overlays/Popover';
import styles from '@/shared/ui/inputs/Combobox/Combobox.module.scss';

function sectionsOf(
  options: readonly ComboboxOption[],
  groups: readonly ComboboxGroup[],
  createOption: ComboboxOption | null,
): readonly ComboboxSection[] {
  const known = new Set(groups.map((group) => group.id));
  const inGroup = (option: ComboboxOption, id: string | null) =>
    id === null ? option.group === undefined || !known.has(option.group) : option.group === id;
  const withCreate = (id: string | null, listed: readonly ComboboxOption[]) =>
    createOption !== null && (createOption.group ?? null) === id
      ? [...listed, createOption]
      : listed;
  return [
    {
      group: null,
      options: withCreate(
        null,
        options.filter((option) => inGroup(option, null)),
      ),
    },
    ...groups.map((group) => ({
      group,
      options: withCreate(
        group.id,
        options.filter((option) => inGroup(option, group.id)),
      ),
    })),
  ];
}

export function Combobox({
  value,
  options,
  onChange,
  searchLabel,
  searchClearLabel,
  emptyLabel,
  createLabel = null,
  onCreate = null,
  groups = [],
  placeholder = null,
  invalid = false,
  error = null,
  disabled = false,
  className,
  id,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: ComboboxProps) {
  const errorId = `${useId()}${COMBOBOX_ERROR_ID_SUFFIX}`;
  const panelRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const hasError = error !== null;
  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLocaleLowerCase();
  const matched =
    normalizedQuery === ''
      ? options
      : options.filter((option) => option.label.toLocaleLowerCase().includes(normalizedQuery));
  const hasExactMatch = options.some(
    (option) => option.label.toLocaleLowerCase() === normalizedQuery,
  );
  const creatable = groups.filter((group) => group.creatable === true).map((group) => group.id);
  const createGroup =
    matched.find((option) => option.group !== undefined && creatable.includes(option.group))
      ?.group ??
    creatable[0] ??
    null;
  const createOption =
    createLabel !== null && trimmedQuery !== '' && !hasExactMatch
      ? {
          value: COMBOBOX_CREATE_VALUE,
          label: createLabel(trimmedQuery),
          ...(createGroup === null ? {} : { group: createGroup }),
        }
      : null;
  const sections = sectionsOf(matched, groups, createOption).filter(
    (section) =>
      section.options.length > 0 ||
      (section.group?.hint !== undefined && section.group.hint !== null),
  );
  const visible = sections.flatMap((section) => section.options);
  const selected = options.find((option) => option.value === value) ?? null;
  const activeOption = visible[Math.min(activeIndex, visible.length - 1)] ?? null;
  const describedBy = [hasError ? errorId : null, ariaDescribedBy]
    .filter((item) => item !== null && item !== undefined)
    .join(' ');

  useEffect(() => {
    if (open) {
      panelRef.current?.querySelector('input')?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const active = optionsRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    if (active !== null && active !== undefined && typeof active.scrollIntoView === 'function') {
      active.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, open, query]);

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (next) {
      setQuery('');
      setActiveIndex(0);
    }
  };

  const moveActive = (step: number) => {
    setActiveIndex((index) => Math.min(Math.max(index + step, 0), Math.max(visible.length - 1, 0)));
  };

  const select = (option: ComboboxOption) => {
    if (option.value !== COMBOBOX_CREATE_VALUE) {
      onChange(option.value);
    } else if (onCreate === null) {
      onChange(trimmedQuery);
    } else {
      onCreate(trimmedQuery, option.group ?? null);
    }
    changeOpen(false);
  };

  const renderOption = (option: ComboboxOption) => {
    const index = visible.indexOf(option);
    return (
      <li key={option.value}>
        <button
          type="button"
          aria-current={option.value === value ? 'true' : undefined}
          data-active={index === activeIndex ? 'true' : undefined}
          className={clsx(
            styles.option,
            index === activeIndex && styles.active,
            option.value === value && styles.selected,
          )}
          onMouseEnter={() => setActiveIndex(index)}
          onFocus={() => setActiveIndex(index)}
          onClick={() => select(option)}
        >
          <span className={styles.optionLabel}>{option.label}</span>

          {option.value === value && <Icon name={IconName.Check} size={COMBOBOX_CHECK_SIZE} />}
        </button>
      </li>
    );
  };

  const renderGroup = (group: ComboboxGroup, listed: readonly ComboboxOption[]) => (
    <li key={group.id}>
      <fieldset className={styles.group}>
        <legend className={styles.groupLabel}>{group.label}</legend>

        {group.hint !== undefined && group.hint !== null && (
          <div className={styles.groupHint}>
            <span className={styles.groupHintText}>{group.hint}</span>

            {group.action !== undefined && group.action !== null && (
              <Button
                variant={ButtonVariant.Ghost}
                size={ButtonSize.Sm}
                onClick={group.action.onSelect}
              >
                {group.action.label}
              </Button>
            )}
          </div>
        )}

        {listed.length > 0 && <ul className={styles.options}>{listed.map(renderOption)}</ul>}
      </fieldset>
    </li>
  );

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setActiveIndex(0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
      return;
    }
    if (event.key === 'Enter' && activeOption !== null) {
      event.preventDefault();
      select(activeOption);
    }
  };

  const trigger = (
    <button
      {...rest}
      id={id}
      type="button"
      disabled={disabled}
      aria-describedby={describedBy === '' ? undefined : describedBy}
      className={clsx(styles.trigger, (invalid || hasError) && styles.invalid)}
    >
      <span className={clsx(styles.value, value === '' && styles.placeholder)}>
        {value === '' ? (placeholder ?? '') : (selected?.label ?? value)}
      </span>

      <Icon name={IconName.ChevronDown} size={COMBOBOX_CHEVRON_SIZE} className={styles.chevron} />
    </button>
  );
  return (
    <div className={clsx(styles.root, disabled && styles.disabled, className)}>
      <Popover
        open={open && !disabled}
        onOpenChange={changeOpen}
        trigger={trigger}
        bare
        ariaLabel={searchLabel}
      >
        <div ref={panelRef} className={styles.panel}>
          <SearchInput
            value={query}
            label={searchLabel}
            clearLabel={searchClearLabel}
            placeholder={placeholder ?? undefined}
            onChange={handleQueryChange}
            onClear={() => {
              setQuery('');
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />

          {sections.length === 0 ? (
            <p className={styles.empty}>{emptyLabel}</p>
          ) : (
            <ul ref={optionsRef} className={styles.list}>
              {sections.map((section) =>
                section.group === null
                  ? section.options.map(renderOption)
                  : renderGroup(section.group, section.options),
              )}
            </ul>
          )}
        </div>
      </Popover>

      {hasError && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
