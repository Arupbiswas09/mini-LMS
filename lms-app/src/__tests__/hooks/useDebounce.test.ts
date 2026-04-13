import { useDebounce } from '@/hooks/useDebounce';
import { act, renderHook } from '@testing-library/react-native';

jest.useFakeTimers();

describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does not update value before delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    rerender({ value: 'updated', delay: 300 });
    expect(result.current).toBe('initial');
  });

  it('updates value after delay', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    rerender({ value: 'updated', delay: 300 });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('updated');
  });

  it('resets timer when value changes rapidly', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 300 } }
    );

    rerender({ value: 'ab', delay: 300 });
    act(() => { jest.advanceTimersByTime(100); });

    rerender({ value: 'abc', delay: 300 });
    act(() => { jest.advanceTimersByTime(100); });

    // Only 200ms total, value not updated yet
    expect(result.current).toBe('a');

    act(() => { jest.advanceTimersByTime(200); });
    expect(result.current).toBe('abc');
  });

  it('cleans up timer on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { unmount } = renderHook(() => useDebounce('value', 300));
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
