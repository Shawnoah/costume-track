import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shirt,
  ClipboardList,
  Users,
  AlertTriangle,
  Plus,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

async function getDashboardStats(organizationId: string) {
  const [
    totalCostumes,
    availableCostumes,
    activeRentals,
    overdueRentals,
    totalCustomers,
  ] = await Promise.all([
    db.costumeItem.count({ where: { organizationId } }),
    db.costumeItem.count({ where: { organizationId, status: "AVAILABLE" } }),
    db.rental.count({ where: { organizationId, status: "ACTIVE" } }),
    db.rental.count({
      where: {
        organizationId,
        status: "ACTIVE",
        dueDate: { lt: new Date() },
      },
    }),
    db.customer.count({ where: { organizationId } }),
  ]);

  return {
    totalCostumes,
    availableCostumes,
    activeRentals,
    overdueRentals,
    totalCustomers,
  };
}

async function getRecentRentals(organizationId: string) {
  return db.rental.findMany({
    where: { organizationId },
    include: {
      customer: true,
      items: {
        include: { costumeItem: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return null;
  }

  const [stats, recentRentals] = await Promise.all([
    getDashboardStats(session.user.organizationId),
    getRecentRentals(session.user.organizationId),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
          <p className="text-zinc-400">Welcome back, {session.user.name}</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <Link href="/rentals/new">
              <Plus className="w-4 h-4 mr-2" />
              New Rental
            </Link>
          </Button>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href="/inventory/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Costume
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Costumes</CardTitle>
            <Shirt className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{stats.totalCostumes}</div>
            <p className="text-xs text-zinc-500">
              {stats.availableCostumes} available
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Active Rentals</CardTitle>
            <ClipboardList className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{stats.activeRentals}</div>
            <p className="text-xs text-zinc-500">
              Currently checked out
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{stats.overdueRentals}</div>
            <p className="text-xs text-zinc-500">
              {stats.overdueRentals > 0 ? "Needs attention" : "All clear!"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Customers</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{stats.totalCustomers}</div>
            <p className="text-xs text-zinc-500">
              Total registered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Rentals */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-zinc-100">Recent Rentals</CardTitle>
            <CardDescription className="text-zinc-500">Latest rental activity</CardDescription>
          </div>
          <Button asChild variant="ghost" className="text-zinc-400 hover:text-zinc-100">
            <Link href="/rentals">
              View all
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentRentals.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No rentals yet</p>
              <Button asChild className="mt-4 bg-purple-600 hover:bg-purple-700">
                <Link href="/rentals/new">Create your first rental</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRentals.map((rental) => {
                const isOverdue = rental.status === "ACTIVE" && new Date(rental.dueDate) < new Date();
                return (
                  <Link
                    key={rental.id}
                    href={`/rentals/${rental.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium text-zinc-200">{rental.customer.name}</p>
                        <p className="text-sm text-zinc-500">
                          {rental.items.length} item{rental.items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          rental.status === "RETURNED"
                            ? "secondary"
                            : isOverdue
                            ? "destructive"
                            : "default"
                        }
                        className={
                          rental.status === "RETURNED"
                            ? "bg-zinc-700 text-zinc-300"
                            : isOverdue
                            ? "bg-red-600/20 text-red-400 border border-red-600/30"
                            : "bg-green-600/20 text-green-400 border border-green-600/30"
                        }
                      >
                        {isOverdue ? "Overdue" : rental.status.toLowerCase()}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
