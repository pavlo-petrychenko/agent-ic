import { createFileRoute } from '@tanstack/react-router';
import { ChannelsPage } from '@/features/channels';

export const Route = createFileRoute('/w/$workspaceId/channels/')({
  component: ChannelsIndexRoute,
});

function ChannelsIndexRoute() {
  const { workspaceId } = Route.useParams();
  return <ChannelsPage workspaceId={workspaceId} />;
}
