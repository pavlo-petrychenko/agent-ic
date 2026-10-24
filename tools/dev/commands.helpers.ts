import { rmSync } from 'node:fs';
import { cwd } from 'node:process';
import { ensureCertificate } from './certs.helpers.ts';
import {
  ALL_PROFILES,
  API_SERVICE,
  CERTS_DIRECTORY,
  Command,
  DATABASE_ROLE_PASSWORDS,
  DEFAULT_DATABASE_ROLE,
  DEFAULT_HTTPS_PORT,
  DEPS_SERVICE,
  ENV_FILE,
  EnvVariable,
  EXIT_FAILURE,
  EXIT_SUCCESS,
  FINGERPRINT_FILE,
  LOCAL_SUBDOMAINS,
  LOG_TAIL,
  LOOPBACK_ADDRESS,
  OBSERVABILITY_PROFILE,
  OBSERVABILITY_SUBDOMAINS,
  PORT_VARIABLES,
  POSTGRES_SERVICE,
  POSTGRES_VOLUME,
  REDIS_SERVICE,
  StackMode,
  START_LOG_TAIL,
  Tool,
  URL_LABEL_WIDTH,
  WATCH_POLLING_ON,
} from './dev.constants.ts';
import type { CommandArgs, CommandHandler, StackModeName, StepFactory } from './dev.typedefs.ts';
import { readEnvFile, syncEnvFile, writeEnvValue } from './env.helpers.ts';
import { ensureHosts } from './hosts.helpers.ts';
import { capture, isWindows, log, logError, runStep, sequence } from './platform.helpers.ts';
import { choosePorts, isPortBusy, publicUrl } from './ports.helpers.ts';
import {
  composeFileArgs,
  modeProfileArgs,
  observabilityServices,
  readStackMode,
  removeStackMode,
  resolveMode,
  writeStackMode,
} from './stack-mode.helpers.ts';
import {
  allStackContainers,
  otherCheckouts,
  readFingerprint,
  servicesToRestart,
  stackContainers,
  stackFingerprint,
  writeFingerprint,
} from './start.helpers.ts';

const compose =
  (...args: CommandArgs): StepFactory =>
  () => ({
    command: Tool.Docker,
    args: ['compose', ...composeFileArgs(readStackMode()), ...args],
  });

const composeAllProfiles = (...args: CommandArgs): StepFactory =>
  compose('--profile', ALL_PROFILES, ...args);

const composeInMode =
  (...args: CommandArgs): StepFactory =>
  () =>
    compose(...modeProfileArgs(readStackMode()), ...args)();

const pnpm =
  (...args: CommandArgs): StepFactory =>
  () => ({ command: Tool.Pnpm, args });

const step =
  (factory: StepFactory): (() => number) =>
  () =>
    runStep(factory());

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
  const subdomains =
    readStackMode() === StackMode.Observability
      ? [...LOCAL_SUBDOMAINS, ...OBSERVABILITY_SUBDOMAINS]
      : LOCAL_SUBDOMAINS;
  log('urls:');
  log(`  ${'web'.padEnd(URL_LABEL_WIDTH)} ${web}`);
  log(`  ${'api'.padEnd(URL_LABEL_WIDTH)} ${web}/api`);
  log(`  ${'gateway'.padEnd(URL_LABEL_WIDTH)} ${web}/v1`);
  for (const subdomain of subdomains) {
    log(`  ${subdomain.padEnd(URL_LABEL_WIDTH)} ${publicUrl(port, subdomain)}`);
  }
  log(
    `  ${'postgres'.padEnd(URL_LABEL_WIDTH)} ${LOOPBACK_ADDRESS}:${env.get(EnvVariable.PostgresPort) ?? ''}`,
  );
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
const codegen = step(compose('run', '--rm', '--no-deps', API_SERVICE, 'pnpm', 'run', 'codegen'));

const rebuild = [
  step(compose('build', DEPS_SERVICE)),
  step(compose('run', '--rm', DEPS_SERVICE)),
  codegen,
  step(compose('up', '-d', '--wait', POSTGRES_SERVICE)),
  migrate,
];

const refreshStack = (): Promise<number> => {
  const containers = stackContainers();
  const others = otherCheckouts(containers, cwd());
  for (const checkout of others) {
    log(`start: the stack runs from ${checkout}, moving it to this checkout`);
  }
  const fingerprint = stackFingerprint();
  const changed = others.length > 0 || fingerprint === null || fingerprint !== readFingerprint();
  const restarts = others.length > 0 ? [] : servicesToRestart(changed, containers);
  log(
    changed
      ? 'start: something changed, installing dependencies, generating code and migrating'
      : 'start: nothing changed since the last start',
  );
  if (restarts.length > 0) {
    log(`start: restarting ${restarts.join(' ')}`);
  }
  return sequence([
    ...(changed ? rebuild : []),
    ...(restarts.length > 0 ? [step(compose('restart', ...restarts))] : []),
  ]);
};

