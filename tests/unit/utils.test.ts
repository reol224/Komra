import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('should return empty string for no arguments', () => {
      expect(cn()).toBe('');
    });

    it('should return single class unchanged', () => {
      expect(cn('foo')).toBe('foo');
    });

    it('should merge multiple classes', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes with clsx', () => {
      expect(cn('foo', true && 'bar')).toBe('foo bar');
      expect(cn('foo', false && 'bar')).toBe('foo');
    });

    it('should handle undefined and null values', () => {
      expect(cn('foo', undefined, 'bar')).toBe('foo bar');
      expect(cn('foo', null, 'bar')).toBe('foo bar');
    });

    it('should handle object syntax', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });

    it('should handle array syntax', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('should handle nested arrays', () => {
      expect(cn(['foo', ['bar', 'baz']])).toBe('foo bar baz');
    });

    it('should merge tailwind classes correctly (twMerge)', () => {
      // twMerge should override conflicting classes
      expect(cn('px-2', 'px-4')).toBe('px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
      expect(cn('bg-red-100', 'bg-blue-200')).toBe('bg-blue-200');
    });

    it('should merge tailwind variants correctly', () => {
      expect(cn('hover:bg-red-500', 'hover:bg-blue-500')).toBe('hover:bg-blue-500');
      expect(cn('sm:text-sm', 'sm:text-lg')).toBe('sm:text-lg');
    });

    it('should preserve non-conflicting tailwind classes', () => {
      expect(cn('px-2', 'py-4')).toBe('px-2 py-4');
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
    });

    it('should handle complex combinations', () => {
      const result = cn(
        'base-class',
        true && 'conditional-class',
        false && 'hidden-class',
        { 'object-class': true },
        ['array-class'],
        undefined,
        null
      );
      expect(result).toBe('base-class conditional-class object-class array-class');
    });

    it('should handle tailwind modifiers and base class conflicts', () => {
      // Base class and modifier class should both be preserved
      expect(cn('bg-red-500', 'hover:bg-red-700')).toBe('bg-red-500 hover:bg-red-700');
    });

    it('should handle empty strings', () => {
      expect(cn('', 'foo', '')).toBe('foo');
    });

    it('should handle whitespace-only strings', () => {
      expect(cn('foo', '   ', 'bar')).toBe('foo bar');
    });

    it('should handle common button styling pattern', () => {
      const baseStyles = 'px-4 py-2 rounded';
      const variantStyles = 'bg-blue-500 text-white';
      const overrideStyles = 'px-6'; // override px-4

      expect(cn(baseStyles, variantStyles, overrideStyles)).toBe(
        'py-2 rounded bg-blue-500 text-white px-6'
      );
    });

    it('should handle flex and grid conflicts', () => {
      expect(cn('flex', 'grid')).toBe('grid');
      expect(cn('flex-col', 'flex-row')).toBe('flex-row');
    });

    it('should handle mixed types in single call', () => {
      const result = cn(
        'string-class',
        ['array-class-1', 'array-class-2'],
        { 'enabled-class': true, 'disabled-class': false },
        true && 'truthy-class',
        false && 'falsy-class'
      );
      expect(result).toContain('string-class');
      expect(result).toContain('array-class-1');
      expect(result).toContain('array-class-2');
      expect(result).toContain('enabled-class');
      expect(result).not.toContain('disabled-class');
      expect(result).toContain('truthy-class');
      expect(result).not.toContain('falsy-class');
    });
  });
});
