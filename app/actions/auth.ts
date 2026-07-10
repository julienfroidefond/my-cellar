"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const password = formData.get("password");

  if (typeof password !== "string" || password !== process.env.AUTH_PASSWORD) {
    redirect("/login?error=1");
  }

  (await cookies()).set("session", process.env.AUTH_SECRET!, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}

export async function logoutAction() {
  await (await cookies()).delete("session");
  redirect("/login");
}
