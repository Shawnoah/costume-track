export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold bg-linear-to-r from-purple-500 via-green-400 to-purple-500 bg-clip-text text-transparent">
          CostumeTrack
        </h1>
        <p className="text-zinc-400 text-xl">
          Inventory management for costume shops & theaters
        </p>
        <div className="flex gap-2 justify-center">
          <span className="inline-block w-3 h-3 rounded-full bg-purple-500 animate-pulse"></span>
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 animate-pulse delay-100"></span>
          <span className="inline-block w-3 h-3 rounded-full bg-purple-500 animate-pulse delay-200"></span>
        </div>
        <p className="text-zinc-600 text-sm">Coming Soon</p>
      </div>
    </div>
  );
}
