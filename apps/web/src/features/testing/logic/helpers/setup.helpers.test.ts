import { describe, expect, it } from 'vitest';
import {
  isSimulatorChannel,
  isSimulatorLanguage,
} from '@/features/testing/logic/helpers/setup.helpers';

describe('isSimulatorChannel', () => {
  it.each([
    ['simulated', true],
    ['telegram', false],
    ['', false],
  ])('accepts %j: %s', (value, expected) => {
    expect(isSimulatorChannel(value)).toBe(expected);
  });
});

describe('isSimulatorLanguage', () => {
  it.each([
    ['uk', true],
    ['en', true],
    ['de', false],
    ['', false],
  ])('accepts %j: %s', (value, expected) => {
    expect(isSimulatorLanguage(value)).toBe(expected);
  });
});
