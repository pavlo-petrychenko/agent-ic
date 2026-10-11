import { createFileRoute } from '@tanstack/react-router';
import { PublicLayout } from '@/app/layouts/PublicLayout';
import { StatusPage } from '@/features/status';

export const Route = createFileRoute('/status')({
  component: StatusRoute,
});

function StatusRoute() {
  return (
    <PublicLayout>
      <StatusPage />
    </PublicLayout>
  );
}
