import { createFileRoute } from '@tanstack/react-router';
import { SectionGate, SectionPlaceholderPage, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/inbox')({
  component: InboxRoute,
});

function InboxRoute() {
  const { workspaceId } = Route.useParams();
  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.Inbox}>
      <SectionPlaceholderPage workspaceId={workspaceId} section={WorkspaceSection.Inbox} />
    </SectionGate>
  );
}
