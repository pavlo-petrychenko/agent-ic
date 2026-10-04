import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  CERT_FILE,
  CERT_KEY_FILE,
  CERTS_DIRECTORY,
  CERTUTIL,
  EXIT_FAILURE,
  EXIT_SUCCESS,
  LOCAL_DOMAIN,
  ROOT_CA_FILE,
  Tool,
} from './dev.constants.ts';
import { capture, isWsl, log, logError, run, toWindowsPath } from './platform.helpers.ts';

const createCertificate = (): number => {
  if (existsSync(CERT_FILE) && existsSync(CERT_KEY_FILE)) {
    log(`certs: ${CERT_FILE} already exists`);
    return EXIT_SUCCESS;
  }
  mkdirSync(CERTS_DIRECTORY, { recursive: true });
  return run(Tool.Mkcert, [
    '-cert-file',
    CERT_FILE,
    '-key-file',
    CERT_KEY_FILE,
    `*.${LOCAL_DOMAIN}`,
    LOCAL_DOMAIN,
  ]);
};

const trustInWindows = (): number => {
  const caRoot = capture(Tool.Mkcert, ['-CAROOT']);
  const rootCa = caRoot === null ? null : toWindowsPath(join(caRoot, ROOT_CA_FILE));
  if (rootCa === null) {
    logError('certs: could not find the mkcert certificate authority');
    return EXIT_FAILURE;
  }
  log(
    'certs: trusting the mkcert certificate authority in Windows, approve the prompt if one appears',
  );
  return run(CERTUTIL, ['-user', '-addstore', 'Root', rootCa]);
};

export const ensureCertificate = (): number => {
  const status = createCertificate();
  return status === EXIT_SUCCESS && isWsl() ? trustInWindows() : status;
};
