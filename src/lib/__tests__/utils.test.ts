import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    const result = cn('px-4', 'py-2', 'bg-blue-500');
    expect(result).toBe('px-4 py-2 bg-blue-500');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');
  });

  it('should handle false conditions', () => {
    const isActive = false;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class');
  });

  it('should override conflicting Tailwind classes', () => {
    const result = cn('px-4', 'px-8');
    expect(result).toBe('px-8');
  });

  it('should handle arrays of classes', () => {
    const classes = ['px-4', 'py-2'];
    const result = cn(...classes, 'bg-red-500');
    expect(result).toBe('px-4 py-2 bg-red-500');
  });

  it('should handle undefined and null values', () => {
    const result = cn('base', undefined, null, 'end');
    expect(result).toBe('base end');
  });
});
