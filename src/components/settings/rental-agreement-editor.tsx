"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Eye, RotateCcw, Loader2, Check } from "lucide-react";

interface RentalAgreementEditorProps {
  initialText: string | null;
}

const DEFAULT_AGREEMENT = `# Costume Rental Agreement

By accepting this rental agreement, I ("Renter") agree to the following terms and conditions:

## 1. Care of Items
- I will handle all rented costumes with reasonable care
- I will not make any alterations, cuts, or modifications to the costumes
- I will store costumes in a clean, dry environment away from pets and smoke
- I will not attempt to clean or wash costumes myself

## 2. Return Condition
- I will return all items in the same condition as received
- I will report any damage or stains immediately
- I understand that normal wear is expected, but excessive damage will incur additional charges

## 3. Due Date & Late Fees
- I will return all items on or before the agreed due date
- Late returns may incur additional daily rental fees
- I will contact the shop if I need to extend my rental period

## 4. Loss or Damage
- I am responsible for the full replacement cost of any lost items
- Damage beyond normal wear will be assessed and charged accordingly
- I understand that some items are irreplaceable vintage or custom pieces

## 5. Deposit
- I understand that my deposit will be returned upon satisfactory return of all items
- Deposit may be partially or fully retained to cover damages, cleaning, or late fees

## 6. Liability
- I accept full responsibility for all rented items from pickup until return
- I understand that the rental shop is not liable for any injuries or damages resulting from costume use

## 7. Agreement
By signing below, I confirm that I have read, understood, and agree to abide by all terms of this rental agreement.`;

export function RentalAgreementEditor({ initialText }: RentalAgreementEditorProps) {
  const [text, setText] = useState(initialText || "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/settings/agreement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save agreement");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset to the default agreement template? Your custom changes will be lost.")) {
      setText(DEFAULT_AGREEMENT);
    }
  };

  const handleClear = () => {
    if (confirm("Remove the rental agreement? Customers will not see an agreement when renting.")) {
      setText("");
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          Rental Agreement
        </CardTitle>
        <CardDescription className="text-zinc-500">
          Customize the agreement customers must accept when renting costumes. Supports Markdown formatting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md">
            {error}
          </div>
        )}

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="bg-zinc-800 border border-zinc-700">
            <TabsTrigger value="edit" className="data-[state=active]:bg-zinc-700">
              <FileText className="w-4 h-4 mr-2" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-zinc-700">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="mt-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your rental agreement text here. Markdown formatting is supported."
              className="min-h-[400px] bg-zinc-800 border-zinc-700 text-zinc-100 font-mono text-sm"
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="min-h-[400px] p-4 bg-zinc-800 border border-zinc-700 rounded-md overflow-auto">
              {text ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <MarkdownPreview text={text} />
                </div>
              ) : (
                <p className="text-zinc-500 italic">No agreement text. Customers will not see an agreement.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="border-zinc-700 text-zinc-400"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Use Default
            </Button>
            {text && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-zinc-500 hover:text-red-400"
              >
                Clear
              </Button>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4 mr-2 text-green-400" />
            ) : null}
            {saved ? "Saved!" : "Save Agreement"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple markdown preview (basic formatting)
function MarkdownPreview({ text }: { text: string }) {
  // Convert basic markdown to HTML
  const html = text
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    // Paragraphs
    .split('\n\n')
    .map(p => p.startsWith('<') ? p : `<p>${p}</p>`)
    .join('\n');

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
