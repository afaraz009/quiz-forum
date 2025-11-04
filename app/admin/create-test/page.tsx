"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { TestCreator } from "@/components/admin/test-creator";
import { LoadingPage } from "@/components/ui/loading-spinner";

export default function CreateTestPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <LoadingPage />;
  }

  if (!session) {
    redirect("/login");
  }

  if (!session.user.isAdmin) {
    redirect("/dashboard");
  }

  return <TestCreator />;
}
