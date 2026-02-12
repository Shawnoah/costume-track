import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { RentalForm } from "@/components/rentals/rental-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewRentalPage() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const [customers, productions, availableCostumes] = await Promise.all([
    db.customer.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { name: "asc" },
    }),
    db.production.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { name: "asc" },
    }),
    db.costumeItem.findMany({
      where: {
        organizationId: session.user.organizationId,
        status: "AVAILABLE",
      },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/rentals"
          className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-100 mb-2"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Rentals
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">New Rental</h1>
        <p className="text-zinc-400">Create a new costume rental</p>
      </div>

      <RentalForm
        customers={customers}
        productions={productions}
        availableCostumes={availableCostumes}
      />
    </div>
  );
}
