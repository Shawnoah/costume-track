import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProductionDetail } from "@/components/productions/production-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductionPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return null;
  }

  const { id } = await params;

  const production = await db.production.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      rentals: {
        include: {
          customer: true,
          items: {
            include: { costumeItem: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!production) {
    notFound();
  }

  return (
    <ProductionDetail
      production={{
        id: production.id,
        name: production.name,
        venue: production.venue,
        director: production.director,
        startDate: production.startDate?.toISOString() || null,
        endDate: production.endDate?.toISOString() || null,
        notes: production.notes,
        rentals: production.rentals.map((rental) => ({
          id: rental.id,
          status: rental.status,
          checkoutDate: rental.checkoutDate.toISOString(),
          dueDate: rental.dueDate.toISOString(),
          returnDate: rental.returnDate?.toISOString() || null,
          customer: {
            id: rental.customer.id,
            name: rental.customer.name,
          },
          items: rental.items.map((item) => ({
            id: item.id,
            costumeItem: {
              id: item.costumeItem.id,
              name: item.costumeItem.name,
            },
          })),
        })),
      }}
    />
  );
}
