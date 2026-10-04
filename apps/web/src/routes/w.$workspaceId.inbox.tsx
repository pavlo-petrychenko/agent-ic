import { createFileRoute } from '@tanstack/react-router';
import { SectionPlaceholderPage, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/inbox')({
  component: InboxRoute,
});

function InboxRoute() {
  const { workspaceId } = Route.useParams();
  return <SectionPlaceholderPage workspaceId={workspaceId} section={WorkspaceSection.Inbox} />;
}
