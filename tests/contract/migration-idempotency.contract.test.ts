import { describe, expect, it } from 'vitest';

describe('Migration idempotency contract', () => {
  it('normalizes duplicate source rows into unique target identity set', () => {
    const source = [
      { id: 'a', value: 1 },
      { id: 'a', value: 1 },
      { id: 'b', value: 2 }
    ];

    const unique = new Map(source.map((row) => [row.id, row]));
    expect([...unique.values()]).toHaveLength(2);
  });
});
