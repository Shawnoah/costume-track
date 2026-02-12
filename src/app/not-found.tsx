import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 p-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-purple-400 mb-2">404</p>
        <h1 className="text-xl font-bold text-zinc-100 mb-2">Page not found</h1>
        <p className="text-zinc-400 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
