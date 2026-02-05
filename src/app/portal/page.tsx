import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shirt, Calendar, MapPin, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  RETURNED: "bg-green-600/20 text-green-400 border-green-600/30",
  OVERDUE: "bg-red-600/20 text-red-400 border-red-600/30",
  CANCELLED: "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",
};

const statusIcons: Record<string, React.ReactNode> = {
  ACTIVE: <Clock className="w-4 h-4" />,
  RETURNED: <CheckCircle2 className="w-4 h-4" />,
  OVERDUE: <AlertCircle className="w-4 h-4" />,
  CANCELLED: <AlertCircle className="w-4 h-4" />,
};

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function CustomerPortalPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-zinc-100 mb-2">Access Denied</h1>
        <p className="text-zinc-400">
          Please use the link provided by your costume shop to access your rentals.
        </p>
      </div>
    );
  }

  // Look up customer by portal token
  const customer = await db.customer.findFirst({
    where: {
      portalToken: token,
      portalEnabled: true,
    },
    include: {
      organization: { select: { name: true } },
      rentals: {
        include: {
          production: { select: { name: true } },
          items: {
            include: {
              costumeItem: {
                include: {
                  photos: {
                    where: { type: "MAIN" },
                    take: 1,
                  },
                },
              },
            },
          },
        },
        orderBy: { checkoutDate: "desc" },
      },
    },
  });

  if (!customer) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-zinc-100 mb-2">Invalid or Disabled Link</h1>
        <p className="text-zinc-400">
          This portal link is no longer valid. Please contact your costume shop for a new link.
        </p>
      </div>
    );
  }

  const activeRentals = customer.rentals.filter((r) => r.status === "ACTIVE" || r.status === "OVERDUE");
  const pastRentals = customer.rentals.filter((r) => r.status === "RETURNED" || r.status === "CANCELLED");

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Welcome, {customer.name}</h1>
        <p className="text-zinc-400">
          View your costume rentals from {customer.organization.name}
        </p>
      </div>

      {/* Active Rentals */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          Current Rentals
          {activeRentals.length > 0 && (
            <Badge variant="outline" className="ml-2 bg-blue-600/20 text-blue-400 border-blue-600/30">
              {activeRentals.length}
            </Badge>
          )}
        </h2>

        {activeRentals.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-8 text-center text-zinc-500">
              No active rentals
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeRentals.map((rental) => (
              <RentalCard key={rental.id} rental={rental} />
            ))}
          </div>
        )}
      </section>

      {/* Past Rentals */}
      {pastRentals.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            Past Rentals
          </h2>
          <div className="space-y-4">
            {pastRentals.map((rental) => (
              <RentalCard key={rental.id} rental={rental} />
            ))}
          </div>
        </section>
      )}

      {/* Contact Info */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-200 text-base">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="text-zinc-400 text-sm">
          Contact {customer.organization.name} for questions about your rentals, returns, or to extend your rental period.
        </CardContent>
      </Card>
    </div>
  );
}

interface RentalCardProps {
  rental: {
    id: string;
    status: string;
    checkoutDate: Date;
    dueDate: Date;
    returnDate: Date | null;
    production: { name: string } | null;
    items: {
      id: string;
      costumeItem: {
        id: string;
        name: string;
        photos: { url: string }[];
      };
    }[];
  };
}

function RentalCard({ rental }: RentalCardProps) {
  const isOverdue = rental.status === "ACTIVE" && new Date(rental.dueDate) < new Date();
  const displayStatus = isOverdue ? "OVERDUE" : rental.status;

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            {rental.production && (
              <p className="text-sm text-zinc-400">{rental.production.name}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-zinc-500 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Checked out: {format(rental.checkoutDate, "MMM d, yyyy")}
              </span>
            </div>
          </div>
          <Badge variant="outline" className={`${statusColors[displayStatus]} flex items-center gap-1`}>
            {statusIcons[displayStatus]}
            {displayStatus === "OVERDUE" ? "Overdue" : displayStatus.toLowerCase()}
          </Badge>
        </div>

        {/* Due Date */}
        <div className={`text-sm mb-4 p-2 rounded ${
          displayStatus === "OVERDUE"
            ? "bg-red-950/50 text-red-400"
            : displayStatus === "ACTIVE"
              ? "bg-blue-950/50 text-blue-400"
              : "bg-zinc-800 text-zinc-400"
        }`}>
          {rental.returnDate ? (
            <>Returned: {format(rental.returnDate, "MMM d, yyyy")}</>
          ) : (
            <>Due: {format(rental.dueDate, "MMM d, yyyy")}</>
          )}
        </div>

        {/* Items */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Items ({rental.items.length})
          </p>
          <div className="grid gap-2">
            {rental.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 bg-zinc-800/50 rounded"
              >
                <div className="relative w-10 h-12 rounded overflow-hidden bg-zinc-700 shrink-0">
                  {item.costumeItem.photos[0] ? (
                    <Image
                      src={item.costumeItem.photos[0].url}
                      alt={item.costumeItem.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Shirt className="w-4 h-4 text-zinc-500" />
                    </div>
                  )}
                </div>
                <span className="text-sm text-zinc-300">{item.costumeItem.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
