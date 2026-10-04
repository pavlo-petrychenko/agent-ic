export interface FakeColorSchemeQuery {
  readonly query: MediaQueryList;
  readonly setPrefersDark: (prefersDark: boolean) => void;
}
