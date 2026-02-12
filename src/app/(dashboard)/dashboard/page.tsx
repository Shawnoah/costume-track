import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
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
  ArrowRight,
  Calendar,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

async function getDashboardStats(organizationId: string) {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const [
    totalCostumes,
    availableCostumes,
    rentedCostumes,
    maintenanceCostumes,
    activeRentals,
    overdueRentals,
    dueSoonRentals,
    totalCustomers,
    recentCustomers,
  ] = await Promise.all([
    db.costumeItem.count({ where: { organizationId } }),
    db.costumeItem.count({ where: { organizationId, status: "AVAILABLE" } }),
    db.costumeItem.count({ where: { organizationId, status: "RENTED" } }),
    db.costumeItem.count({ where: { organizationId, status: "MAINTENANCE" } }),
    db.rental.count({ where: { organizationId, status: "ACTIVE" } }),
    db.rental.count({
      where: {
        organizationId,
        status: "ACTIVE",
        dueDate: { lt: now },
      },
    }),
    db.rental.count({
      where: {
        organizationId,
        status: "ACTIVE",
        dueDate: { gte: now, lte: threeDaysFromNow },
      },
    }),
    db.customer.count({ where: { organizationId } }),
    db.customer.count({
      where: {
        organizationId,
        createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return {
    totalCostumes,
    availableCostumes,
    rentedCostumes,
    maintenanceCostumes,
    activeRentals,
    overdueRentals,
    dueSoonRentals,
    totalCustomers,
    recentCustomers,
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

async function getUpcomingDue(organizationId: string) {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return db.rental.findMany({
    where: {
      organizationId,
      status: "ACTIVE",
      dueDate: { lte: weekFromNow },
    },
    include: {
      customer: true,
      items: { include: { costumeItem: true } },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
  });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const [stats, recentRentals, upcomingDue] = await Promise.all([
    getDashboardStats(session.user.organizationId),
    getRecentRentals(session.user.organizationId),
    getUpcomingDue(session.user.organizationId),
  ]);

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-zinc-100">Dashboard</h1>
          <p className="text-sm text-zinc-400">Welcome back, {session.user.name}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <Link href="/rentals/new">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">New Rental</span>
              <span className="sm:hidden">Rental</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700">
            <Link href="/inventory/new">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Costume</span>
              <span className="sm:hidden">Costume</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-zinc-400">Inventory</CardTitle>
            <Shirt className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-zinc-100">{stats.totalCostumes}</div>
            <p className="text-xs text-zinc-500">
              {stats.availableCostumes} available
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-zinc-400">Active Rentals</CardTitle>
            <ClipboardList className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-zinc-100">{stats.activeRentals}</div>
            <p className="text-xs text-zinc-500">
              {stats.rentedCostumes} items out
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-zinc-900 border-zinc-800 ${stats.overdueRentals > 0 ? "border-red-900/50" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-zinc-400">Overdue</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.overdueRentals > 0 ? "text-red-400" : "text-zinc-600"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold ${stats.overdueRentals > 0 ? "text-red-400" : "text-zinc-100"}`}>
              {stats.overdueRentals}
            </div>
            <p className="text-xs text-zinc-500">
              {stats.dueSoonRentals > 0 ? `${stats.dueSoonRentals} due soon` : "All on track"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-zinc-400">Customers</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-zinc-100">{stats.totalCustomers}</div>
            <p className="text-xs text-zinc-500">
              {stats.recentCustomers > 0 ? `+${stats.recentCustomers} this month` : "Total registered"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upcoming Due */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-zinc-100 text-base">Due This Week</CardTitle>
                <CardDescription className="text-zinc-500 text-xs">Rentals requiring attention</CardDescription>
              </div>
              <Calendar className="w-4 h-4 text-zinc-500" />
            </div>
          </CardHeader>
          <CardContent>
            {upcomingDue.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-4">No rentals due this week</p>
            ) : (
              <div className="space-y-2">
                {upcomingDue.map((rental) => {
                  const isOverdue = new Date(rental.dueDate) < new Date();
                  return (
                    <Link
                      key={rental.id}
                      href={`/rentals/${rental.id}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-200 text-sm truncate">{rental.customer.name}</p>
                        <p className="text-xs text-zinc-500">
                          {rental.items.length} item{rental.items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${
                          isOverdue
                            ? "bg-red-600/20 text-red-400 border-red-600/30"
                            : "bg-yellow-600/20 text-yellow-400 border-yellow-600/30"
                        }`}
                      >
                        {isOverdue ? "Overdue" : format(rental.dueDate, "MMM d")}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Rentals */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-zinc-100 text-base">Recent Activity</CardTitle>
                <CardDescription className="text-zinc-500 text-xs">Latest rentals</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100 h-8">
                <Link href="/rentals">
                  View all
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentRentals.length === 0 ? (
              <div className="text-center py-4">
                <ClipboardList className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">No rentals yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentRentals.map((rental) => {
                  const isOverdue = rental.status === "ACTIVE" && new Date(rental.dueDate) < new Date();
                  return (
                    <Link
                      key={rental.id}
                      href={`/rentals/${rental.id}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-200 text-sm truncate">{rental.customer.name}</p>
                        <p className="text-xs text-zinc-500">
                          {rental.items.length} item{rental.items.length !== 1 ? "s" : ""} · {format(rental.createdAt, "MMM d")}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${
                          rental.status === "RETURNED"
                            ? "bg-zinc-700/50 text-zinc-400 border-zinc-600"
                            : isOverdue
                            ? "bg-red-600/20 text-red-400 border-red-600/30"
                            : "bg-green-600/20 text-green-400 border-green-600/30"
                        }`}
                      >
                        {isOverdue ? "Overdue" : rental.status.toLowerCase()}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      {stats.maintenanceCostumes > 0 && (
        <Card className="bg-zinc-900 border-zinc-800 border-yellow-900/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-600/20">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {stats.maintenanceCostumes} item{stats.maintenanceCostumes !== 1 ? "s" : ""} in maintenance
                  </p>
                  <p className="text-xs text-zinc-500">Review and return to inventory when ready</p>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-zinc-400">
                <Link href="/inventory?status=MAINTENANCE">View</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
