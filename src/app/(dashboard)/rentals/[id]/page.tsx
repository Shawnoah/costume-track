import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { ReturnRentalButton } from "@/components/rentals/return-button";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-600/20 text-green-400 border-green-600/30",
  RETURNED: "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",
  OVERDUE: "bg-red-600/20 text-red-400 border-red-600/30",
  CANCELLED: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
};

export default async function RentalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return null;
  }

  const { id } = await params;

  const rental = await db.rental.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      customer: true,
      production: true,
      createdBy: true,
      items: {
        include: { costumeItem: { include: { category: true } } },
      },
    },
  });

  if (!rental) {
    notFound();
  }

  const now = new Date();
  const isOverdue = rental.status === "ACTIVE" && new Date(rental.dueDate) < now;
  const displayStatus = isOverdue ? "OVERDUE" : rental.status;
  const daysOverdue = isOverdue ? differenceInDays(now, new Date(rental.dueDate)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/rentals"
            className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-100 mb-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Rentals
          </Link>
          <h1 className="text-2xl font-bold text-zinc-100">Rental Details</h1>
          <p className="text-zinc-400">
            Rental for {rental.customer.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={statusColors[displayStatus]}>
            {displayStatus.toLowerCase()}
            {daysOverdue > 0 && ` (${daysOverdue}d)`}
          </Badge>
          {rental.status === "ACTIVE" && (
            <ReturnRentalButton rentalId={rental.id} />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rental Info */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Rental Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-500">Customer</p>
                <p className="text-zinc-200">{rental.customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Production</p>
                <p className="text-zinc-200">{rental.production?.name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Checkout Date</p>
                <p className="text-zinc-200">
                  {format(new Date(rental.checkoutDate), "MMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Due Date</p>
                <p className={isOverdue ? "text-red-400" : "text-zinc-200"}>
                  {format(new Date(rental.dueDate), "MMM d, yyyy")}
                </p>
              </div>
              {rental.returnDate && (
                <div>
                  <p className="text-sm text-zinc-500">Return Date</p>
                  <p className="text-zinc-200">
                    {format(new Date(rental.returnDate), "MMM d, yyyy")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-zinc-500">Deposit</p>
                <p className="text-zinc-200">
                  {rental.depositAmount ? `$${rental.depositAmount.toFixed(2)}` : "—"}
                </p>
              </div>
            </div>
            {rental.notes && (
              <div>
                <p className="text-sm text-zinc-500">Notes</p>
                <p className="text-zinc-200">{rental.notes}</p>
              </div>
            )}
            <div className="pt-2 border-t border-zinc-800">
              <p className="text-xs text-zinc-500">
                Created by {rental.createdBy.name} on{" "}
                {format(new Date(rental.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">
              Items ({rental.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rental.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                >
                  <div>
                    <Link
                      href={`/inventory/${item.costumeItem.id}`}
                      className="font-medium text-zinc-200 hover:text-purple-400"
                    >
                      {item.costumeItem.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      {item.costumeItem.category && (
                        <Badge variant="outline" className="text-xs bg-zinc-700/50 text-zinc-400 border-zinc-600">
                          {item.costumeItem.category.name}
                        </Badge>
                      )}
                      {item.costumeItem.size && (
                        <span className="text-zinc-500 text-xs">
                          Size: {item.costumeItem.size}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-zinc-400">Checked out: {item.conditionOut.toLowerCase()}</p>
                    {item.conditionIn && (
                      <p className="text-zinc-400">Returned: {item.conditionIn.toLowerCase()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
