import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import en from '@/messages/en.json';
import vi from '@/messages/vi.json';

function flatten(obj: unknown, prefix = ''): string[] {
  if (typeof obj === 'string') return [prefix];
  if (obj && typeof obj === 'object') {
    return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
      flatten(value, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [];
}

function collectStrings(obj: unknown, acc: string[] = []): string[] {
  if (typeof obj === 'string') acc.push(obj);
  else if (obj && typeof obj === 'object') {
    Object.values(obj as Record<string, unknown>).forEach((v) => collectStrings(v, acc));
  }
  return acc;
}

function hasDuplicateKeys(raw: string): boolean {
  let i = 0;
  const s = raw;
  const skipWs = () => {
    while (i < s.length && /\s/.test(s[i])) i += 1;
  };
  const parseString = () => {
    // assumes s[i] === '"'
    i += 1;
    while (i < s.length) {
      const c = s[i];
      if (c === '\\') {
        i += 2;
        continue;
      }
      if (c === '"') {
        i += 1;
        return;
      }
      i += 1;
    }
  };
  const parseValue = (): boolean => {
    skipWs();
    if (s[i] === '{') return parseObject();
    if (s[i] === '[') return parseArray();
    if (s[i] === '"') {
      parseString();
      return false;
    }
    // number / true / false / null
    while (i < s.length && /[^\s,\}\]]/.test(s[i])) i += 1;
    return false;
  };
  const parseObject = (): boolean => {
    i += 1; // {
    skipWs();
    if (s[i] === '}') {
      i += 1;
      return false;
    }
    const keys = new Set<string>();
    let dup = false;
    while (true) {
      skipWs();
      if (s[i] !== '"') throw new Error('expected key');
      const start = i;
      parseString();
      const key = s.slice(start, i);
      if (keys.has(key)) dup = true;
      keys.add(key);
      skipWs();
      if (s[i] !== ':') throw new Error('expected colon');
      i += 1;
      if (parseValue()) dup = true;
      skipWs();
      if (s[i] === ',') {
        i += 1;
        continue;
      }
      if (s[i] === '}') {
        i += 1;
        break;
      }
      throw new Error('expected comma or brace');
    }
    return dup;
  };
  const parseArray = (): boolean => {
    i += 1; // [
    skipWs();
    if (s[i] === ']') {
      i += 1;
      return false;
    }
    let dup = false;
    while (true) {
      if (parseValue()) dup = true;
      skipWs();
      if (s[i] === ',') {
        i += 1;
        continue;
      }
      if (s[i] === ']') {
        i += 1;
        break;
      }
      throw new Error('expected comma or bracket');
    }
    return dup;
  };
  return parseValue();
}

const enRaw = readFileSync(resolve(process.cwd(), 'src/messages/en.json'), 'utf8');
const viRaw = readFileSync(resolve(process.cwd(), 'src/messages/vi.json'), 'utf8');

describe('messages parity', () => {
  it('has identical key sets', () => {
    expect(flatten(en).sort()).toEqual(flatten(vi).sort());
  });

  it('has no empty values', () => {
    function check(obj: unknown) {
      if (typeof obj === 'string') {
        expect(obj.trim()).not.toBe('');
      } else if (obj && typeof obj === 'object') {
        Object.values(obj as Record<string, unknown>).forEach(check);
      }
    }
    check(en);
    check(vi);
  });

  it('has no U+FFFD in any value', () => {
    for (const obj of [en, vi]) {
      for (const value of collectStrings(obj)) {
        expect(value).not.toContain('\uFFFD');
      }
    }
  });

  it('has no duplicate keys', () => {
    expect(hasDuplicateKeys(enRaw)).toBe(false);
    expect(hasDuplicateKeys(viRaw)).toBe(false);
  });

  it('has fundingArbitrage namespace in both', () => {
    expect(en).toHaveProperty('fundingArbitrage');
    expect(vi).toHaveProperty('fundingArbitrage');
    expect(typeof (en as Record<string, unknown>).fundingArbitrage).toBe('object');
    expect(typeof (vi as Record<string, unknown>).fundingArbitrage).toBe('object');
  });

  it('has errors namespace in both', () => {
    expect(en).toHaveProperty('errors');
    expect(vi).toHaveProperty('errors');
    expect(typeof (en as Record<string, unknown>).errors).toBe('object');
    expect(typeof (vi as Record<string, unknown>).errors).toBe('object');
  });
});
