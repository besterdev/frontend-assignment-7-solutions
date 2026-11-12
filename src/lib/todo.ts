export const RETURN_DELAY = 5_000;
export type ItemType = "Fruit" | "Vegetable";
export type Item = { id: string; type: ItemType; name: string; emoji: string };
export const ITEMS: Item[] = [
  ["Fruit", "Apple", "🍎"],
  ["Vegetable", "Broccoli", "🥦"],
  ["Vegetable", "Mushroom", "🍄"],
  ["Fruit", "Banana", "🍌"],
  ["Vegetable", "Tomato", "🍅"],
  ["Fruit", "Orange", "🍊"],
  ["Fruit", "Mango", "🥭"],
  ["Fruit", "Pineapple", "🍍"],
  ["Vegetable", "Cucumber", "🥒"],
  ["Fruit", "Watermelon", "🍉"],
  ["Vegetable", "Carrot", "🥕"],
].map(([type, name, emoji]) => ({
  id: name.toLowerCase(),
  type: type as ItemType,
  name,
  emoji,
}));
export type Placement = { id: string; expiresAt: number };
export type Board = { available: string[]; sorted: Placement[] };
export const initialBoard = (): Board => ({
  available: ITEMS.map((item) => item.id),
  sorted: [],
});
export type Action =
  | { type: "sort"; id: string; now: number }
  | { type: "return"; id: string }
  | { type: "expire"; now: number }
  | { type: "reset" };
export const boardReducer = (state: Board, action: Action): Board => {
  switch (action.type) {
    case "sort":
      if (!state.available.includes(action.id)) return state;
      return {
        available: state.available.filter((id) => id !== action.id),
        sorted: [
          ...state.sorted,
          { id: action.id, expiresAt: action.now + RETURN_DELAY },
        ],
      };
    case "return":
      if (!state.sorted.some((item) => item.id === action.id)) return state;
      return {
        available: [...state.available, action.id],
        sorted: state.sorted.filter((item) => item.id !== action.id),
      };
    case "expire": {
      const expired = state.sorted
        .filter((item) => item.expiresAt <= action.now)
        .sort((a, b) => a.expiresAt - b.expiresAt);
      if (!expired.length) return state;
      return {
        available: [...state.available, ...expired.map((item) => item.id)],
        sorted: state.sorted.filter((item) => item.expiresAt > action.now),
      };
    }
    case "reset":
      return initialBoard();
  }
};
