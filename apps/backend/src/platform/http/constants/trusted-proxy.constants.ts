export enum TrustedProxyRange {
  Loopback = 'loopback',
  LinkLocal = 'linklocal',
  UniqueLocal = 'uniquelocal',
}

export const TRUSTED_PROXY_RANGES: readonly TrustedProxyRange[] = [
  TrustedProxyRange.Loopback,
  TrustedProxyRange.LinkLocal,
  TrustedProxyRange.UniqueLocal,
];
