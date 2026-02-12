"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Loader2, Copy, Check, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface InviteCode {
  id: string;
  code: string;
  description: string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  createdBy: string | null;
}

export default function InviteCodesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null);

  // Form state
  const [newCode, setNewCode] = useState("");
  const [description, setDescription] = useState("");
  const [maxUses, setMaxUses] = useState("");

  const fetchCodes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/invite-codes");
      if (res.status === 403) {
        setError("You don't have permission to access this page");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch codes");
      const data = await res.json();
      setCodes(data);
    } catch {
      setError("Failed to load invite codes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/admin/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.toUpperCase(),
          description: description || undefined,
          maxUses: maxUses ? parseInt(maxUses) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create code");
      }

      setNewCode("");
      setDescription("");
      setMaxUses("");
      setCreateOpen(false);
      fetchCodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create code");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(code: InviteCode) {
    try {
      const res = await fetch(`/api/admin/invite-codes/${code.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !code.isActive }),
      });

      if (!res.ok) throw new Error("Failed to update code");
      fetchCodes();
    } catch {
      setError("Failed to update code");
    }
  }

  function handleDelete(id: string) {
    setCodeToDelete(id);
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!codeToDelete) return;

    setDeleteConfirmOpen(false);
    setDeleting(codeToDelete);
    try {
      const res = await fetch(`/api/admin/invite-codes/${codeToDelete}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete code");
      fetchCodes();
    } catch {
      setError("Failed to delete code");
    } finally {
      setDeleting(null);
      setCodeToDelete(null);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error === "You don't have permission to access this page") {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">Access Denied</h2>
          <p className="text-zinc-400">
            You need system administrator privileges to access this page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-zinc-100">Invite Codes</h1>
          <p className="text-sm text-zinc-400">
            Manage registration invite codes for new organizations
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              New Code
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Create Invite Code</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Create a new code that allows users to register new organizations.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-zinc-300">Code</Label>
                  <Input
                    id="code"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="BETAUSER2025"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 uppercase"
                    required
                    minLength={4}
                    maxLength={32}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-zinc-300">
                    Description (optional)
                  </Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Beta tester invite code"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxUses" className="text-zinc-300">
                    Max Uses (optional)
                  </Label>
                  <Input
                    id="maxUses"
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="Leave empty for unlimited"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                    min={1}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  className="border-zinc-700 text-zinc-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Code"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && error !== "You don't have permission to access this page" && (
        <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md">
          {error}
        </div>
      )}

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Active Codes</CardTitle>
          <CardDescription className="text-zinc-500">
            {codes.length} invite code{codes.length !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              No invite codes created yet. Create one to allow new registrations.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Code</TableHead>
                    <TableHead className="text-zinc-400">Description</TableHead>
                    <TableHead className="text-zinc-400">Usage</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Created</TableHead>
                    <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((code) => (
                    <TableRow key={code.id} className="border-zinc-800">
                      <TableCell className="font-mono text-zinc-100">
                        <div className="flex items-center gap-2">
                          {code.code}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
                            onClick={() => copyCode(code.code)}
                          >
                            {copiedCode === code.code ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {code.description || "-"}
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        {code.usedCount}
                        {code.maxUses !== null ? ` / ${code.maxUses}` : " (unlimited)"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            code.isActive
                              ? "bg-green-600/20 text-green-400 border-green-600/30 cursor-pointer"
                              : "bg-zinc-600/20 text-zinc-400 border-zinc-600/30 cursor-pointer"
                          }
                          onClick={() => handleToggleActive(code)}
                        >
                          {code.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-sm">
                        {format(new Date(code.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDelete(code.id)}
                          disabled={deleting === code.id}
                        >
                          {deleting === code.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title="Delete invite code?"
        description="Are you sure you want to delete this invite code? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
