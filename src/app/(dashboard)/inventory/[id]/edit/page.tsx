import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { CostumeForm } from "@/components/inventory/costume-form";
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
      include: {
        photos: {
          orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
        },
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
          href={`/inventory/${costume.id}`}
          className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-100 mb-2"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Details
        </Link>
        <h1 className="text-xl lg:text-2xl font-bold text-zinc-100">Edit Costume</h1>
        <p className="text-sm text-zinc-400">{costume.name}</p>
      </div>

      <CostumeForm categories={categories} costume={costume} />
    </div>
  );
}
