import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return null;
  }

  const organization = await db.organization.findUnique({
    where: { id: session.user.organizationId },
    include: {
      users: {
        orderBy: { createdAt: "asc" },
      },
      categories: {
        orderBy: { name: "asc" },
      },
    },
  });

  if (!organization) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
        <p className="text-zinc-400">Manage your organization settings</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Organization Info */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Organization</CardTitle>
            <CardDescription className="text-zinc-500">
              Your organization details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-zinc-500">Name</p>
              <p className="text-zinc-200">{organization.name}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Slug</p>
              <p className="text-zinc-200">{organization.slug}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Created</p>
              <p className="text-zinc-200">
                {new Date(organization.createdAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Team Members</CardTitle>
            <CardDescription className="text-zinc-500">
              People with access to this organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {organization.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                >
                  <div>
                    <p className="text-zinc-200 font-medium">{user.name}</p>
                    <p className="text-zinc-500 text-sm">{user.email}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      user.role === "OWNER"
                        ? "bg-purple-600/20 text-purple-400 border-purple-600/30"
                        : user.role === "ADMIN"
                        ? "bg-blue-600/20 text-blue-400 border-blue-600/30"
                        : "bg-zinc-600/20 text-zinc-400 border-zinc-600/30"
                    }
                  >
                    {user.role.toLowerCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-zinc-100">Categories</CardTitle>
            <CardDescription className="text-zinc-500">
              Costume categories for organizing your inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {organization.categories.map((category) => (
                <Badge
                  key={category.id}
                  variant="outline"
                  className="bg-zinc-800 border-zinc-700"
                  style={{ borderColor: category.color || undefined }}
                >
                  <span
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: category.color || "#71717a" }}
                  />
                  {category.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
