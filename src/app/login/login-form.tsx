"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormItem } from "@/components/form-item";
import { SubmitButton } from "@/components/submit-button";
import { useLogin } from "@/features/auth/queries";
import { loginFormSchema, type LoginFormValues } from "@/lib/schemas";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const login = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      await login.mutateAsync(values);
      toast.success("Signed in successfully.");
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in.");
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <CalendarDays className="size-6" />
          <span className="font-heading text-xl font-semibold">Leave Manager</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use your work email to access your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-4"
              noValidate
            >
              <FormItem label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  aria-invalid={Boolean(form.formState.errors.email)}
                  {...form.register("email")}
                />
              </FormItem>

              <FormItem
                label="Password"
                htmlFor="password"
                error={form.formState.errors.password?.message}
              >
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={Boolean(form.formState.errors.password)}
                  {...form.register("password")}
                />
              </FormItem>

              <SubmitButton
                className="w-full"
                loading={form.formState.isSubmitting}
              >
                Sign in
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
        <div className="mt-4 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
          <p className="mb-1.5 font-medium text-foreground">Demo accounts</p>
          <p>admin@example.com &middot; employee@example.com</p>
          <p>Password: Qwerty@123</p>
        </div>
      </div>
    </div>
  );
}
