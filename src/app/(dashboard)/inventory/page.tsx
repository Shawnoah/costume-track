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
import { Shirt, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { InventoryActions } from "@/components/inventory/inventory-actions";
import { InventoryFilters } from "@/components/inventory/inventory-filters";
import { Pagination } from "@/components/ui/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

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
  page?: string;
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const params = await searchParams;
  const search = params.search || "";
  const statusFilter = params.status || "";
  const categoryFilter = params.category || "";
  const page = Math.max(1, parseInt(params.page || "1"));
  const pageSize = DEFAULT_PAGE_SIZE;

  const where = {
    organizationId: session.user.organizationId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { sku: { contains: search, mode: "insensitive" as const } },
        { color: { contains: search, mode: "insensitive" as const } },
        { era: { contains: search, mode: "insensitive" as const } },
        { location: { contains: search, mode: "insensitive" as const } },
        { notes: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(statusFilter && statusFilter !== "all" && { status: statusFilter as "AVAILABLE" | "RENTED" | "RESERVED" | "MAINTENANCE" | "RETIRED" }),
    ...(categoryFilter && categoryFilter !== "all" && { categoryId: categoryFilter }),
  };

  const [costumes, total, categories] = await Promise.all([
    db.costumeItem.findMany({
      where,
      include: {
        category: true,
        photos: {
          where: { type: "MAIN" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.costumeItem.count({ where }),
    db.category.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-zinc-100">Inventory</h1>
          <p className="text-sm text-zinc-400">Manage your costume collection</p>
        </div>
        <InventoryActions />
      </div>

      {/* Filters */}
      <InventoryFilters
        categories={categories}
        initialSearch={search}
        initialStatus={statusFilter}
        initialCategory={categoryFilter}
      />

      {/* Content */}
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
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {costumes.map((costume) => (
              <Link
                key={costume.id}
                href={`/inventory/${costume.id}`}
                className="block bg-zinc-900 rounded-lg border border-zinc-800 p-3 hover:border-zinc-700 transition-colors"
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-20 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0">
                    {costume.photos[0] ? (
                      <Image
                        src={costume.photos[0].url}
                        alt={costume.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Shirt className="w-6 h-6 text-zinc-600" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-zinc-200 truncate">{costume.name}</h3>
                        {costume.sku && (
                          <p className="text-xs text-zinc-500">{costume.sku}</p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`${statusColors[costume.status]} text-xs flex-shrink-0`}
                      >
                        {costume.status.toLowerCase()}
                      </Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                      {costume.category && (
                        <span>{costume.category.name}</span>
                      )}
                      {costume.size && (
                        <span>Size: {costume.size}</span>
                      )}
                      <span className={conditionColors[costume.condition]}>
                        {costume.condition.replace("_", " ").toLowerCase()}
                      </span>
                    </div>

                    {costume.location && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{costume.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400 w-12"></TableHead>
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
                    <TableCell className="w-12">
                      <Link href={`/inventory/${costume.id}`}>
                        <div className="relative w-10 h-12 rounded overflow-hidden bg-zinc-800">
                          {costume.photos[0] ? (
                            <Image
                              src={costume.photos[0].url}
                              alt={costume.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Shirt className="w-4 h-4 text-zinc-600" />
                            </div>
                          )}
                        </div>
                      </Link>
                    </TableCell>
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

          {/* Pagination */}
          <div className="mt-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
            />
          </div>
        </>
      )}
    </div>
  );
}
