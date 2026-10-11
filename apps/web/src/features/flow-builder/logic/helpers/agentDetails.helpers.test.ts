import { describe, expect, it } from 'vitest';
import {
  normalizeAgentDetails,
  sameAgentDetails,
} from '@/features/flow-builder/logic/helpers/agentDetails.helpers';

describe('agent details helpers', () => {
  it('trims the name and the description', () => {
    expect(normalizeAgentDetails({ name: '  Front desk ', description: ' Books visits ' })).toEqual(
      { name: 'Front desk', description: 'Books visits' },
    );
  });

  it('turns a blank description into null', () => {
    expect(normalizeAgentDetails({ name: 'Front desk', description: '   ' })).toEqual({
      name: 'Front desk',
      description: null,
    });
  });

  it('compares both fields', () => {
    const details = { name: 'Front desk', description: null };

    expect(sameAgentDetails(details, { ...details })).toBe(true);
    expect(sameAgentDetails(details, { ...details, description: 'Books visits' })).toBe(false);
  });
});
