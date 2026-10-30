import type { Metadata } from "next";
import { LoginScreen } from "@/modules/auth/LoginScreen";

export const metadata: Metadata = { title: "Sign in · Atomity CMS" };

export default async function LoginPage(props: PageProps<"/login">) {
  const { next } = await props.searchParams;
  return <LoginScreen next={typeof next === "string" ? next : undefined} />;
}
