import { createFileRoute } from '@tanstack/react-router';
import { ApiChannelPage } from '@/features/channels';

export const Route = createFileRoute('/w/$workspaceId/channels/api/$channelId')({
  component: ApiChannelRoute,
});

function ApiChannelRoute() {
  const { workspaceId, channelId } = Route.useParams();
  return <ApiChannelPage key={channelId} workspaceId={workspaceId} channelId={channelId} />;
}