const saveFingerprint = (): number => {
  const fingerprint = stackFingerprint();
  if (fingerprint !== null) {
    writeFingerprint(fingerprint);
  }
  log('start: the stack is up, following the logs (Ctrl+C stops following)');
  return EXIT_SUCCESS;
};

const applyMode =
  (requested: StackModeName, services: CommandArgs): (() => number) =>
  () => {
    const mode = resolveMode(requested, services, readStackMode());
    writeStackMode(mode);
    log(`start: ${mode} mode`);
    return EXIT_SUCCESS;
  };

const removeObservabilityServices = (): number => {
  if (readStackMode() === StackMode.Observability) {
    return EXIT_SUCCESS;
  }
  const withProfile = capture(Tool.Docker, [
    'compose',
    '--profile',
    OBSERVABILITY_PROFILE,
    'config',
    '--services',
  ]);
  const lean = capture(Tool.Docker, ['compose', 'config', '--services']);
  if (withProfile === null || lean === null) {
    logError('start: could not list the compose services');
    return EXIT_FAILURE;
  }
  const names = new Set(observabilityServices(withProfile, lean));
  const present = allStackContainers()
    .map(({ service }) => service)
    .filter((service) => names.has(service));
  if (present.length === 0) {
    return EXIT_SUCCESS;
  }
  log(`start: removing the observability services ${present.join(' ')}`);
  return runStep(
    compose('--profile', OBSERVABILITY_PROFILE, 'rm', '--stop', '--force', ...present)(),
  );
};

const start =
  (requested: StackModeName): CommandHandler =>
  (args) =>
    sequence([
      syncEnv,
      ensureCertificate,
      applyMode(requested, args),
      refreshStack,
      removeObservabilityServices,
      step(composeInMode('up', '-d', '--wait', ...args)),
      printUrls,
      saveFingerprint,
      step(composeAllProfiles('logs', '-f', `--tail=${START_LOG_TAIL}`, ...args)),
    ]);
const status = step(composeAllProfiles('ps', '--all'));

const setup = (): Promise<number> =>
  sequence([
    step(() => ({ command: Tool.Mkcert, args: ['-install'] })),
    syncEnv,
    checkPorts,
    ensureCertificate,
    ensureHosts,
    enableWatchPolling,
    step(pnpm('install', '--frozen-lockfile')),
    step(pnpm('exec', 'lefthook', 'install')),
    step(compose('build')),
    step(composeInMode('up', '-d', '--wait')),
    migrate,
    seed,
    status,
    printUrls,
  ]);

const withService =
  (command: string, toStep: (service: string) => StepFactory): CommandHandler =>
  (args) => {
    const service = requireArgument(args, command, 'svc');
    return service === null ? EXIT_FAILURE : runStep(toStep(service)());
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
    )(),
  );
};

const clean = (): Promise<number> =>
  sequence([
    step(composeAllProfiles('down', '--volumes', '--remove-orphans')),
    () => {
      rmSync(CERTS_DIRECTORY, { recursive: true, force: true });
      rmSync(FINGERPRINT_FILE, { force: true });
      removeStackMode();
      log('clean: done, `mise run start` rebuilds everything, `mise run db:seed` adds seed data');
      return EXIT_SUCCESS;
    },
  ]);

export const COMMANDS: Readonly<Record<string, CommandHandler>> = {
  [Command.Setup]: setup,
  [Command.Start]: start(StackMode.Lean),
  [Command.StartObservability]: start(StackMode.Observability),
  [Command.Add]: withService(Command.Add, (service) =>
    composeInMode('up', '-d', '--wait', service),
  ),
  [Command.Stop]: (args) => runStep(composeAllProfiles('stop', ...args)()),
  [Command.Restart]: withService(Command.Restart, (service) =>
    composeAllProfiles('restart', service),
  ),
  [Command.Status]: status,
  [Command.Logs]: (args) =>
    runStep(composeAllProfiles('logs', '-f', `--tail=${LOG_TAIL}`, ...args)()),
  [Command.Shell]: withService(Command.Shell, (service) =>
    composeAllProfiles('exec', service, 'sh'),
  ),
  [Command.DbMigrate]: migrate,
  [Command.DbReset]: () =>
    sequence([
      step(compose('rm', '--stop', '--force', POSTGRES_SERVICE)),
      step(() => ({ command: Tool.Docker, args: ['volume', 'rm', POSTGRES_VOLUME] })),
      step(compose('up', '-d', '--wait', POSTGRES_SERVICE, REDIS_SERVICE)),
      migrate,
      seed,
    ]),
  [Command.DbSeed]: seed,
  [Command.DbPsql]: psql,
  [Command.Codegen]: codegen,
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
