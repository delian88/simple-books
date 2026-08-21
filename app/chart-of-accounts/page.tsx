"use client";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Layers, Plus } from "lucide-react";
import { listAccounts } from "@/lib/accounting.functions";
import { AccountFormDialog } from "@/components/AccountFormDialog";

export default function ChartOfAccountsPage() {
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await listAccounts();
      return Array.isArray(res) ? res : [];
    }
  });

  return (
    <AppShell title="Chart of Accounts" subtitle="Manage your account categories and balances." actions={<AccountFormDialog />}>
      <Card className="shadow-sm border-border w-full mt-6">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative mb-6"><div className="absolute inset-0 -m-4 bg-muted/50 rounded-full animate-pulse-slow"></div><div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-background border shadow-sm"><Layers className="h-10 w-10 text-muted-foreground/50" /></div></div>
              <h3 className="text-lg font-bold font-display">No accounts found</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-[250px]">Your chart of accounts is currently empty.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sub Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((acc: any) => (
                  <TableRow key={acc.id}>
                    <TableCell className="font-medium">{acc.code}</TableCell>
                    <TableCell>{acc.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {acc.type}
                      </span>
                    </TableCell>
                    <TableCell>{acc.sub_type || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
