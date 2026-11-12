import { describe, expect, it, vi } from "vitest";
import { groupByDepartment, type User } from "@/lib/departments";
import { GET } from "@/app/api/departments/route";
const user = (overrides: Partial<User> = {}): User => ({
  firstName: "Amy",
  lastName: "Lee",
  age: 30,
  gender: "female",
  hair: { color: "Black" },
  address: { postalCode: "10100" },
  company: { department: "Engineering" },
  ...overrides,
});
describe("department summary", () => {
  it("counts genders and hair colors, computes min/max, maps postal codes, and separates departments", () => {
    expect(
      groupByDepartment([
        user(),
        user({ firstName: "Bob", gender: "male", age: 22 }),
        user({ firstName: "Cal", age: 45, hair: { color: "Blond" } }),
        user({ company: { department: "Sales" } }),
      ]),
    ).toEqual({
      Engineering: {
        male: 1,
        female: 2,
        ageRange: "22-45",
        hair: { Black: 2, Blond: 1 },
        addressUser: { AmyLee: "10100", BobLee: "10100", CalLee: "10100" },
      },
      Sales: {
        male: 0,
        female: 1,
        ageRange: "30-30",
        hair: { Black: 1 },
        addressUser: { AmyLee: "10100" },
      },
    });
  });
  it("handles empty data and prototype-like keys safely", () => {
    expect(groupByDepartment([])).toEqual({});
    expect(
      groupByDepartment([
        user({
          company: { department: "__proto__" },
          hair: { color: "constructor" },
        }),
      ])["__proto__"].hair.constructor,
    ).toBe(1);
  });
  it("returns JSON from the HTTP endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ users: [user()] })),
    );
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(groupByDepartment([user()]));
    vi.unstubAllGlobals();
  });
  it.each([new Response("", { status: 500 }), Response.json({ users: [{}] })])(
    "returns 502 for upstream or validation failures",
    async (response) => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
      expect((await GET()).status).toBe(502);
      vi.unstubAllGlobals();
    },
  );
});
