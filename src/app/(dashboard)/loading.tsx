import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    </div>
  );
}
