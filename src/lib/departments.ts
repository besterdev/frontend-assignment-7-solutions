import { z } from "zod";
export const usersResponseSchema = z.object({
  users: z.array(
    z.object({
      firstName: z.string(),
      lastName: z.string(),
      age: z.number().int().nonnegative(),
      gender: z.enum(["male", "female"]),
      hair: z.object({ color: z.string() }),
      address: z.object({ postalCode: z.string() }),
      company: z.object({ department: z.string() }),
    }),
  ),
});
export type User = z.infer<typeof usersResponseSchema>["users"][number];
export type DepartmentSummary = {
  male: number;
  female: number;
  ageRange: string;
  hair: Record<string, number>;
  addressUser: Record<string, string>;
};
/** One traversal; O(n) time and O(n) output space. Null-prototype records accept arbitrary API keys safely. */
export const groupByDepartment = (
  users: User[],
): Record<string, DepartmentSummary> => {
  const groups: Record<string, DepartmentSummary> = Object.create(null);
  const ages = new Map<string, { min: number; max: number }>();
  for (const user of users) {
    const department = user.company.department;
    const group = (groups[department] ??= {
      male: 0,
      female: 0,
      ageRange: "",
      hair: Object.create(null),
      addressUser: Object.create(null),
    });
    group[user.gender]++;
    group.hair[user.hair.color] = (group.hair[user.hair.color] ?? 0) + 1;
    // The requested firstName+lastName key cannot represent duplicate names; last user wins.
    group.addressUser[`${user.firstName}${user.lastName}`] =
      user.address.postalCode;
    const range = ages.get(department) ?? { min: user.age, max: user.age };
    range.min = Math.min(range.min, user.age);
    range.max = Math.max(range.max, user.age);
    ages.set(department, range);
    group.ageRange = `${range.min}-${range.max}`;
  }
  return groups;
};
