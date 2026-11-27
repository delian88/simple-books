"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listRecords, runPayroll, money } from "@/lib/modules.functions";
import { PlayCircle, CheckCircle2 } from "lucide-react";

export default function PayrollPage() {
  const qc = useQueryClient();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [success, setSuccess] = useState("");

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ["pb_records", "payroll_run"],
    queryFn: () => listRecords("payroll_run"),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["pb_records", "employee"],
    queryFn: () => listRecords("employee"),
  });

  const activeEmployees = employees.filter((e: any) => (e.status ?? "ACTIVE") === "ACTIVE");

  const totalMonthlyPayroll = activeEmployees.reduce((sum: number, e: any) => {
    const basic = Number(e.basic_salary || 0);
    const allow = Number(e.allowances || 0);
    const ded = Number(e.deductions || 0);
    return sum + Math.max(0, basic + allow - ded);
  }, 0);

  const runMutation = useMutation({
    mutationFn: () =>
      runPayroll({
        month,
        payment_date: payDate,
        notes: `Salary disbursement for ${month}`,
      }),
    onSuccess: (res: any) => {
      setSuccess(`Payroll run ${res.reference} completed for ${res.count} staff! Total: ${money(res.total_net)}`);
      qc.invalidateQueries({ queryKey: ["pb_records", "payroll_run"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (err: any) => {
      alert(err.message || "Failed to run payroll");
    },
  });

  return (
    <AppShell
      title="Manage Payroll"
      subtitle="Process monthly staff salaries, track payslip breakdowns, and disburse payments."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* KPI: Active Staff */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Active Staff on Payroll</CardDescription>
            <CardTitle className="text-3xl font-display">{activeEmployees.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Eligible for salary processing</p>
          </CardContent>
        </Card>

        {/* KPI: Estimated Monthly Obligation */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Estimated Monthly Obligation</CardDescription>
            <CardTitle className="text-3xl font-display text-emerald-700">{money(totalMonthlyPayroll)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Basic + Allowances - Deductions</p>
          </CardContent>
        </Card>

        {/* Action: Run Payroll */}
        <Card className="shadow-sm border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Run Payroll</CardTitle>
            <CardDescription>Generate salary lines and post to accounting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Period</Label>
                <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Pay Date</Label>
                <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
              </div>
            </div>
            <Button
              className="w-full bg-[#0B3D2B] text-white hover:bg-[#145C42] flex items-center justify-center gap-2"
              disabled={runMutation.isPending || activeEmployees.length === 0}
              onClick={() => runMutation.mutate()}
            >
              <PlayCircle className="h-4 w-4" />
              {runMutation.isPending ? "Processing..." : `Process Payroll (${money(totalMonthlyPayroll)})`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 text-emerald-700 text-sm rounded-lg flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {success}
        </div>
      )}

      {/* Payroll History */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Payroll Runs History</CardTitle>
          <CardDescription>History of completed payroll disbursements</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Disbursement Date</TableHead>
                <TableHead>Staff Count</TableHead>
                <TableHead className="text-right">Total Basic</TableHead>
                <TableHead className="text-right">Total Net Paid</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No payroll runs yet. Click &quot;Process Payroll&quot; above to disburse your first run.
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs font-semibold">{r.reference || r.number}</TableCell>
                    <TableCell className="font-medium">{r.month}</TableCell>
                    <TableCell>{r.payment_date}</TableCell>
                    <TableCell>{r.employee_count || (r.items || []).length} staff</TableCell>
                    <TableCell className="text-right">{money(r.total_basic || 0)}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-700">{money(r.total_net || 0)}</TableCell>
                    <TableCell>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded-full font-medium">
                        {r.status || "COMPLETED"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
