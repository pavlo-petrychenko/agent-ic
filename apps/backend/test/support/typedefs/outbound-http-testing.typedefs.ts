export interface ProbeServer {
  readonly origin: string;
  readonly port: number;
  close(): Promise<void>;
}

export interface ProbeEcho {
  readonly method: string;
  readonly header: string | null;
  readonly body: string;
}
