"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  Theater,
  Calendar,
  MapPin,
  User,
  ClipboardList,
  Plus,
  Shirt,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface Rental {
  id: string;
  status: string;
  checkoutDate: string;
  dueDate: string;
  returnDate: string | null;
  customer: {
    id: string;
    name: string;
  };
  items: {
    id: string;
    costumeItem: {
      id: string;
      name: string;
    };
  }[];
}

interface ProductionProps {
  production: {
    id: string;
    name: string;
    venue: string | null;
    director: string | null;
    startDate: string | null;
    endDate: string | null;
    notes: string | null;
    rentals: Rental[];
  };
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-600/20 text-green-400 border-green-600/30",
  RETURNED: "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",
  OVERDUE: "bg-red-600/20 text-red-400 border-red-600/30",
  CANCELLED: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
};

export function ProductionDetail({ production }: ProductionProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(production.name);
  const [venue, setVenue] = useState(production.venue || "");
  const [director, setDirector] = useState(production.director || "");
  const [startDate, setStartDate] = useState(
    production.startDate ? production.startDate.split("T")[0] : ""
  );
  const [endDate, setEndDate] = useState(
    production.endDate ? production.endDate.split("T")[0] : ""
  );
  const [notes, setNotes] = useState(production.notes || "");

  const now = new Date();

  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/productions/${production.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          venue: venue || null,
          director: director || null,
          startDate: startDate || null,
          endDate: endDate || null,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update production");
      }

      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/productions/${production.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete production");
      }

      router.push("/productions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  function cancelEdit() {
    setName(production.name);
    setVenue(production.venue || "");
    setDirector(production.director || "");
    setStartDate(production.startDate ? production.startDate.split("T")[0] : "");
    setEndDate(production.endDate ? production.endDate.split("T")[0] : "");
    setNotes(production.notes || "");
    setEditing(false);
    setError(null);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-zinc-400 hover:text-zinc-100">
            <Link href="/productions">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-zinc-100">{production.name}</h1>
            <p className="text-sm text-zinc-400">Production details and rentals</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <>
              <Button
                asChild
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Link href={`/productions/${production.id}/costume-plot`}>
                  <Shirt className="w-4 h-4 mr-2" />
                  Costume Plot
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="border-zinc-700 text-zinc-300"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleting(true)}
                className="border-red-800 text-red-400 hover:bg-red-950"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md">
          {error}
        </div>
      )}

      {/* Production Details Card */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Theater className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-zinc-100">Production Details</CardTitle>
              <CardDescription className="text-zinc-500">
                Information about this production
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300">Production Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="venue" className="text-zinc-300">Venue</Label>
                  <Input
                    id="venue"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="director" className="text-zinc-300">Director</Label>
                  <Input
                    id="director"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-zinc-300">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-zinc-300">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-zinc-300">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                  className="border-zinc-700 text-zinc-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading || !name.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {production.venue && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <MapPin className="w-4 h-4 text-zinc-500" />
                    <span>{production.venue}</span>
                  </div>
                )}
                {production.director && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <User className="w-4 h-4 text-zinc-500" />
                    <span>{production.director}</span>
                  </div>
                )}
              </div>

              {(production.startDate || production.endDate) && (
                <div className="flex items-center gap-2 text-zinc-300">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <span>
                    {production.startDate && format(new Date(production.startDate), "MMMM d, yyyy")}
                    {production.startDate && production.endDate && " – "}
                    {production.endDate && format(new Date(production.endDate), "MMMM d, yyyy")}
                  </span>
                </div>
              )}

              {production.notes && (
                <div className="pt-2 border-t border-zinc-800">
                  <p className="text-sm text-zinc-400 whitespace-pre-wrap">{production.notes}</p>
                </div>
              )}

              {!production.venue && !production.director && !production.startDate && !production.notes && (
                <p className="text-zinc-500 text-sm">No additional details</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rentals for this Production */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <ClipboardList className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-zinc-100">Associated Rentals</CardTitle>
                <CardDescription className="text-zinc-500">
                  {production.rentals.length} rental{production.rentals.length !== 1 ? "s" : ""} for this production
                </CardDescription>
              </div>
            </div>
            <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Link href={`/rentals/new?productionId=${production.id}`}>
                <Plus className="w-4 h-4 mr-2" />
                New Rental
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {production.rentals.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              No rentals associated with this production yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Customer</TableHead>
                  <TableHead className="text-zinc-400">Items</TableHead>
                  <TableHead className="text-zinc-400">Checkout</TableHead>
                  <TableHead className="text-zinc-400">Due Date</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {production.rentals.map((rental) => {
                  const isOverdue = rental.status === "ACTIVE" && new Date(rental.dueDate) < now;
                  const displayStatus = isOverdue ? "OVERDUE" : rental.status;
                  const daysOverdue = isOverdue ? differenceInDays(now, new Date(rental.dueDate)) : 0;

                  return (
                    <TableRow key={rental.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell>
                        <Link href={`/rentals/${rental.id}`} className="font-medium text-zinc-200 hover:text-purple-400">
                          {rental.customer.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {rental.items.length} item{rental.items.length !== 1 ? "s" : ""}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {format(new Date(rental.checkoutDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {format(new Date(rental.dueDate), "MMM d, yyyy")}
                        {daysOverdue > 0 && (
                          <span className="text-red-400 text-xs ml-2">
                            ({daysOverdue}d overdue)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[displayStatus]}>
                          {displayStatus.toLowerCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Delete Production</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete &quot;{production.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {production.rentals.length > 0 && (
            <div className="p-3 text-sm text-yellow-400 bg-yellow-950/50 border border-yellow-900 rounded-md">
              This production has {production.rentals.length} associated rental{production.rentals.length !== 1 ? "s" : ""}.
              You must remove all rentals before deleting.
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleting(false)}
              className="border-zinc-700 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || production.rentals.length > 0}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Production"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
