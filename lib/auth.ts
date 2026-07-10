import { cookies } from "next/headers";

export async function requireSession() {
  const session = (await cookies()).get("session")?.value;
  if (!process.env.AUTH_SECRET || session !== process.env.AUTH_SECRET) {
    throw new Error("Unauthorized");
  }
}
