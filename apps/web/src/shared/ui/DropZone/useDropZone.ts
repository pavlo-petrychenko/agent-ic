import { useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import {
  DROP_ZONE_EXTENSION_PREFIX,
  DROP_ZONE_MIN_DRAG_COUNT,
  DROP_ZONE_MIME_WILDCARD_SUFFIX,
} from '@/shared/ui/DropZone/DropZone.constants';
import type {
  DropZoneController,
  UseDropZoneOptions,
} from '@/shared/ui/DropZone/DropZone.typedefs';

const matchesRule = (file: File, rule: string): boolean => {
  const normalized = rule.trim().toLowerCase();
  if (normalized.startsWith(DROP_ZONE_EXTENSION_PREFIX)) {
    return file.name.toLowerCase().endsWith(normalized);
  }
  if (normalized.endsWith(DROP_ZONE_MIME_WILDCARD_SUFFIX)) {
    return file.type.toLowerCase().startsWith(normalized.slice(0, -1));
  }
  return file.type.toLowerCase() === normalized;
};

const pickFiles = (
  files: readonly File[],
  accept: readonly string[],
  multiple: boolean,
): File[] => {
  const accepted =
    accept.length === 0
      ? [...files]
      : files.filter((file) => accept.some((rule) => matchesRule(file, rule)));
  return multiple ? accepted : accepted.slice(0, 1);
};

export function useDropZone({
  accept,
  multiple,
  disabled,
  onFiles,
  formatResult,
}: UseDropZoneOptions): DropZoneController {
  const [dragging, setDragging] = useState(false);
  const [dragCount, setDragCount] = useState(DROP_ZONE_MIN_DRAG_COUNT);
  const [result, setResult] = useState<string | null>(null);

  const deliver = (files: readonly File[]) => {
    const accepted = pickFiles(files, accept, multiple);
    if (accepted.length === 0) {
      return;
    }
    onFiles(accepted);
    setResult(formatResult === null ? null : formatResult(accepted.length));
  };

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    if (disabled) {
      return;
    }
    event.preventDefault();
    setDragging(true);
    setDragCount(Math.max(event.dataTransfer.items.length, DROP_ZONE_MIN_DRAG_COUNT));
  };

  const handleDragLeave = (event: DragEvent<HTMLElement>) => {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
      setDragging(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!disabled) {
      deliver(Array.from(event.dataTransfer.files));
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    deliver(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  return {
    dragging,
    dragCount,
    result,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleInputChange,
  };
}
