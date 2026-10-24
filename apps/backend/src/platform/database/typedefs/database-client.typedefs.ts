export interface DatabaseClientOptions {
  readonly url: string;
  readonly poolMax: number;
  readonly applicationName: string;
}

export interface DatabaseNotice {
  readonly severity: string | undefined;
  readonly code: string | undefined;
  readonly message: string | undefined;
}

export interface DatabaseClientListeners {
  readonly onNotice: (notice: DatabaseNotice) => void;
  readonly onIdleError: (error: Error) => void;
}

export interface DatabasePoolStats {
  readonly total: number;
  readonly idle: number;
  readonly waiting: number;
}
