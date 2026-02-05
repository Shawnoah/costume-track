import { CustomerForm } from "@/components/customers/customer-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewCustomerPage() {
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
        <h1 className="text-2xl font-bold text-zinc-100">Add New Customer</h1>
        <p className="text-zinc-400">Add a new customer to your database</p>
      </div>

      <CustomerForm />
    </div>
  );
}
