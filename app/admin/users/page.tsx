"use client";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { listUsers } from "@/lib/users.functions";
import { Users, Mail, Shield, UserCircle2 } from "lucide-react";

export default function UsersPage() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await listUsers();
      return Array.isArray(res) ? res : [];
    }
  });

  return (
    <AppShell 
      title="User Management" 
      subtitle="Manage your team members, their roles, and access levels."
    >
      <div className="mt-6">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : users.length === 0 ? (
          <Card className="shadow-sm border-border w-full">
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 -m-4 bg-muted/50 rounded-full animate-pulse-slow"></div>
                  <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-background border shadow-sm">
                    <Users className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                </div>
                <h3 className="text-xl font-bold font-display">No Users Found</h3>
                <p className="mt-2 text-muted-foreground max-w-[300px]">There are no users associated with this company yet.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>System Role</TableHead>
                    <TableHead>Company Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <UserCircle2 className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.email.split('@')[0]}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize flex w-fit items-center gap-1">
                          {user.role === 'admin' && <Shield className="h-3 w-3" />}
                          {user.role || 'user'}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {user.company_role}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className={user.status === 'active' ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 capitalize" : "capitalize"}>
                          {user.status || 'unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
