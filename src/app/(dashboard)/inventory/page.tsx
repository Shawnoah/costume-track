import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Plus, Search, Shirt } from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-green-600/20 text-green-400 border-green-600/30",
  RENTED: "bg-purple-600/20 text-purple-400 border-purple-600/30",
  RESERVED: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  MAINTENANCE: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
  RETIRED: "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",
};

const conditionColors: Record<string, string> = {
  EXCELLENT: "text-green-400",
  GOOD: "text-blue-400",
  FAIR: "text-yellow-400",
  POOR: "text-orange-400",
  NEEDS_REPAIR: "text-red-400",
};

interface SearchParams {
  search?: string;
  status?: string;
  category?: string;
}

export default async function InventoryPage({
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
  const statusFilter = params.status || "";
  const categoryFilter = params.category || "";

  const [costumes, categories] = await Promise.all([
    db.costumeItem.findMany({
      where: {
        organizationId: session.user.organizationId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter as any }),
        ...(categoryFilter && categoryFilter !== "all" && { categoryId: categoryFilter }),
      },
      include: { category: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.category.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Inventory</h1>
          <p className="text-zinc-400">Manage your costume collection</p>
        </div>
        <Button asChild className="bg-purple-600 hover:bg-purple-700">
          <Link href="/inventory/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Costume
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <form>
            <Input
              name="search"
              placeholder="Search costumes..."
              defaultValue={search}
              className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
            />
          </form>
        </div>
        <Select defaultValue={statusFilter || "all"}>
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-zinc-100">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="RENTED">Rented</SelectItem>
            <SelectItem value="RESERVED">Reserved</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            <SelectItem value="RETIRED">Retired</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue={categoryFilter || "all"}>
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-zinc-100">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {costumes.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900 rounded-lg border border-zinc-800">
          <Shirt className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-zinc-300 mb-1">No costumes found</h3>
          <p className="text-zinc-500 mb-4">
            {search ? "Try a different search term" : "Start building your inventory"}
          </p>
          {!search && (
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link href="/inventory/new">Add your first costume</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Category</TableHead>
                <TableHead className="text-zinc-400">Size</TableHead>
                <TableHead className="text-zinc-400">Condition</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costumes.map((costume) => (
                <TableRow
                  key={costume.id}
                  className="border-zinc-800 hover:bg-zinc-800/50 cursor-pointer"
                >
                  <TableCell>
                    <Link href={`/inventory/${costume.id}`} className="block">
                      <div className="font-medium text-zinc-200">{costume.name}</div>
                      {costume.sku && (
                        <div className="text-xs text-zinc-500">{costume.sku}</div>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {costume.category?.name || "—"}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {costume.size || "—"}
                  </TableCell>
                  <TableCell>
                    <span className={conditionColors[costume.condition]}>
                      {costume.condition.replace("_", " ").toLowerCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusColors[costume.status]}
                    >
                      {costume.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {costume.location || "—"}
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
