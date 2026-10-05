import clsx from 'clsx';
import { type MouseEvent, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Checkbox } from '@/shared/ui/Checkbox';
import { FilterChip } from '@/shared/ui/FilterChip';
import {
  FILTER_PICKER_FOCUS_TARGET,
  FILTER_SEARCH_THRESHOLD,
} from '@/shared/ui/FilterPicker/FilterPicker.constants';
import type {
  FilterOption,
  FilterPickerProps,
} from '@/shared/ui/FilterPicker/FilterPicker.typedefs';
import { Popover } from '@/shared/ui/Popover';
import { SearchInput } from '@/shared/ui/SearchInput';
import styles from '@/shared/ui/FilterPicker/FilterPicker.module.scss';

const matches = (option: FilterOption, query: string) =>
  option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());

const keepChipInCharge = (event: MouseEvent<HTMLSpanElement>) => {
  event.preventDefault();
};

export function FilterPicker({
  label,
  options,
  selectedIds,
  onSelectedIdsChange,
  clearLabel,
  ariaLabel,
  search = null,
  disabled = false,
  className,
}: FilterPickerProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = new Set(selectedIds);
  const chosen = options.filter((option) => selected.has(option.id));
  const first = chosen[0] ?? null;
  const searchable = search !== null && options.length > FILTER_SEARCH_THRESHOLD;
  const visible = searchable ? options.filter((option) => matches(option, query)) : options;

  const focusChip = () => {
    anchorRef.current?.querySelector<HTMLButtonElement>(FILTER_PICKER_FOCUS_TARGET)?.focus();
  };

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (next) {
      return;
    }
    setQuery('');
    const active = document.activeElement;
    if (active === null || active === document.body || panelRef.current?.contains(active)) {
      focusChip();
    }
  };

  const toggle = (id: string, checked: boolean) => {
    onSelectedIdsChange(
      checked ? [...selectedIds, id] : selectedIds.filter((selectedId) => selectedId !== id),
    );
  };

  return (
    <Popover
      open={open && !disabled}
      onOpenChange={changeOpen}
      bare
      ariaLabel={ariaLabel}
      trigger={
        <span
          ref={anchorRef}
          className={clsx(styles.anchor, className)}
          onClickCapture={keepChipInCharge}
        >
          <FilterChip
            label={label}
            value={first?.label ?? null}
            extraCount={Math.max(chosen.length - 1, 0)}
            applied={chosen.length > 0}
            open={open}
            disabled={disabled}
            clearLabel={clearLabel}
            onOpen={() => changeOpen(!open)}
            onClear={() => {
              flushSync(() => {
                onSelectedIdsChange([]);
                setOpen(false);
                setQuery('');
              });
              focusChip();
            }}
          />
        </span>
      }
    >
      <div ref={panelRef} className={styles.panel}>
        {searchable && (
          <SearchInput
            value={query}
            label={search.label}
            clearLabel={search.clearLabel}
            placeholder={search.placeholder ?? undefined}
            className={styles.search}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery('')}
          />
        )}
        <ul className={styles.options}>
          {visible.map((option) => (
            <li key={option.id} className={styles.option}>
              <Checkbox
                checked={selected.has(option.id)}
                label={<span className={styles.optionLabel}>{option.label}</span>}
                className={styles.checkbox}
                onCheckedChange={(checked) => toggle(option.id, checked)}
              />
              {option.count !== null && <span className={styles.count}>{option.count}</span>}
            </li>
          ))}
        </ul>
      </div>
    </Popover>
  );
}
