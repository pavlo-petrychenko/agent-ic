import clsx from 'clsx';
import { type ChangeEvent, type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import {
  COMBOBOX_CHECK_SIZE,
  COMBOBOX_CHEVRON_SIZE,
  COMBOBOX_ERROR_ID_SUFFIX,
} from '@/shared/ui/inputs/Combobox/Combobox.constants';
import type { ComboboxOption, ComboboxProps } from '@/shared/ui/inputs/Combobox/Combobox.typedefs';
import { SearchInput } from '@/shared/ui/inputs/SearchInput';
import { Popover } from '@/shared/ui/overlays/Popover';
import styles from '@/shared/ui/inputs/Combobox/Combobox.module.scss';

export function Combobox({
  value,
  options,
  onChange,
  searchLabel,
  searchClearLabel,
  emptyLabel,
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
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visible =
    normalizedQuery === ''
      ? options
      : options.filter((option) => option.label.toLocaleLowerCase().includes(normalizedQuery));
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
  }, [activeIndex, open, visible]);

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
    onChange(option.value);
    changeOpen(false);
  };

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
           {' '}
      <span className={clsx(styles.value, value === '' && styles.placeholder)}>
                {value === '' ? (placeholder ?? '') : value}     {' '}
      </span>
           {' '}
      <Icon name={IconName.ChevronDown} size={COMBOBOX_CHEVRON_SIZE} className={styles.chevron} /> 
       {' '}
    </button>
  );
  return (
    <div className={clsx(styles.root, disabled && styles.disabled, className)}>
           {' '}
      <Popover
        open={open && !disabled}
        onOpenChange={changeOpen}
        trigger={trigger}
        bare
        ariaLabel={searchLabel}
      >
               {' '}
        <div ref={panelRef} className={styles.panel}>
                   {' '}
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
                   {' '}
          {visible.length === 0 ? (
            <p className={styles.empty}>{emptyLabel}</p>
          ) : (
            <ul ref={optionsRef} className={styles.options}>
                           {' '}
              {visible.map((option, index) => (
                <li key={option.value}>
                                   {' '}
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
                                     {' '}
                    {option.value === value && (
                      <Icon name={IconName.Check} size={COMBOBOX_CHECK_SIZE} />
                    )}
                                     {' '}
                  </button>
                                 {' '}
                </li>
              ))}
                         {' '}
            </ul>
          )}
                 {' '}
        </div>
             {' '}
      </Popover>
           {' '}
      {hasError && (
        <p id={errorId} className={styles.error}>
                    {error}       {' '}
        </p>
      )}
         {' '}
    </div>
  );
}
