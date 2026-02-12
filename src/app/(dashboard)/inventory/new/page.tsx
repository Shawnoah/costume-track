import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CostumeForm } from "@/components/inventory/costume-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ sku?: string }>;
}

export default async function NewCostumePage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const params = await searchParams;
  const defaultSku = params.sku || "";

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
        <h1 className="text-xl lg:text-2xl font-bold text-zinc-100">Add New Costume</h1>
        <p className="text-sm text-zinc-400">Add a new item to your inventory</p>
      </div>

      <CostumeForm categories={categories} defaultSku={defaultSku} />
    </div>
  );
}
