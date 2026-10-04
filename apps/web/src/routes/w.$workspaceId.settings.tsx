import { createFileRoute } from '@tanstack/react-router';
import { SectionPlaceholderPage, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/settings')({
  component: SettingsRoute,
});

function SettingsRoute() {
  const { workspaceId } = Route.useParams();
  return <SectionPlaceholderPage workspaceId={workspaceId} section={WorkspaceSection.Settings} />;
}
