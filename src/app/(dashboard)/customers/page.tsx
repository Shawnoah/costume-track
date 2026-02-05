import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Users } from "lucide-react";
import Link from "next/link";

interface SearchParams {
  search?: string;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return null;
  }

  const params = await searchParams;
  const search = params.search || "";

  const customers = await db.customer.findMany({
    where: {
      organizationId: session.user.organizationId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { company: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      rentals: {
        where: { status: "ACTIVE" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Customers</h1>
          <p className="text-zinc-400">Manage your customer database</p>
        </div>
        <Button asChild className="bg-purple-600 hover:bg-purple-700">
          <Link href="/customers/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <form>
          <Input
            name="search"
            placeholder="Search customers..."
            defaultValue={search}
            className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
          />
        </form>
      </div>

      {/* Table */}
      {customers.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900 rounded-lg border border-zinc-800">
          <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-zinc-300 mb-1">No customers found</h3>
          <p className="text-zinc-500 mb-4">
            {search ? "Try a different search term" : "Start building your customer list"}
          </p>
          {!search && (
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link href="/customers/new">Add your first customer</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Email</TableHead>
                <TableHead className="text-zinc-400">Phone</TableHead>
                <TableHead className="text-zinc-400">Company</TableHead>
                <TableHead className="text-zinc-400">Active Rentals</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="border-zinc-800 hover:bg-zinc-800/50 cursor-pointer"
                >
                  <TableCell>
                    <Link href={`/customers/${customer.id}`} className="font-medium text-zinc-200">
                      {customer.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {customer.email || "—"}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {customer.phone || "—"}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {customer.company || "—"}
                  </TableCell>
                  <TableCell>
                    {customer.rentals.length > 0 ? (
                      <span className="text-green-400">{customer.rentals.length}</span>
                    ) : (
                      <span className="text-zinc-500">0</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
