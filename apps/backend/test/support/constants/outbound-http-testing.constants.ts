export const OUTBOUND_TEST_HOST = '127.0.0.1';
export const OUTBOUND_TEST_TIMEOUT_MS = 2_000;
export const OUTBOUND_TEST_SHORT_TIMEOUT_MS = 50;
export const OUTBOUND_TEST_SLOW_RESPONSE_MS = 500;
export const OUTBOUND_TEST_STATUS = 418;
export const OUTBOUND_TEST_HEADER = 'x-probe';
export const OUTBOUND_TEST_HEADER_VALUE = 'probe-value';
export const OUTBOUND_TEST_BODY = '{"ok":true}';
export const OUTBOUND_TEST_INVALID_URLS = ['not a url', 'ftp://example.com/file'];
export const OUTBOUND_TEST_BLOCKED_HOSTS = ['127.0.0.1', 'localhost', '[::1]', '169.254.169.254'];

export enum OutboundTestPath {
  Echo = '/echo',
  Slow = '/slow',
  Large = '/large',
}
export const PROBE_SERVER_ADDRESS = 'probe server address';
