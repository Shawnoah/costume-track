import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <Image
          src="/CostumeTrack combo fullsize.png"
          alt="CostumeTrack"
          width={180}
          height={50}
          className="h-10 w-auto"
          priority
        />
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center space-y-8 max-w-2xl">
          <Image
            src="/CostumeTrack mark fullsize.png"
            alt="CostumeTrack Logo"
            width={120}
            height={120}
            className="mx-auto h-28 w-auto"
          />
          <h1 className="text-5xl font-bold text-zinc-100">
            Inventory Management for{" "}
            <span className="bg-linear-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
              Costume Professionals
            </span>
          </h1>
          <p className="text-xl text-zinc-400">
            Track your costume inventory, manage rentals, and keep your productions organized.
            Built for costume shops, theaters, and costume makers.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-lg transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 border border-zinc-700 hover:border-zinc-600 text-zinc-300 text-lg font-medium rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="border-t border-zinc-800 py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-lg bg-purple-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">Inventory Tracking</h3>
            <p className="text-zinc-400 text-sm">
              Organize costumes by category, size, era, and condition with photos and detailed notes.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-lg bg-green-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">Rental Management</h3>
            <p className="text-zinc-400 text-sm">
              Check out and return items, track overdue rentals, and maintain complete rental history.
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-lg bg-purple-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">Production Tracking</h3>
            <p className="text-zinc-400 text-sm">
              Manage customers, productions, and see exactly what&apos;s out for each show.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-zinc-500">
          <p>&copy; {new Date().getFullYear()} CostumeTrack, LLC. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-zinc-400 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-zinc-400 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
