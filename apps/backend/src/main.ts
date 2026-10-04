import { createServer } from 'node:http';

import { CONTRACTS_VERSION } from '@agent-ic/contracts';
import { FLOW_SCHEMA_VERSION } from '@agent-ic/flow';

import { readRuntimeConfig } from './platform/config/runtime-config.ts';

const { role, port } = readRuntimeConfig();

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
