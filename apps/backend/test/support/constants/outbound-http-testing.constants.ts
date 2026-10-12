export const OUTBOUND_TEST_HOST = '127.0.0.1';
export const OUTBOUND_TEST_TIMEOUT_MS = 2_000;
export const OUTBOUND_TEST_SHORT_TIMEOUT_MS = 50;
export const OUTBOUND_TEST_SLOW_RESPONSE_MS = 500;
export const OUTBOUND_TEST_STATUS = 418;
export const OUTBOUND_TEST_HEADER = 'x-probe';
export const OUTBOUND_TEST_HEADER_VALUE = 'probe-value';
export const OUTBOUND_TEST_BODY = '{"ok":true}';
export const OUTBOUND_TEST_INVALID_HEADER_VALUES = ['Замовлення', 'A-17\r\nX-Injected: 1'];
export const OUTBOUND_TEST_INVALID_URLS = ['not a url', 'ftp://example.com/file'];
export const OUTBOUND_TEST_FLAKY_FAILURES = 1;
export const OUTBOUND_TEST_BLOCKED_HOSTS = [
  '127.0.0.1',
  'localhost',
  '[::1]',
  '169.254.169.254',
  '[::ffff:127.0.0.1]',
];
export const OUTBOUND_TEST_PUBLIC_ADDRESSES = ['140.82.121.6', '1.1.1.1', '2606:4700:4700::1111'];
export const OUTBOUND_TEST_PRIVATE_ADDRESSES = [
  '10.0.0.1',
  '192.168.1.109',
  '::ffff:10.0.0.1',
  '::ffff:7f00:1',
  'fd00::1',
];

export enum OutboundTestPath {
  Echo = '/echo',
  Slow = '/slow',
  Large = '/large',
  Exact = '/exact',
  Ok = '/ok',
  Unavailable = '/unavailable',
  Flaky = '/flaky',
  Held = '/held',
}
export const PROBE_SERVER_ADDRESS = 'probe server address';
