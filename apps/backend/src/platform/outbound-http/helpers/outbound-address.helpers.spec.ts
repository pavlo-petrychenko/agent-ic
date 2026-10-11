import { describe, expect, it } from 'vitest';
import { BLOCKED_ADDRESS_RANGES } from '@/platform/outbound-http/constants/outbound-http.constants';
import {
  isBlockedAddress,
  toBlockList,
} from '@/platform/outbound-http/helpers/outbound-address.helpers';
import {
  OUTBOUND_TEST_PRIVATE_ADDRESSES,
  OUTBOUND_TEST_PUBLIC_ADDRESSES,
} from '@test/support/constants/outbound-http-testing.constants';

describe('isBlockedAddress', () => {
  const blockList = toBlockList(BLOCKED_ADDRESS_RANGES);

  it.each(OUTBOUND_TEST_PUBLIC_ADDRESSES)('lets the public address %s through', (address) => {
    expect(isBlockedAddress(blockList, address)).toBe(false);
  });

  it.each(OUTBOUND_TEST_PRIVATE_ADDRESSES)('blocks the private address %s', (address) => {
    expect(isBlockedAddress(blockList, address)).toBe(true);
  });
});
