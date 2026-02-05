import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CostumeForm } from "@/components/inventory/costume-form";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function EditCostumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return null;
  }

  const { id } = await params;

  const [costume, categories] = await Promise.all([
    db.costumeItem.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    }),
    db.category.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!costume) {
    notFound();
  }

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
        <h1 className="text-2xl font-bold text-zinc-100">Edit Costume</h1>
        <p className="text-zinc-400">Update costume details</p>
      </div>

      <CostumeForm categories={categories} costume={costume} />
    </div>
  );
}
