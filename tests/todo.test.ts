import { describe, expect, it } from "vitest";
import { boardReducer, initialBoard, ITEMS } from "@/lib/todo";
describe("todo state transitions", () => {
  it("starts with the exact eleven items in order", () => {
    expect(initialBoard().available).toEqual(ITEMS.map((i) => i.id));
    expect(ITEMS).toHaveLength(11);
  });
  it("moves an item once and appends it on manual return", () => {
    const state = boardReducer(initialBoard(), {
      type: "sort",
      id: "apple",
      now: 100,
    });
    expect(state.sorted).toEqual([{ id: "apple", expiresAt: 5100 }]);
    expect(boardReducer(state, { type: "sort", id: "apple", now: 200 })).toBe(
      state,
    );
    const returned = boardReducer(state, { type: "return", id: "apple" });
    expect(returned.available.at(-1)).toBe("apple");
    expect(returned.sorted).toEqual([]);
    expect(boardReducer(returned, { type: "return", id: "apple" })).toBe(
      returned,
    );
  });
  it("expires independently at exactly five seconds and preserves total items", () => {
    let state = boardReducer(initialBoard(), {
      type: "sort",
      id: "apple",
      now: 0,
    });
    state = boardReducer(state, { type: "sort", id: "broccoli", now: 1000 });
    expect(boardReducer(state, { type: "expire", now: 4999 })).toBe(state);
    state = boardReducer(state, { type: "expire", now: 5000 });
    expect(state.available.at(-1)).toBe("apple");
    expect(state.sorted.map((i) => i.id)).toEqual(["broccoli"]);
    state = boardReducer(state, { type: "expire", now: 6000 });
    expect(state.available.slice(-2)).toEqual(["apple", "broccoli"]);
    expect(new Set(state.available).size).toBe(11);
  });
  it("does not let an old deadline expire an item that was returned and sorted again", () => {
    let state = boardReducer(initialBoard(), {
      type: "sort",
      id: "apple",
      now: 0,
    });
    state = boardReducer(state, { type: "return", id: "apple" });
    state = boardReducer(state, { type: "sort", id: "apple", now: 4000 });
    expect(boardReducer(state, { type: "expire", now: 5000 })).toBe(state);
    expect(boardReducer(state, { type: "reset" })).toEqual(initialBoard());
  });
  it("reconciles overdue items in deadline order after background throttling", () => {
    let state = initialBoard();
    for (const [index, item] of ITEMS.entries())
      state = boardReducer(state, {
        type: "sort",
        id: item.id,
        now: index * 100,
      });
    state = boardReducer(state, { type: "expire", now: 20000 });
    expect(state).toEqual(initialBoard());
  });
});
