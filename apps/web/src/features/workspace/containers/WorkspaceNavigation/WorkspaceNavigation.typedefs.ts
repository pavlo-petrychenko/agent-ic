import type { ReactNode } from 'react';
import type { WorkspaceNavForm } from '@/features/workspace/constants/navigationForm.constants';

export interface WorkspaceNavigationProps {
  workspaceId: string;
  footerAction: ReactNode;
  form?: WorkspaceNavForm;
}
