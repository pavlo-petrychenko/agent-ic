export interface GuardLocation {
  readonly href: string;
}

export interface EnterAppOptions {
  readonly replace: boolean;
}

export interface UseLogOutResult {
  readonly logOut: (redirect?: string | null) => Promise<void>;
  readonly leaving: boolean;
}
