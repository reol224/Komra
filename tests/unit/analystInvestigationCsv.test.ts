import { describe, expect, it } from 'vitest';
import { escapeCsvValue } from '@/components/dashboard/analyst/AnalystInvestigation';

describe('Analyst Investigation CSV escaping', () => {
  it.each(['=', '+', '-', '@', '\t', '\r'])(
    'neutralizes cells beginning with %s',
    (prefix) => {
      expect(escapeCsvValue(`${prefix}1+1`)).toBe(`"'${prefix}1+1"`);
    },
  );

  it('retains CSV quoting and embedded quote escaping', () => {
    expect(escapeCsvValue('value "with quotes"')).toBe('"value ""with quotes"""');
  });
});
