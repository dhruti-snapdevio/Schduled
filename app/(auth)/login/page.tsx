import { Suspense } from "react";
import { AuthForm } from "@/app/(auth)/_components/auth-form";
import { getEffectiveSignInMethods } from "@/lib/settings/sign-in-methods";

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const methods = await getEffectiveSignInMethods();
  return (
    <Suspense>
      <AuthForm
        googleEnabled={methods.google}
        magicLinkEnabled={methods.magicLink}
        passwordEnabled={methods.password}
      />
    </Suspense>
  );
}
