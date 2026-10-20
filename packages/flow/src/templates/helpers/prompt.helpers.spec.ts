import { describe, expect, it } from 'vitest';
import {
  collectPromptVariables,
  normalizePathVariable,
  renderPrompt,
} from '@flow/templates/helpers/prompt.helpers';

describe('collectPromptVariables', () => {
  it('collects declared variables in order without duplicates', () => {
    expect(
      collectPromptVariables(
        'Hi {{customer_name}} and {{order_number}}, {{customer_name}}.',
        normalizePathVariable,
      ),
    ).toEqual(['customer_name', 'order_number']);
  });

  it('normalizes names that differ by case', () => {
    expect(
      collectPromptVariables('{{Contact.Name}} {{contact.name}}', normalizePathVariable),
    ).toEqual(['contact.name']);
  });

  it('keeps hyphens and leading digits', () => {
    expect(collectPromptVariables('{{customer-name}} {{123}}')).toEqual(['customer-name', '123']);
  });

  it('ignores declarations with symbols outside the prompt variable alphabet', () => {
    expect(collectPromptVariables('{{customer name}} {{;name}} plain text')).toEqual([]);
  });
});

describe('renderPrompt', () => {
  it('renders mapped values and leaves other text alone', () => {
    const values: Readonly<Record<string, string>> = {
      'customer.name': 'Olena',
      order: 'A-42',
    };

    expect(renderPrompt('Hi {{Customer.Name}}, order {{order}}.', (path) => values[path])).toBe(
      'Hi Olena, order A-42.',
    );
  });

  it('renders empty text for missing values', () => {
    expect(renderPrompt('Hi {{name}}.', () => null)).toBe('Hi .');
  });

  it('leaves invalid declarations as text', () => {
    expect(renderPrompt('Hi {{name with spaces}}.', () => 'x')).toBe('Hi {{name with spaces}}.');
  });
});
