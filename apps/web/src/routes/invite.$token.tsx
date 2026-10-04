import { createFileRoute } from '@tanstack/react-router';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { InvitePage } from '@/features/auth';

export const Route = createFileRoute('/invite/$token')({
  component: InviteRoute,
});

function InviteRoute() {
  const { token } = Route.useParams();
  return (
    <AuthLayout>
      <InvitePage token={token} />
    </AuthLayout>
  );
}
