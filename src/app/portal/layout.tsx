import Image from "next/image";
import Link from "next/link";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
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
          <span className="text-sm text-zinc-500">Customer Portal</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-zinc-500 text-sm">
          &copy; {new Date().getFullYear()} CostumeTrack, LLC. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
