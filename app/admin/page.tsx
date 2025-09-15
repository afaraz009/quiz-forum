"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, BarChart3, Users } from "lucide-react"

export default function AdminDashboard() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session) {
    redirect("/login")
  }

  if (!session.user.isAdmin) {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        <strong>Success!</strong> Role-based authentication is working. You are an admin user.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Test Management</h2>
          </div>
          <p className="text-gray-600 mb-4">Create and manage published tests for all students.</p>
          <Link href="/admin/create-test">
            <Button className="w-full">
              Create New Test
            </Button>
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-semibold">Results Dashboard</h2>
          </div>
          <p className="text-gray-600 mb-4">View student performance and analytics.</p>
          <Link href="/admin/results">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              View Results
            </Button>
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-purple-500" />
            <h2 className="text-xl font-semibold">User Management</h2>
          </div>
          <p className="text-gray-600 mb-4">Manage student accounts and permissions.</p>
          <Button variant="outline" className="w-full" disabled>
            Coming Soon
          </Button>
        </div>
      </div>
      
      <div className="mt-8 bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Session Info (for testing):</h3>
        <pre className="text-sm overflow-x-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
    </div>
  )
}