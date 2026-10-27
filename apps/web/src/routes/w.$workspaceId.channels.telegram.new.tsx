import { createFileRoute } from '@tanstack/react-router';
import { TelegramConnectPage } from '@/features/channels';

export const Route = createFileRoute('/w/$workspaceId/channels/telegram/new')({
  component: TelegramConnectRoute,
});

function TelegramConnectRoute() {
  const { workspaceId } = Route.useParams();
  return <TelegramConnectPage workspaceId={workspaceId} />;
}
