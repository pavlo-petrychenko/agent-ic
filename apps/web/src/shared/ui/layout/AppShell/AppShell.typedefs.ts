import type { ComponentProps, ReactNode } from 'react';
import type { AppShellNavMode } from '@/shared/ui/layout/AppShell/AppShell.constants';
import type { NarrowScreenNoticeProps } from '@/shared/ui/layout/NarrowScreenNotice';

export interface AppShellProps extends Omit<ComponentProps<'div'>, 'children'> {
  navMode?: AppShellNavMode;
  nav: ReactNode;
  rail?: ReactNode | null;
  topbar?: ReactNode | null;
  panes: ReactNode;
  detail?: ReactNode | null;
  detailOpen?: boolean;
  onDetailOpenChange: (open: boolean) => void;
  detailLabel: string;
  narrowScreen?: Pick<NarrowScreenNoticeProps, 'title' | 'description'> | null;
}
