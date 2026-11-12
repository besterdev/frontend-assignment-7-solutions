import { act, renderHook, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useTodoBoard } from "@/hooks/use-todo-board";
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("keeps independent deadlines when items are clicked at different times", () => {
  const { result } = renderHook(useTodoBoard);
  act(() => result.current.sort("apple"));
  act(() => vi.advanceTimersByTime(2000));
  act(() => result.current.sort("broccoli"));
  act(() => vi.advanceTimersByTime(2999));
  expect(result.current.board.sorted).toHaveLength(2);
  act(() => vi.advanceTimersByTime(1));
  expect(result.current.board.available.at(-1)).toBe("apple");
  expect(result.current.board.sorted.map((i) => i.id)).toEqual(["broccoli"]);
  act(() => vi.advanceTimersByTime(2000));
  expect(result.current.board.available.at(-1)).toBe("broccoli");
});
it("cancels stale timers on reset and unmount", () => {
  const { result, unmount } = renderHook(useTodoBoard);
  act(() => result.current.sort("apple"));
  act(() => result.current.reset());
  expect(vi.getTimerCount()).toBe(0);
  act(() => result.current.sort("apple"));
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
