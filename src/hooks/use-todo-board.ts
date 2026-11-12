"use client";

import { useEffect, useReducer } from "react";
import { boardReducer, initialBoard } from "@/lib/todo";

export const useTodoBoard = () => {
  const [board, dispatch] = useReducer(boardReducer, undefined, initialBoard);

  useEffect(() => {
    if (!board.sorted.length) return;
    const expire = () => dispatch({ type: "expire", now: Date.now() });
    const nextDeadline = Math.min(...board.sorted.map((item) => item.expiresAt));
    const timer = setTimeout(expire, Math.max(0, nextDeadline - Date.now()));
    // Background tabs can throttle timers. Reconcile against real deadlines on return.
    const onVisible = () => {
      if (document.visibilityState === "visible") expire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [board.sorted]);

  return {
    board,
    sort: (id: string) => dispatch({ type: "sort", id, now: Date.now() }),
    returnItem: (id: string) => dispatch({ type: "return", id }),
    reset: () => dispatch({ type: "reset" }),
  };
};
