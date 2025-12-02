// app/(auth)/reset-password/page.tsx
"use client";

import { Suspense } from "react";
import ResetPasswordPage from "./ResetPasswordPage";

export default function Wrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}
