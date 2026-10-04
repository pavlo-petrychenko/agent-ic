import { Locale } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { routeTree } from '@/routeTree.gen';
import { createI18n } from '@/shared/i18n/clients/i18n.client';
import { ToastProvider } from '@/shared/ui/Toast';

const TOAST_CLOSE_LABEL = 'Close';

interface RenderRouteOptions {
  locale?: Locale;
  mocks?: readonly MockLink.MockedResponse[];
}

export const createTestRouter = (path: string) => {
  const history = createMemoryHistory({ initialEntries: [path] });
  return { history, router: createRouter({ routeTree, history }) };
};

export const renderRoute = (
  path: string,
  { locale = Locale.En, mocks = [] }: RenderRouteOptions = {},
) => {
  const testRouter = createTestRouter(path);
  render(
    <I18nextProvider i18n={createI18n(locale)}>
      <MockedProvider mocks={mocks}>
        <ToastProvider closeLabel={TOAST_CLOSE_LABEL}>
          <RouterProvider router={testRouter.router} />
        </ToastProvider>
      </MockedProvider>
    </I18nextProvider>,
  );
  return testRouter;
};
