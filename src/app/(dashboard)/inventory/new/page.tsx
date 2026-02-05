import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CostumeForm } from "@/components/inventory/costume-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewCostumePage() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return null;
  }

  const categories = await db.category.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/inventory"
          className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-100 mb-2"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Inventory
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">Add New Costume</h1>
        <p className="text-zinc-400">Add a new item to your inventory</p>
      </div>

      <CostumeForm categories={categories} />
    </div>
  );
}
