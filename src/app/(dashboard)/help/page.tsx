import { HelpContent } from "@/components/help/help-content";

export default function HelpPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-zinc-100">
          Help &amp; Guide
        </h1>
        <p className="text-sm text-zinc-400">
          Everything you need to know about using CostumeTrack
        </p>
      </div>

      <HelpContent />
    </div>
  );
}
