import type { ReactNode } from 'react';

import { AppHeader } from '../AppHeader/AppHeader';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-form flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
