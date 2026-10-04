import { createFileRoute } from '@tanstack/react-router';
import { CheckEmailPage, checkEmailSearchSchema } from '@/features/auth';

export const Route = createFileRoute('/auth/check-email')({
  validateSearch: checkEmailSearchSchema,
  component: CheckEmailRoute,
});

function CheckEmailRoute() {
  const { email } = Route.useSearch();
  return <CheckEmailPage email={email} />;
}
