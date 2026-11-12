import { groupByDepartment, usersResponseSchema } from "@/lib/departments";

const getDepartmentSummary = async () => {
  try {
    const response = await fetch(
      "https://dummyjson.com/users?limit=0&select=firstName,lastName,age,gender,hair,address,company",
      { signal: AbortSignal.timeout(10_000), next: { revalidate: 300 } },
    );
    if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
    const { users } = usersResponseSchema.parse(await response.json());
    return Response.json(groupByDepartment(users));
  } catch (error) {
    console.error(
      "Department summary failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return Response.json(
      { error: "Unable to load department data. Please try again later." },
      { status: 502 },
    );
  }
};

// Next.js discovers route handlers by their HTTP method export.
export { getDepartmentSummary as GET };
