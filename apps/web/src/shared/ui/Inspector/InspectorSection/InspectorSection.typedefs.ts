import type { ComponentProps, ReactNode } from 'react';

export interface InspectorSectionProps extends Omit<ComponentProps<'section'>, 'title'> {
  title: string;
  note?: string | null;
  children: ReactNode;
}
