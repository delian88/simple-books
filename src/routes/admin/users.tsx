import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listUsers, listActivities } from "@/lib/users.functions";
import { AppShell } from "@/components/AppShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/users")({
  component: UsersDashboard,
});

function UsersDashboard() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin_users"],
    queryFn: () => listUsers(),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <AppShell title="Users Management">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage users and view their activities.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.profile?.businessName || "N/A"}</TableCell>
                    <TableCell>{user.subscriptionStatus || "N/A"}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <ActivityDialog userId={user.id} email={user.email} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function ActivityDialog({ userId, email }: { userId: string, email: string }) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["admin_activities", userId],
    queryFn: () => listActivities({ data: { userId } }),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">View Activity</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Activity Log: {email}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">No activity found.</TableCell>
                </TableRow>
              )}
              {activities?.map(act => (
                <TableRow key={act.id}>
                  <TableCell className="font-medium">{act.action}</TableCell>
                  <TableCell>{act.description}</TableCell>
                  <TableCell>{new Date(act.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
