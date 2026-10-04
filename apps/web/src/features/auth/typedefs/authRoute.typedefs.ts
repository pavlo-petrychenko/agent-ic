export interface GuardLocation {
  readonly href: string;
}

export interface UseLogOutResult {
  readonly logOut: () => Promise<void>;
  readonly leaving: boolean;
}
