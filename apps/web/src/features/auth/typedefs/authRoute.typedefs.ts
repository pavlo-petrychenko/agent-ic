export interface GuardLocation {
  readonly href: string;
}

export interface UseLogOutResult {
  readonly logOut: (redirect?: string | null) => Promise<void>;
  readonly leaving: boolean;
}
