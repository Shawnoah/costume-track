import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Globe, ExternalLink, Shirt } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function OrganizationLandingPage({ params }: PageProps) {
  const { slug } = await params;

  // Skip if this is a known route
  const reservedSlugs = [
    "login", "register", "dashboard", "inventory", "rentals",
    "customers", "productions", "settings", "portal", "api",
  ];
  if (reservedSlugs.includes(slug)) {
    notFound();
  }

  const organization = await db.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      contactEmail: true,
      contactPhone: true,
      address: true,
      website: true,
      logoUrl: true,
      publicPageEnabled: true,
    },
  });

  if (!organization || !organization.publicPageEnabled) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/CostumeTrack mark fullsize.png"
              alt="CostumeTrack"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-lg font-bold bg-linear-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
              CostumeTrack
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          {organization.logoUrl ? (
            <div className="relative w-24 h-24 mx-auto mb-6 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
              <Image
                src={organization.logoUrl}
                alt={organization.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto mb-6 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <Shirt className="w-10 h-10 text-zinc-600" />
            </div>
          )}

          <h1 className="text-3xl lg:text-4xl font-bold text-zinc-100 mb-4">
            {organization.name}
          </h1>

          {organization.description && (
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              {organization.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            asChild
            size="lg"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Link href={`/portal?org=${organization.slug}`}>
              View My Rentals
            </Link>
          </Button>
          {organization.contactEmail && (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <a href={`mailto:${organization.contactEmail}`}>
                <Mail className="w-4 h-4 mr-2" />
                Contact Us
              </a>
            </Button>
          )}
        </div>

        {/* Contact Info */}
        {(organization.contactEmail || organization.contactPhone || organization.address || organization.website) && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-zinc-200 mb-4">Contact Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {organization.contactEmail && (
                  <a
                    href={`mailto:${organization.contactEmail}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-purple-400" />
                    <span className="text-zinc-300">{organization.contactEmail}</span>
                  </a>
                )}

                {organization.contactPhone && (
                  <a
                    href={`tel:${organization.contactPhone}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-purple-400" />
                    <span className="text-zinc-300">{organization.contactPhone}</span>
                  </a>
                )}

                {organization.address && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50">
                    <MapPin className="w-5 h-5 text-purple-400 mt-0.5" />
                    <span className="text-zinc-300 whitespace-pre-line">{organization.address}</span>
                  </div>
                )}

                {organization.website && (
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                  >
                    <Globe className="w-5 h-5 text-purple-400" />
                    <span className="text-zinc-300 flex items-center gap-1">
                      Visit Website
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-zinc-500 text-sm">
            Powered by{" "}
            <Link href="/" className="text-purple-400 hover:text-purple-300">
              CostumeTrack
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
