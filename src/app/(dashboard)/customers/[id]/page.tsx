import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CustomerForm } from "@/components/customers/customer-form";
import { PortalAccess } from "@/components/customers/portal-access";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { isAdminRole } from "@/lib/utils";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const isAdmin = isAdminRole(session.user.role);

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
        <h1 className="text-xl lg:text-2xl font-bold text-zinc-100">Edit Customer</h1>
        <p className="text-sm text-zinc-400">Update customer information</p>
      </div>

      <div className={`grid gap-6 ${isAdmin ? "lg:grid-cols-3" : ""}`}>
        <div className={isAdmin ? "lg:col-span-2" : ""}>
          <CustomerForm customer={customer} />
        </div>
        {isAdmin && (
          <div>
            <PortalAccess
              customerId={customer.id}
              customerName={customer.name}
              customerEmail={customer.email}
              portalEnabled={customer.portalEnabled}
              portalToken={customer.portalToken}
            />
          </div>
        )}
      </div>
    </div>
  );
}
