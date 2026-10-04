export type EnvValues = ReadonlyMap<string, string>;

export interface PortVariable {
  readonly name: string;
  readonly fallback: number;
}

export interface PortChange {
  readonly name: string;
  readonly from: number;
  readonly to: number;
}

export type PortBusyCheck = (port: number) => Promise<boolean>;

export type CommandArgs = readonly string[];

export type CommandHandler = (args: CommandArgs) => Promise<number> | number;

export interface CommandStep {
  readonly command: string;
  readonly args: CommandArgs;
}

export interface LocalUrl {
  readonly label: string;
  readonly url: string;
}
