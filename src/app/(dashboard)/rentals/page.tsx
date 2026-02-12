import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ClipboardList } from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { Pagination } from "@/components/ui/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-600/20 text-green-400 border-green-600/30",
  RETURNED: "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",
  OVERDUE: "bg-red-600/20 text-red-400 border-red-600/30",
  CANCELLED: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
};

interface SearchParams {
  status?: string;
  page?: string;
}

export default async function RentalsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const params = await searchParams;
  const statusFilter = params.status || "";
  const page = Math.max(1, parseInt(params.page || "1"));
  const pageSize = DEFAULT_PAGE_SIZE;

  const where = {
    organizationId: session.user.organizationId,
    ...(statusFilter && statusFilter !== "all" && { status: statusFilter as "ACTIVE" | "RETURNED" | "OVERDUE" | "CANCELLED" }),
  };

  const [rentals, total] = await Promise.all([
    db.rental.findMany({
      where,
      include: {
        customer: true,
        production: true,
        items: {
          include: { costumeItem: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.rental.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // Check for overdue rentals
  const now = new Date();
  const rentalsWithStatus = rentals.map((rental) => {
    const isOverdue = rental.status === "ACTIVE" && new Date(rental.dueDate) < now;
    return {
      ...rental,
      displayStatus: isOverdue ? "OVERDUE" : rental.status,
      daysOverdue: isOverdue ? differenceInDays(now, new Date(rental.dueDate)) : 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Rentals</h1>
          <p className="text-sm text-zinc-400">Manage costume rentals and check-outs</p>
        </div>
        <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
          <Link href="/rentals/new">
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">New Rental</span>
            <span className="sm:hidden">New</span>
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select defaultValue={statusFilter || "all"}>
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-zinc-100">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="RETURNED">Returned</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {rentalsWithStatus.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900 rounded-lg border border-zinc-800">
          <ClipboardList className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-zinc-300 mb-1">No rentals found</h3>
          <p className="text-zinc-500 mb-4">Start tracking your costume rentals</p>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href="/rentals/new">Create your first rental</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Customer</TableHead>
                  <TableHead className="text-zinc-400">Production</TableHead>
                  <TableHead className="text-zinc-400">Items</TableHead>
                  <TableHead className="text-zinc-400">Checkout</TableHead>
                  <TableHead className="text-zinc-400">Due Date</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rentalsWithStatus.map((rental) => (
                  <TableRow
                    key={rental.id}
                    className="border-zinc-800 hover:bg-zinc-800/50 cursor-pointer"
                  >
                    <TableCell>
                      <Link href={`/rentals/${rental.id}`} className="font-medium text-zinc-200">
                        {rental.customer.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {rental.production?.name || "—"}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {rental.items.length} item{rental.items.length !== 1 ? "s" : ""}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {format(new Date(rental.checkoutDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {format(new Date(rental.dueDate), "MMM d, yyyy")}
                      {rental.daysOverdue > 0 && (
                        <span className="text-red-400 text-xs ml-2">
                          ({rental.daysOverdue}d overdue)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[rental.displayStatus]}
                      >
                        {rental.displayStatus.toLowerCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
          />
        </>
      )}
    </div>
  );
}
