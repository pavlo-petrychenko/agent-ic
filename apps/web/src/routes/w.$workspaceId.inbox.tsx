import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { InboxPage, inboxSearchSchema } from '@/features/inbox';
import { SectionGate, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/inbox')({
  validateSearch: inboxSearchSchema,
  component: InboxRoute,
});

function InboxRoute() {
  const { workspaceId } = Route.useParams();
  const { conversation } = Route.useSearch();
  const navigate = useNavigate();
  const changeConversation = (conversationId: string | null) => {
    void navigate({
      to: '/w/$workspaceId/inbox',
      params: { workspaceId },
      search: { conversation: conversationId },
      replace: true,
    });
  };
  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.Inbox}>
      <InboxPage conversationId={conversation} onConversationChange={changeConversation} />
    </SectionGate>
  );
}
