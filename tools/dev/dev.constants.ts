import type { PortVariable } from './dev.typedefs.ts';

export const EXIT_SUCCESS = 0;
export const EXIT_FAILURE = 1;

export const LOCAL_DOMAIN = 'local.agent-ic.pavlop.dev';
export const LOCAL_SUBDOMAINS = ['mail', 's3', 'grafana', 'langfuse', 'queues'] as const;
export const LOCAL_HOSTNAMES: readonly string[] = [
  LOCAL_DOMAIN,
  ...LOCAL_SUBDOMAINS.map((subdomain) => `${subdomain}.${LOCAL_DOMAIN}`),
];
export const LOOPBACK_ADDRESS = '127.0.0.1';
export const ANY_ADDRESS = '0.0.0.0';
export const HTTPS_SCHEME = 'https://';
export const DEFAULT_HTTPS_PORT = 443;

export const ENV_FILE = '.env';
export const ENV_EXAMPLE_FILE = '.env.example';
export const ENV_ASSIGNMENT = '=';
export const ENV_COMMENT = '#';
export const LINE_BREAK = '\n';
export const LINE_BREAK_PATTERN = /\r?\n/;
export const WHITESPACE_PATTERN = /\s+/;

export const EnvVariable = {
  PublicUrl: 'PUBLIC_URL',
  TraefikHttpPort: 'TRAEFIK_HTTP_PORT',
  TraefikHttpsPort: 'TRAEFIK_HTTPS_PORT',
  PostgresPort: 'POSTGRES_PORT',
  DatabaseName: 'DATABASE_NAME',
  DevWatchPolling: 'DEV_WATCH_POLLING',
} as const;

export const WATCH_POLLING_ON = 'true';

export const PORT_VARIABLES: readonly PortVariable[] = [
  { name: EnvVariable.TraefikHttpPort, fallback: 8080 },
  { name: EnvVariable.TraefikHttpsPort, fallback: 8443 },
  { name: EnvVariable.PostgresPort, fallback: 5433 },
  { name: 'REDIS_PORT', fallback: 6390 },
  { name: 'MINIO_API_PORT', fallback: 9100 },
  { name: 'MAILPIT_SMTP_PORT', fallback: 1026 },
];

export const CERTS_DIRECTORY = '.certs';
export const CERT_FILE = `${CERTS_DIRECTORY}/${LOCAL_DOMAIN}.pem`;
export const CERT_KEY_FILE = `${CERTS_DIRECTORY}/${LOCAL_DOMAIN}-key.pem`;
export const ROOT_CA_FILE = 'rootCA.pem';

export const UNIX_HOSTS_FILE = '/etc/hosts';
export const WINDOWS_HOSTS_SUFFIX = '\\drivers\\etc\\hosts';
export const PROC_VERSION_FILE = '/proc/version';
export const WSL_KERNEL_PATTERN = /microsoft/i;
export const WINDOWS_PLATFORM = 'win32';
export const POWERSHELL = 'powershell.exe';
export const POWERSHELL_ENCODING = 'utf16le';
export const CERTUTIL = 'certutil.exe';
export const WSLPATH = 'wslpath';

export const AddressError = {
  InUse: 'EADDRINUSE',
  Denied: 'EACCES',
} as const;

export const Tool = {
  Docker: 'docker',
  Pnpm: 'pnpm',
  Mkcert: 'mkcert',
  Sudo: 'sudo',
} as const;

export const ALL_PROFILES = '*';
export const POSTGRES_SERVICE = 'postgres';
export const POSTGRES_VOLUME = 'agent-ic_postgres-data';
export const API_SERVICE = 'api';
export const START_LOG_TAIL = '50';
export const LOG_TAIL = '100';
export const URL_LABEL_WIDTH = 8;

export const DATABASE_ROLE_PASSWORDS: Readonly<Record<string, string>> = {
  app_owner: 'APP_OWNER_PASSWORD',
  app: 'APP_PASSWORD',
  app_system: 'APP_SYSTEM_PASSWORD',
};
export const DEFAULT_DATABASE_ROLE = 'app_owner';

export const Command = {
  Setup: 'setup',
  Start: 'start',
  Add: 'add',
  Stop: 'stop',
  Restart: 'restart',
  Status: 'status',
  Logs: 'logs',
  Shell: 'shell',
  DbMigrate: 'db:migrate',
  DbReset: 'db:reset',
  DbSeed: 'db:seed',
  DbPsql: 'db:psql',
  Codegen: 'codegen',
  Clean: 'clean',
  Env: 'env',
  Ports: 'ports',
  Certs: 'certs',
  Hosts: 'hosts',
  Urls: 'urls',
} as const;
