import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  Pencil,
  Shirt,
  MapPin,
  Tag,
  Calendar,
  DollarSign,
  Star,
  Camera,
  Layers,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { TagPrint } from "@/components/inventory/tag-print";

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-green-600/20 text-green-400 border-green-600/30",
  RENTED: "bg-purple-600/20 text-purple-400 border-purple-600/30",
  RESERVED: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  MAINTENANCE: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
  RETIRED: "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",
};

const conditionColors: Record<string, string> = {
  EXCELLENT: "text-green-400",
  GOOD: "text-blue-400",
  FAIR: "text-yellow-400",
  POOR: "text-orange-400",
  NEEDS_REPAIR: "text-red-400",
};

const photoTypeIcons: Record<string, React.ReactNode> = {
  MAIN: <Star className="w-3 h-3" />,
  ALTERNATE: <Camera className="w-3 h-3" />,
  FEATURE: <Layers className="w-3 h-3" />,
  MATERIAL: <Shirt className="w-3 h-3" />,
  INFO: <Info className="w-3 h-3" />,
};

export default async function CostumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return null;
  }

  const { id } = await params;

  const costume = await db.costumeItem.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      category: true,
      photos: {
        orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
      },
      rentalItems: {
        include: {
          rental: {
            include: {
              customer: true,
              production: true,
            },
          },
        },
        orderBy: { rental: { checkoutDate: "desc" } },
        take: 10,
      },
    },
  });

  if (!costume) {
    notFound();
  }

  const mainPhoto = costume.photos.find((p) => p.type === "MAIN");
  const otherPhotos = costume.photos.filter((p) => p.type !== "MAIN");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/inventory"
            className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-100 mb-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Inventory
          </Link>
          <h1 className="text-xl lg:text-2xl font-bold text-zinc-100">{costume.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            {costume.sku && (
              <span className="text-sm text-zinc-500 font-mono">{costume.sku}</span>
            )}
            <Badge variant="outline" className={statusColors[costume.status]}>
              {costume.status.toLowerCase()}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TagPrint
            item={{
              id: costume.id,
              name: costume.name,
              sku: costume.sku,
              organizationId: session.user.organizationId,
              category: costume.category,
              location: costume.location,
            }}
          />
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href={`/inventory/${costume.id}/edit`}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Photos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Photo */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              {mainPhoto ? (
                <div className="relative aspect-[4/5] max-w-md mx-auto rounded-lg overflow-hidden bg-zinc-800">
                  <Image
                    src={mainPhoto.url}
                    alt={costume.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="aspect-[4/5] max-w-md mx-auto rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Shirt className="w-16 h-16 text-zinc-700" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Other Photos */}
          {otherPhotos.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-zinc-200 text-base">Additional Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {otherPhotos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 group">
                      <Image
                        src={photo.url}
                        alt={photo.description || photo.type}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center gap-1 text-xs text-zinc-300">
                          {photoTypeIcons[photo.type]}
                          <span className="truncate">{photo.type.toLowerCase()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {costume.description && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-zinc-200 text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400 whitespace-pre-wrap">{costume.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Rental History */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-zinc-200 text-base">Rental History</CardTitle>
              <CardDescription className="text-zinc-500">Recent rentals for this item</CardDescription>
            </CardHeader>
            <CardContent>
              {costume.rentalItems.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-4">No rental history yet</p>
              ) : (
                <div className="space-y-2">
                  {costume.rentalItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/rentals/${item.rental.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-zinc-200">{item.rental.customer.name}</p>
                        <p className="text-xs text-zinc-500">
                          {item.rental.production?.name && `${item.rental.production.name} · `}
                          {format(item.rental.checkoutDate, "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          item.rental.status === "RETURNED"
                            ? "bg-zinc-700/50 text-zinc-400 border-zinc-600"
                            : item.rental.status === "ACTIVE"
                            ? "bg-green-600/20 text-green-400 border-green-600/30"
                            : "bg-zinc-600/20 text-zinc-400 border-zinc-600/30"
                        }
                      >
                        {item.rental.status.toLowerCase()}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-4">
          {/* Quick Info */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-zinc-200 text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {costume.category && (
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-zinc-500" />
                  <div>
                    <p className="text-xs text-zinc-500">Category</p>
                    <p className="text-zinc-200">{costume.category.name}</p>
                  </div>
                </div>
              )}

              {costume.size && (
                <div className="flex items-center gap-3">
                  <Shirt className="w-4 h-4 text-zinc-500" />
                  <div>
                    <p className="text-xs text-zinc-500">Size</p>
                    <p className="text-zinc-200">{costume.size}</p>
                  </div>
                </div>
              )}

              {costume.color && (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border border-zinc-600" style={{ backgroundColor: costume.color }} />
                  <div>
                    <p className="text-xs text-zinc-500">Color</p>
                    <p className="text-zinc-200">{costume.color}</p>
                  </div>
                </div>
              )}

              {costume.era && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <div>
                    <p className="text-xs text-zinc-500">Era / Period</p>
                    <p className="text-zinc-200">{costume.era}</p>
                  </div>
                </div>
              )}

              {costume.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-zinc-500" />
                  <div>
                    <p className="text-xs text-zinc-500">Location</p>
                    <p className="text-zinc-200">{costume.location}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${conditionColors[costume.condition]}`} />
                <div>
                  <p className="text-xs text-zinc-500">Condition</p>
                  <p className={conditionColors[costume.condition]}>
                    {costume.condition.replace("_", " ").toLowerCase()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          {(costume.purchasePrice || costume.rentalPrice) && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-zinc-200 text-base">Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {costume.purchasePrice && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Purchase Price</span>
                    <span className="text-zinc-200 font-medium">
                      ${costume.purchasePrice.toFixed(2)}
                    </span>
                  </div>
                )}
                {costume.rentalPrice && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Rental Price</span>
                    <span className="text-zinc-200 font-medium">
                      ${costume.rentalPrice.toFixed(2)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {costume.notes && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-zinc-200 text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400 text-sm whitespace-pre-wrap">{costume.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-4">
              <div className="text-xs text-zinc-500 space-y-1">
                <p>Added: {format(costume.createdAt, "MMM d, yyyy")}</p>
                <p>Updated: {format(costume.updatedAt, "MMM d, yyyy")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
