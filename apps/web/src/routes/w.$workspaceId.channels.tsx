import { createFileRoute } from '@tanstack/react-router';
import { ChannelsPage } from '@/features/channels';
import { SectionGate, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/channels')({
  component: ChannelsRoute,
});

function ChannelsRoute() {
  const { workspaceId } = Route.useParams();
  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.Channels}>
      <ChannelsPage />
    </SectionGate>
  );
}
