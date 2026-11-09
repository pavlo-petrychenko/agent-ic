import type { JSONSchema7 } from 'ai';
import { describe, expect, it } from 'vitest';
import {
  strictJsonSchema,
  withoutOptionalNulls,
} from '@/platform/llm/helpers/llm-strict-schema.helpers';

const NULL_TYPE: JSONSchema7 = { type: 'null' };

const ORDER: JSONSchema7 = {
  type: 'object',
  properties: {
    intent: { type: 'string' },
    note: { type: ['string', 'null'] },
    date: { type: 'string', description: 'Booking date' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, size: { type: 'string' } },
        required: ['name'],
        additionalProperties: false,
      },
    },
  },
  required: ['intent'],
  additionalProperties: false,
};

describe('strictJsonSchema', () => {
  it('lists every key as required and lets an optional one be null', () => {
    expect(strictJsonSchema(ORDER)).toEqual({
      type: 'object',
      properties: {
        intent: { type: 'string' },
        note: { type: ['string', 'null'] },
        date: { anyOf: [{ type: 'string', description: 'Booking date' }, NULL_TYPE] },
        items: {
          anyOf: [
            {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  size: { anyOf: [{ type: 'string' }, NULL_TYPE] },
                },
                required: ['name', 'size'],
                additionalProperties: false,
              },
            },
            NULL_TYPE,
          ],
        },
      },
      required: ['intent', 'note', 'date', 'items'],
      additionalProperties: false,
    });
  });
});

describe('withoutOptionalNulls', () => {
  it('drops a null optional field, also inside a list', () => {
    expect(
      withoutOptionalNulls(
        { intent: 'book', date: null, items: [{ name: 'tea', size: null }] },
        ORDER,
      ),
    ).toEqual({ intent: 'book', items: [{ name: 'tea' }] });
  });

  it('keeps a null the schema allows and a null in a required field', () => {
    expect(withoutOptionalNulls({ intent: null, note: null }, ORDER)).toEqual({
      intent: null,
      note: null,
    });
  });
});
