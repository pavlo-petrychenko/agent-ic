export interface ProbeServer {
  readonly origin: string;
  readonly port: number;
  hits(path: string): number;
  arrived(path: string): Promise<void>;
  release(): void;
  close(): Promise<void>;
}

export interface ProbeEcho {
  readonly method: string;
  readonly header: string | null;
  readonly body: string;
}

export interface ProbeArrival {
  readonly path: string;
  readonly resolve: () => void;
}
