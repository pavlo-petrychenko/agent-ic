import { createServer } from 'node:http';

import { CONTRACTS_VERSION } from '@agent-ic/contracts';
import { FLOW_SCHEMA_VERSION } from '@agent-ic/flow';

const roles = ['api', 'gateway', 'worker'] as const;
type Role = (typeof roles)[number];

const isRole = (value: string | undefined): value is Role => roles.some((role) => role === value);

const rawRole = process.env['ROLE'];
if (!isRole(rawRole)) {
  throw new Error(`ROLE must be one of ${roles.join(', ')}`);
}
const role: Role = rawRole;
const port = Number(process.env['PORT'] ?? 3000);

const server = createServer((request, response) => {
  if (request.method === 'GET' && request.url === '/health/live') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(
      JSON.stringify({
        status: 'ok',
        role,
        contracts: CONTRACTS_VERSION,
        flow: FLOW_SCHEMA_VERSION,
      }),
    );
    return;
  }
  response.writeHead(404, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ status: 'not_found' }));
});

server.listen(port);
