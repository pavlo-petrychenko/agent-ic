import { rmSync } from 'node:fs';
import { ensureCertificate } from './certs.helpers.ts';
import {
  ALL_PROFILES,
  API_SERVICE,
  CERTS_DIRECTORY,
  Command,
  DATABASE_ROLE_PASSWORDS,
  DEFAULT_DATABASE_ROLE,
  DEFAULT_HTTPS_PORT,
  ENV_FILE,
  EnvVariable,
  EXIT_FAILURE,
  EXIT_SUCCESS,
  LOCAL_SUBDOMAINS,
  LOG_TAIL,
  LOOPBACK_ADDRESS,
  PORT_VARIABLES,
  POSTGRES_SERVICE,
  POSTGRES_VOLUME,
  REDIS_SERVICE,
  START_LOG_TAIL,
  Tool,
  URL_LABEL_WIDTH,
  WATCH_POLLING_ON,
} from './dev.constants.ts';
import type { CommandArgs, CommandHandler, CommandStep } from './dev.typedefs.ts';
import { readEnvFile, syncEnvFile, writeEnvValue } from './env.helpers.ts';
import { ensureHosts } from './hosts.helpers.ts';
import { capture, isWindows, log, logError, runStep, sequence } from './platform.helpers.ts';
import { choosePorts, isPortBusy, publicUrl } from './ports.helpers.ts';

const compose = (...args: CommandArgs): CommandStep => ({
  command: Tool.Docker,
  args: ['compose', ...args],
});

const composeAllProfiles = (...args: CommandArgs): CommandStep =>
  compose('--profile', ALL_PROFILES, ...args);

const pnpm = (...args: CommandArgs): CommandStep => ({ command: Tool.Pnpm, args });

const step =
  (commandStep: CommandStep): (() => number) =>
  () =>
    runStep(commandStep);

const requireArgument = (args: CommandArgs, command: string, name: string): string | null => {
  const [value] = args;
  if (value === undefined) {
    logError(`${command}: missing <${name}>`);
    return null;
  }
  return value;
};

const syncEnv = (): number => {
  const added = syncEnvFile();
  if (added === null) {
    log(`env: created ${ENV_FILE}`);
  } else if (added.length > 0) {
    log(`env: added ${added.join(' ')} to ${ENV_FILE}`);
  } else {
    log(`env: ${ENV_FILE} has every variable`);
  }
  return EXIT_SUCCESS;
};

const httpsPort = (): number =>
  Number(readEnvFile().get(EnvVariable.TraefikHttpsPort) ?? DEFAULT_HTTPS_PORT);

const printUrls = (): number => {
  const env = readEnvFile();
  const port = httpsPort();
  const web = publicUrl(port);
  log('urls:');
  log(`  web      ${web}`);
  log(`  api      ${web}/api`);
  log(`  gateway  ${web}/v1`);
  for (const subdomain of LOCAL_SUBDOMAINS) {
    log(`  ${subdomain.padEnd(URL_LABEL_WIDTH)} ${publicUrl(port, subdomain)}`);
  }
  log(`  postgres ${LOOPBACK_ADDRESS}:${env.get(EnvVariable.PostgresPort) ?? ''}`);
  log(`  http on ${env.get(EnvVariable.TraefikHttpPort) ?? ''} redirects to https`);
  return EXIT_SUCCESS;
};

const stackIsRunning = (): boolean =>
  Boolean(capture(Tool.Docker, ['compose', 'ps', '--status', 'running', '--quiet']));

const checkPorts = async (): Promise<number> => {
  if (stackIsRunning()) {
    log(`ports: the stack is already running, keeping the ports from ${ENV_FILE}`);
    return EXIT_SUCCESS;
  }
  const changes = await choosePorts(readEnvFile(), PORT_VARIABLES, isPortBusy);
  for (const change of changes) {
    log(`ports: ${change.from} (${change.name}) is busy, using ${change.to} instead`);
    writeEnvValue(change.name, String(change.to));
  }
  writeEnvValue(EnvVariable.PublicUrl, publicUrl(httpsPort()));
  if (changes.length === 0) {
    log('ports: all host ports are free');
    return EXIT_SUCCESS;
  }
  return printUrls();
};

const enableWatchPolling = (): number => {
  if (isWindows()) {
    log('env: file changes are polled, Windows folders send no change events to containers');
    writeEnvValue(EnvVariable.DevWatchPolling, WATCH_POLLING_ON);
  }
  return EXIT_SUCCESS;
};

