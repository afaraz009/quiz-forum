"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, Users } from "lucide-react";
import { LoadingPage } from "@/components/ui/loading-spinner";

export default function AdminDashboard() {
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

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
        Admin Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-card border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Test Management</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Create and manage published tests for all students.
          </p>
          <Link href="/admin/create-test">
            <Button className="w-full rounded-lg">Create New Test</Button>
          </Link>
        </div>
        <div className="bg-card border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-semibold">Results Dashboard</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            View student performance and analytics.
          </p>
          <Link href="/admin/results">
            <Button className="w-full bg-green-600 hover:bg-green-700 rounded-lg">
              View Results
            </Button>
          </Link>
        </div>
        <div className="bg-card border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-purple-500" />
            <h2 className="text-xl font-semibold">User Management</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Manage student accounts and permissions.
          </p>
          <Button variant="outline" className="w-full rounded-lg" disabled>
            Coming Soon
          </Button>
        </div>
      </div>
    </div>
  );
}
