import type { ChangeEvent, ComponentProps, DragEvent } from 'react';

export interface DropZoneProps extends Omit<
  ComponentProps<'div'>,
  'title' | 'onDrop' | 'children'
> {
  title: string;
  dragTitle: (count: number) => string;
  browseLabel: string;
  hint: string;
  error?: string | null;
  accept?: readonly string[];
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  formatResult?: ((count: number) => string) | null;
}

export interface UseDropZoneOptions {
  accept: readonly string[];
  multiple: boolean;
  disabled: boolean;
  onFiles: (files: File[]) => void;
  formatResult: ((count: number) => string) | null;
}

export interface DropZoneController {
  dragging: boolean;
  dragCount: number;
  result: string | null;
  handleDragOver: (event: DragEvent<HTMLElement>) => void;
  handleDragLeave: (event: DragEvent<HTMLElement>) => void;
  handleDrop: (event: DragEvent<HTMLElement>) => void;
  handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
}
