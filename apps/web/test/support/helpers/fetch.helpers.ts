import { vi } from 'vitest';

type RouteResponses = Readonly<Record<string, () => Response>>;

const NOT_FOUND_STATUS = 404;

const pathOf = (input: RequestInfo | URL): string =>
  typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;

export const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status });

export const stubFetchRoutes = (routes: RouteResponses) => {
  const fetchMock = vi.fn<typeof fetch>((input) => {
    const respond = routes[pathOf(input)];
    return Promise.resolve(
      respond === undefined ? new Response(null, { status: NOT_FOUND_STATUS }) : respond(),
    );
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};
