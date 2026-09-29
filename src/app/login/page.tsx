import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/dashboard";
  return <LoginForm nextPath={nextPath} />;
}