import { createFileRoute } from '@tanstack/react-router';
import { InboxPage } from '@/features/inbox';
import { SectionGate, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/inbox')({
  component: InboxRoute,
});

function InboxRoute() {
  const { workspaceId } = Route.useParams();
  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.Inbox}>
      <InboxPage />
    </SectionGate>
  );
}
