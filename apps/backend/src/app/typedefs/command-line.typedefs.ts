export interface RawServeOptions {
  readonly role: string | undefined;
  readonly queues: readonly string[];
}

export interface RawPrintSchemaOptions {
  readonly output: string | undefined;
}

export interface PrintSchemaArguments {
  readonly output: string;
}
