"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Plus } from "lucide-react";
import { listJournalEntries } from "@/lib/accounting.functions";
import { JournalEntryDialog } from "@/components/JournalEntryDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LedgerPage() {
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["journal_entries"],
    queryFn: async () => {
      const res = await listJournalEntries();
      return Array.isArray(res) ? res : [];
    }
  });

  return (
    <AppShell title="General Ledger" subtitle="View all journal entries and accounting records." actions={<JournalEntryDialog />}>
      <Card className="shadow-sm border-border w-full mt-6">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative mb-6"><div className="absolute inset-0 -m-4 bg-muted/50 rounded-full animate-pulse-slow"></div><div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-background border shadow-sm"><BookOpen className="h-10 w-10 text-muted-foreground/50" /></div></div>
              <h3 className="text-lg font-bold font-display">No journal entries found</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-[250px]">Your general ledger is currently empty.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry: any) => (
                  <TableRow 
                    key={entry.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{entry.reference || "-"}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {entry.status || "POSTED"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Journal Entry Details Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Journal Entry Details</DialogTitle>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Date</div>
                  <div>{new Date(selectedEntry.date).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Reference</div>
                  <div>{selectedEntry.reference || "-"}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground">Description</div>
                <div>{selectedEntry.description}</div>
              </div>

              <div className="mt-4 border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedEntry.lines?.map((line: any) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.account?.name || line.accountId}</TableCell>
                        <TableCell className="text-right">
                          {line.debit > 0 ? Number(line.debit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {line.credit > 0 ? Number(line.credit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-medium bg-muted/20">
                      <TableCell className="text-right">Total</TableCell>
                      <TableCell className="text-right">
                        {selectedEntry.lines?.reduce((sum: number, l: any) => sum + Number(l.debit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        {selectedEntry.lines?.reduce((sum: number, l: any) => sum + Number(l.credit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