const migrate = step(compose('run', '--rm', '--no-deps', API_SERVICE, 'pnpm', 'run', 'db:migrate'));
const seed = step(compose('run', '--rm', '--no-deps', API_SERVICE, 'pnpm', 'run', 'db:seed'));
const status = step(composeAllProfiles('ps', '--all'));

const setup = (): Promise<number> =>
  sequence([
    step({ command: Tool.Mkcert, args: ['-install'] }),
    syncEnv,
    checkPorts,
    ensureCertificate,
    ensureHosts,
    enableWatchPolling,
    step(pnpm('install', '--frozen-lockfile')),
    step(pnpm('exec', 'lefthook', 'install')),
    step(compose('build')),
    step(compose('up', '-d', '--wait')),
    migrate,
    seed,
    status,
    printUrls,
  ]);

const withService =
  (command: string, toStep: (service: string) => CommandStep): CommandHandler =>
  (args) => {
    const service = requireArgument(args, command, 'svc');
    return service === null ? EXIT_FAILURE : runStep(toStep(service));
  };

const psql = (args: CommandArgs): number => {
  const role = args[0] ?? DEFAULT_DATABASE_ROLE;
  const passwordVariable = DATABASE_ROLE_PASSWORDS[role];
  if (passwordVariable === undefined) {
    logError(`db:psql: role must be one of ${Object.keys(DATABASE_ROLE_PASSWORDS).join(', ')}`);
    return EXIT_FAILURE;
  }
  const env = readEnvFile();
  return runStep(
    compose(
      'exec',
      '-e',
      `PGPASSWORD=${env.get(passwordVariable) ?? ''}`,
      POSTGRES_SERVICE,
      'psql',
      '-h',
      POSTGRES_SERVICE,
      '-U',
      role,
      '-d',
      env.get(EnvVariable.DatabaseName) ?? '',
    ),
  );
};

const clean = (): Promise<number> =>
  sequence([
    step(composeAllProfiles('down', '--volumes', '--remove-orphans')),
    () => {
      rmSync(CERTS_DIRECTORY, { recursive: true, force: true });
      return EXIT_SUCCESS;
    },
  ]);

export const COMMANDS: Readonly<Record<string, CommandHandler>> = {
  [Command.Setup]: setup,
  [Command.Start]: (args) =>
    sequence([
      syncEnv,
      step(compose('up', '-d', '--wait', ...args)),
      step(composeAllProfiles('logs', '-f', `--tail=${START_LOG_TAIL}`, ...args)),
    ]),
  [Command.Add]: withService(Command.Add, (service) => compose('up', '-d', '--wait', service)),
  [Command.Stop]: (args) => runStep(composeAllProfiles('stop', ...args)),
  [Command.Restart]: withService(Command.Restart, (service) =>
    composeAllProfiles('restart', service),
  ),
  [Command.Status]: status,
  [Command.Logs]: (args) =>
    runStep(composeAllProfiles('logs', '-f', `--tail=${LOG_TAIL}`, ...args)),
  [Command.Shell]: withService(Command.Shell, (service) =>
    composeAllProfiles('exec', service, 'sh'),
  ),
  [Command.DbMigrate]: migrate,
  [Command.DbReset]: () =>
    sequence([
      step(compose('rm', '--stop', '--force', POSTGRES_SERVICE)),
      step({ command: Tool.Docker, args: ['volume', 'rm', POSTGRES_VOLUME] }),
      step(compose('up', '-d', '--wait', POSTGRES_SERVICE, REDIS_SERVICE)),
      migrate,
      seed,
    ]),
  [Command.DbSeed]: seed,
  [Command.DbPsql]: psql,
  [Command.Codegen]: step(
    compose('run', '--rm', '--no-deps', API_SERVICE, 'pnpm', 'run', 'codegen'),
  ),
  [Command.Clean]: clean,
  [Command.Env]: syncEnv,
  [Command.Ports]: checkPorts,
  [Command.Certs]: ensureCertificate,
  [Command.Hosts]: ensureHosts,
  [Command.Urls]: printUrls,
};

export const runCommand = async (argv: CommandArgs): Promise<number> => {
  const [name, ...args] = argv;
  const handler = name === undefined ? undefined : COMMANDS[name];
  if (handler === undefined) {
    logError(`usage: node tools/dev.ts <command> [args]`);
    logError(`commands: ${Object.keys(COMMANDS).join(', ')}`);
    return EXIT_FAILURE;
  }
  return handler(args);
};
