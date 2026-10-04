import { createFileRoute } from '@tanstack/react-router';

import { PublicLayout } from '@/app/layouts/PublicLayout/PublicLayout';
import { StatusPage } from '@/features/status';

export const Route = createFileRoute('/')({
  component: IndexRoute,
});

function IndexRoute() {
  return (
    <PublicLayout>
      <StatusPage />
    </PublicLayout>
  );
}
