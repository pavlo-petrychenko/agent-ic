export interface FakeViewport {
  readonly matchMedia: (query: string) => MediaQueryList;
  readonly setWidth: (width: number) => void;
}
