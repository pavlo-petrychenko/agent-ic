import { createFileRoute } from '@tanstack/react-router';
import { ResetPasswordPage, tokenSearchSchema } from '@/features/auth';

export const Route = createFileRoute('/auth/reset-password')({
  validateSearch: tokenSearchSchema,
  component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
  const { token } = Route.useSearch();
  return <ResetPasswordPage token={token} />;
}
