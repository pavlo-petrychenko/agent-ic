import { createFileRoute, stripSearchParams, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import {
  NOTIFICATIONS_SEARCH_DEFAULTS,
  NotificationsPage,
  notificationsSearchSchema,
} from '@/features/settings';
import { SectionGate, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/settings/notifications')({
  validateSearch: notificationsSearchSchema,
  search: { middlewares: [stripSearchParams(NOTIFICATIONS_SEARCH_DEFAULTS)] },
  component: NotificationsRoute,
});

function NotificationsRoute() {
  const { workspaceId } = Route.useParams();
  const { verifyEmail } = Route.useSearch();
  const navigate = useNavigate();
  const onVerificationHandled = useCallback(() => {
    void navigate({
      to: '/w/$workspaceId/settings/notifications',
      params: { workspaceId },
      search: { verifyEmail: null },
      replace: true,
    });
  }, [navigate, workspaceId]);

  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.Notifications}>
      <NotificationsPage
        workspaceId={workspaceId}
        verificationToken={verifyEmail}
        onVerificationHandled={onVerificationHandled}
      />
    </SectionGate>
  );
}
