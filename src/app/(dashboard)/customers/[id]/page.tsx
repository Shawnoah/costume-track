import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CustomerForm } from "@/components/customers/customer-form";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return null;
  }

  const { id } = await params;

  const customer = await db.customer.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-100 mb-2"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Customers
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">Edit Customer</h1>
        <p className="text-zinc-400">Update customer information</p>
      </div>

      <CustomerForm customer={customer} />
    </div>
  );
}
