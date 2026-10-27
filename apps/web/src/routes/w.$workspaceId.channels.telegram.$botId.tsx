import { createFileRoute } from '@tanstack/react-router';
import { TelegramBotPage } from '@/features/channels';

export const Route = createFileRoute('/w/$workspaceId/channels/telegram/$botId')({
  component: TelegramBotRoute,
});

function TelegramBotRoute() {
  const { workspaceId, botId } = Route.useParams();
  return <TelegramBotPage key={botId} workspaceId={workspaceId} botId={botId} />;
}
