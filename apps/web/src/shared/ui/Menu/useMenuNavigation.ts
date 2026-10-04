import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import {
  MENU_TYPEAHEAD_RESET_MS,
  MenuKey,
  MenuStep,
  NOT_FOUND_INDEX,
} from '@/shared/ui/Menu/Menu.constants';
import type { MenuItem } from '@/shared/ui/Menu/Menu.typedefs';

interface UseMenuNavigationOptions {
  items: readonly MenuItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const isItemEnabled = (item: MenuItem): boolean => item.disabled !== true;

const isTypeaheadKey = (event: KeyboardEvent): boolean =>
  event.key.length === 1 &&
  event.key !== MenuKey.Space &&
  !event.ctrlKey &&
  !event.metaKey &&
  !event.altKey;

function findSteppedIndex(items: readonly MenuItem[], fromIndex: number, step: MenuStep): number {
  for (let index = fromIndex + step; index >= 0 && index < items.length; index += step) {
    const item = items[index];
    if (item !== undefined && isItemEnabled(item)) {
      return index;
    }
  }
  return fromIndex;
}

function findTypeaheadIndex(items: readonly MenuItem[], query: string, fromIndex: number): number {
  const lowered = query.toLowerCase();
  const firstCharacter = lowered.charAt(0);
  const repeated = lowered.replaceAll(firstCharacter, '') === '';
  const normalized = repeated ? firstCharacter : lowered;
  const startOffset = normalized.length === 1 ? 1 : 0;
  for (let offset = 0; offset < items.length; offset += 1) {
    const index = (fromIndex + startOffset + offset) % items.length;
    const item = items[index];
    if (
      item !== undefined &&
      isItemEnabled(item) &&
      item.label.toLowerCase().startsWith(normalized)
    ) {
      return index;
    }
  }
  return NOT_FOUND_INDEX;
}

function resolveTabStopId(
  items: readonly MenuItem[],
  focusedId: string | null,
  selectedId: string | null,
): string | null {
  for (const candidate of [focusedId, selectedId]) {
    const match = items.find((item) => item.id === candidate);
    if (match !== undefined && isItemEnabled(match)) {
      return match.id;
    }
  }
  return items.find(isItemEnabled)?.id ?? null;
}

export function useMenuNavigation({ items, selectedId, onSelect }: UseMenuNavigationOptions) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const optionRefs = useRef(new Map<string, HTMLDivElement>());
  const queryRef = useRef('');
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const registerOption = (id: string) => (node: HTMLDivElement | null) => {
    if (node === null) {
      optionRefs.current.delete(id);
    } else {
      optionRefs.current.set(id, node);
    }
  };

  const focusIndex = (index: number) => {
    const item = items[index];
    if (item === undefined) {
      return;
    }
    setFocusedId(item.id);
    optionRefs.current.get(item.id)?.focus();
  };

  const selectItem = (item: MenuItem) => {
    if (isItemEnabled(item)) {
      onSelect(item.id);
    }
  };

  const typeahead = (key: string, currentIndex: number) => {
    queryRef.current += key;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      queryRef.current = '';
      timerRef.current = null;
    }, MENU_TYPEAHEAD_RESET_MS);
    const match = findTypeaheadIndex(items, queryRef.current, currentIndex);
    if (match !== NOT_FOUND_INDEX) {
      focusIndex(match);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    const item = items[index];
    if (item === undefined) {
      return;
    }
    switch (event.key) {
      case MenuKey.ArrowDown:
        event.preventDefault();
        focusIndex(findSteppedIndex(items, index, MenuStep.Next));
        return;
      case MenuKey.ArrowUp:
        event.preventDefault();
        focusIndex(findSteppedIndex(items, index, MenuStep.Previous));
        return;
      case MenuKey.Home:
        event.preventDefault();
        focusIndex(items.findIndex(isItemEnabled));
        return;
      case MenuKey.End:
        event.preventDefault();
        focusIndex(items.findLastIndex(isItemEnabled));
        return;
      case MenuKey.Enter:
      case MenuKey.Space:
        event.preventDefault();
        selectItem(item);
        return;
      default:
        if (isTypeaheadKey(event)) {
          typeahead(event.key, index);
        }
    }
  };

  return {
    tabStopId: resolveTabStopId(items, focusedId, selectedId),
    registerOption,
    handleKeyDown,
    handleFocus: setFocusedId,
    selectItem,
  };
}
