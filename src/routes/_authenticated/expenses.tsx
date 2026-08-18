import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  processReceiptBase64, 
  saveAIExpense, 
  listExpenses, 
  processVoiceExpense, 
  deleteAIExpense, 
  getExpenseDocument 
} from "@/lib/ai.functions";
import { listAccounts } from "@/lib/accounts.functions";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  UploadCloud, 
  Bot, 
  Loader2, 
  Sparkles, 
  FileText, 
  Calendar, 
  X, 
  Mic, 
  AlertTriangle,
  Eye,
  Trash2,
  CheckCircle2,
  Image as ImageIcon,
  ExternalLink,
  ShieldAlert,
  Info
} from "lucide-react";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";

export const Route = createFileRoute("/_authenticated/expenses")({
  component: ExpensesPage,
});

function ExpensesPage() {
  const getExpenses = useServerFn(listExpenses);
  const doUpload = useServerFn(processReceiptBase64);
  const doVoice = useServerFn(processVoiceExpense);
  const doSave = useServerFn(saveAIExpense);
  const doDelete = useServerFn(deleteAIExpense);
  const fetchDocument = useServerFn(getExpenseDocument);
  const qc = useQueryClient();
  const { addNotification } = useNotifications();

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState("");
  const [selectedBankId, setSelectedBankId] = useState<string>("");

  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: listAccounts,
  });
  
  const bankAccounts = (accountsQuery.data || [])
    .filter((a: any) => a.type === "ASSET")
    .map((a: any) => ({
      value: a.id,
      label: `${a.code ? a.code + ' - ' : ''}${a.name}`
    }));

  const expenseAccounts = (accountsQuery.data || [])
    .filter((a: any) => a.type === "EXPENSE")
    .map((a: any) => ({
      value: a.id,
      label: `${a.code ? a.code + ' - ' : ''}${a.name}`
    }));
  
  // Full details viewer state
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => getExpenses(),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await doSave({ data });
      if (res.isFlagged) {
        toast.warning(res.flagReason, { duration: 8000 });
      }
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["money-out"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Expense updated successfully!");
      addNotification({ type: "success", title: "💸 Expense saved", body: "Receipt expense updated and recorded." });
      setUploadModalOpen(false);
      setSelectedExpense(null);
      setParsedData(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save expense.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return doDelete({ data: { id } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["money-out"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Expense deleted successfully");
      addNotification({ type: "info", title: "🗑️ Expense deleted", body: "Receipt expense removed from records." });
      setSelectedExpense(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete expense");
    }
  });

  const openDetailsModal = async (expense: any) => {
    setSelectedExpense(expense);
    setDocPreviewUrl(null);

    if (expense.documentId || expense.document?.id) {
      const docId = expense.documentId || expense.document.id;
      setIsLoadingDoc(true);
      try {
        const docRes = await fetchDocument({ data: { documentId: docId } });
        setDocPreviewUrl(docRes.dataUrl);
      } catch (err) {
        console.error("Could not load receipt image:", err);
      } finally {
        setIsLoadingDoc(false);
      }
    }
  };

  const handleVoiceEntry = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice entry is not supported in your browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setUploadModalOpen(true);
      setParsedData(null);
      setUploadProgress("Listening... Speak your expense clearly.");
    };

    recognition.onresult = async (event: any) => {
      setIsRecording(false);
      const text = event.results[0][0].transcript;
      setIsUploading(true);
      setUploadProgress(`Heard: "${text}"... Detecting transaction details...`);
      
      try {
        const result = await doVoice({ data: { text } });
        setUploadProgress("Recording transaction automatically...");
        
        // Try to find a matching account based on category name
        const matchedAccount = expenseAccounts.find((a: any) => 
          a.label.toLowerCase().includes((result.category || '').toLowerCase())
        );
        const accountId = result.accountId || matchedAccount?.value || expenseAccounts[0]?.value;

        const saveRes = await doSave({
          data: {
            vendor: result.vendor,
            amount: Number(result.amount),
            date: new Date(result.date),
            accountId: accountId,
            bankAccountId: selectedBankId || bankAccounts[0]?.value,
            description: `Voice note: "${text}"`
          }
        });
        qc.invalidateQueries({ queryKey: ["expenses"] });
        qc.invalidateQueries({ queryKey: ["money-out"] });
        qc.invalidateQueries({ queryKey: ["transactions"] });
        if (saveRes.isFlagged) {
          toast.warning(`Auto-recorded with flag: ${saveRes.flagReason}`, { duration: 8000 });
          addNotification({ type: "warning", title: "⚠️ Receipt flagged", body: `${result.vendor} — ${saveRes.flagReason}` });
        } else {
          toast.success(`Transaction detected & recorded: ${result.vendor} (₦${Number(result.amount).toLocaleString()})`);
          addNotification({ type: "success", title: "🎤 Voice expense recorded", body: `${result.vendor} — ₦${Number(result.amount).toLocaleString()}` });
        }
        setParsedData({ ...result, description: `Voice note: "${text}"`, recorded: true, expenseId: saveRes.expenseId });
      } catch (err: any) {
        toast.error("Failed to process voice entry.");
      } finally {
        setIsUploading(false);
      }
    };

    recognition.onerror = (event: any) => {
      setIsRecording(false);
      toast.error("Voice recognition failed: " + event.error);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPG, PNG).");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Reading receipt image with OCR...");
    setParsedData(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target?.result as string;
          setUploadProgress("Detecting transaction details with AI...");
          const result = await doUpload({ data: { base64Data: base64, mimeType: file.type, filename: file.name } });
          
          setUploadProgress("Recording transaction automatically...");
          const saveRes = await doSave({
            data: {
              documentId: result.documentId,
              vendor: result.vendor,
              amount: Number(result.amount),
              date: new Date(result.date || new Date().toISOString().split('T')[0]),
              accountId: result.accountId || expenseAccounts[0]?.value,
              bankAccountId: selectedBankId || bankAccounts[0]?.value,
              description: result.description || `Scanned receipt: ${file.name}`
            }
          });

          qc.invalidateQueries({ queryKey: ["expenses"] });
          qc.invalidateQueries({ queryKey: ["money-out"] });
          qc.invalidateQueries({ queryKey: ["transactions"] });

          if (saveRes.isFlagged) {
            toast.warning(`Recorded with flag: ${saveRes.flagReason}`, { duration: 8000 });
          } else {
            toast.success(`Transaction detected & recorded: ${result.vendor} (₦${Number(result.amount).toLocaleString()})`);
          }

          setParsedData({ ...result, recorded: true, expenseId: saveRes.expenseId });
        } catch (err: any) {
          toast.error(err.message || "Failed to process receipt");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message || "Failed to process receipt");
      setIsUploading(false);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    if (!parsedData) return;
    saveMutation.mutate({
      documentId: parsedData.documentId,
      vendor: parsedData.vendor,
      amount: Number(parsedData.amount),
      date: new Date(parsedData.date),
      category: parsedData.category,
      description: parsedData.description
    });
  };

  const handleUpdateSelected = () => {
    if (!selectedExpense) return;
    saveMutation.mutate({
      id: selectedExpense.id,
      vendor: selectedExpense.vendor,
      amount: Number(selectedExpense.amount),
      date: new Date(selectedExpense.date),
      category: selectedExpense.category,
      description: selectedExpense.description
    });
  };

  return (
    <AppShell
      title="Expenses (AI Powered)"
      subtitle="Smart expense tracking with OCR, Voice, and Fraud Detection"
      actions={
        <div className="flex gap-2">
          <Button onClick={handleVoiceEntry} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-2">
            <Mic className={`h-4 w-4 ${isRecording ? "animate-pulse text-red-500" : ""}`} /> Voice Entry
          </Button>
          <Button onClick={() => setUploadModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm gap-2 text-white">
            <Sparkles className="h-4 w-4" /> Smart Upload
          </Button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500">
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow className="border-b border-gray-200">
                <TableHead className="font-semibold text-gray-700">Date</TableHead>
                <TableHead className="font-semibold text-gray-700">Vendor & Details</TableHead>
                <TableHead className="font-semibold text-gray-700">Category</TableHead>
                <TableHead className="font-semibold text-gray-700">Source</TableHead>
                <TableHead className="font-semibold text-gray-700">Audit & Fraud Status</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Amount</TableHead>
                <TableHead className="text-center font-semibold text-gray-700 w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Loading transactions...</p>
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-44 text-center">
                    <Bot className="h-9 w-9 mx-auto text-emerald-300 mb-2" />
                    <p className="text-sm font-semibold text-gray-700">No expenses recorded yet</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Smart Upload" to scan a receipt or "Voice Entry" to speak your expense</p>
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense: any) => (
                  <TableRow 
                    key={expense.id} 
                    className={`hover:bg-emerald-50/40 transition-colors cursor-pointer ${expense.isFlagged ? "bg-red-50/30" : ""}`}
                    onClick={() => openDetailsModal(expense)}
                  >
                    <TableCell className="text-xs font-medium text-gray-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {new Date(expense.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </TableCell>
                    
                    <TableCell className="font-medium text-gray-900">
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          {expense.vendor}
                        </div>
                        {expense.description ? (
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{expense.description}</p>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic mt-0.5">Scanned receipt entry</p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                        {expense.category || "General"}
                      </span>
                    </TableCell>

                    <TableCell>
                      {expense.documentId || expense.document ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-medium">
                          <ImageIcon className="h-3 w-3 text-emerald-600" /> OCR Receipt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-medium">
                          <Mic className="h-3 w-3 text-blue-600" /> Voice Entry
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {expense.isFlagged ? (
                        <span title={expense.flagReason} className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" /> FLAGGED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-emerald-100/70 text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Verified
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right font-bold text-gray-900 tabular-nums">
                      ₦{Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>

                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-emerald-700 hover:bg-emerald-100/60"
                          onClick={() => openDetailsModal(expense)}
                          title="View Full Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete expense for "${expense.vendor}"?`)) {
                              deleteMutation.mutate(expense.id);
                            }
                          }}
                          title="Delete Expense"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Full Details Modal */}
        <Dialog open={!!selectedExpense} onOpenChange={(v) => !v && setSelectedExpense(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedExpense && (
              <>
                <DialogHeader className="border-b pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {selectedExpense.vendor}
                      </DialogTitle>
                      <DialogDescription className="text-sm text-gray-500 mt-1">
                        Recorded on {new Date(selectedExpense.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </DialogDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-emerald-700 tabular-nums">
                        ₦{Number(selectedExpense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {selectedExpense.category}
                      </span>
                    </div>
                  </div>
                </DialogHeader>

                <div className="py-4 space-y-6">
                  {/* Fraud / Anomaly Banner */}
                  {selectedExpense.isFlagged ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900">
                      <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm text-amber-900">Fraud Detection Alert</p>
                        <p className="text-xs text-amber-800 mt-0.5">{selectedExpense.flagReason}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-2.5 text-emerald-800">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      <p className="text-xs font-medium">Transaction verified and logged into general ledger without anomalies.</p>
                    </div>
                  )}

                  {/* Transaction Metadata Grid */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</Label>
                      <Input
                        className="mt-1 bg-white"
                        value={selectedExpense.vendor}
                        onChange={(e) => setSelectedExpense({ ...selectedExpense, vendor: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</Label>
                      <Input
                        type="date"
                        className="mt-1 bg-white"
                        value={selectedExpense.date ? selectedExpense.date.split("T")[0] : ""}
                        onChange={(e) => setSelectedExpense({ ...selectedExpense, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount (₦)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="mt-1 bg-white"
                        value={selectedExpense.amount}
                        onChange={(e) => setSelectedExpense({ ...selectedExpense, amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</Label>
                      <Input
                        className="mt-1 bg-white"
                        value={selectedExpense.category}
                        onChange={(e) => setSelectedExpense({ ...selectedExpense, category: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description & Item Notes</Label>
                      <Textarea
                        rows={2}
                        className="mt-1 bg-white"
                        value={selectedExpense.description || ""}
                        placeholder="Add items or note..."
                        onChange={(e) => setSelectedExpense({ ...selectedExpense, description: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Receipt Preview Section */}
                  {(selectedExpense.documentId || selectedExpense.document) && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="h-4 w-4 text-emerald-600" /> Attached Receipt Image
                      </Label>

                      {isLoadingDoc ? (
                        <div className="h-48 border border-dashed rounded-xl flex items-center justify-center bg-gray-50 text-gray-400">
                          <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mr-2" /> Loading receipt scan...
                        </div>
                      ) : docPreviewUrl ? (
                        <div className="border rounded-xl overflow-hidden bg-gray-900 max-h-80 flex justify-center items-center relative group">
                          <img 
                            src={docPreviewUrl} 
                            alt="Receipt Scan" 
                            className="max-h-80 object-contain" 
                          />
                          <a 
                            href={docPreviewUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white p-2 rounded-lg text-xs flex items-center gap-1 opacity-90 transition-opacity"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Open Full Image
                          </a>
                        </div>
                      ) : (
                        <div className="p-4 border rounded-xl bg-gray-50 text-xs text-gray-500">
                          Receipt image attached ({selectedExpense.document?.filename || "receipt"})
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this expense?")) {
                          deleteMutation.mutate(selectedExpense.id);
                        }
                      }}
                      disabled={deleteMutation.isPending || saveMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" /> Delete Expense
                    </Button>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setSelectedExpense(null)}>
                        Cancel
                      </Button>
                      <Button 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                        onClick={handleUpdateSelected}
                        disabled={saveMutation.isPending}
                      >
                        {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Upload Scan Modal */}
        <Dialog open={uploadModalOpen} onOpenChange={(v) => !v && setUploadModalOpen(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  Smart Scan Receipt
                </DialogTitle>
                <button onClick={() => setUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </DialogHeader>

            <div className="p-4 space-y-6">
              {!parsedData && !isUploading && (
                <div className="space-y-6">
                  {bankAccounts.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-gray-700 font-medium">Pay from Bank Account</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedBankId}
                        onChange={(e) => setSelectedBankId(e.target.value)}
                      >
                        <option value="">Select a bank account...</option>
                        {bankAccounts.map((b: any) => (
                          <option key={b.value} value={b.value}>{b.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-xl p-8 text-center cursor-pointer hover:bg-emerald-50 transition-colors"
                  >
                    <UploadCloud className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                    <p className="text-sm font-medium text-emerald-800 mb-1">Click to upload receipt</p>
                    <p className="text-xs text-emerald-600/70">JPG, PNG up to 5MB</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="py-12 text-center space-y-4">
                  <div className="relative h-16 w-16 mx-auto">
                    <Loader2 className="h-16 w-16 animate-spin text-emerald-500" />
                    <Bot className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-700" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 animate-pulse">{uploadProgress}</p>
                    <p className="text-xs text-gray-500 mt-1">This usually takes about 10-15 seconds.</p>
                  </div>
                </div>
              )}

              {parsedData && !isUploading && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-900 flex items-start gap-2.5 mb-4 shadow-sm">
                    <Sparkles className="h-5 w-5 mt-0.5 shrink-0 text-emerald-600 animate-pulse" />
                    <div>
                      <p className="font-semibold text-emerald-900">
                        Transaction Automatically Recorded!
                      </p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Our AI detected the details from your receipt and recorded it directly into your ledger.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-gray-700 font-medium">Vendor Name</Label>
                      <Input
                        value={parsedData.vendor}
                        onChange={(e) => setParsedData({ ...parsedData, vendor: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-gray-700 font-medium">Date</Label>
                        <Input
                          type="date"
                          value={parsedData.date}
                          onChange={(e) => setParsedData({ ...parsedData, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-gray-700 font-medium">Amount (₦)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={parsedData.amount}
                          onChange={(e) => setParsedData({ ...parsedData, amount: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-gray-700 font-medium">Expense Account</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={parsedData.accountId || ""}
                        onChange={(e) => setParsedData({ ...parsedData, accountId: e.target.value })}
                      >
                        <option value="">Select an expense account...</option>
                        {expenseAccounts.map((a: any) => (
                          <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-gray-700 font-medium">Description</Label>
                      <Textarea
                        rows={2}
                        value={parsedData.description || ""}
                        onChange={(e) => setParsedData({ ...parsedData, description: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-300 hover:bg-gray-50"
                      onClick={() => setParsedData(null)}
                      disabled={saveMutation.isPending}
                    >
                      Scan Another Receipt
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        handleSave();
                        setUploadModalOpen(false);
                      }}
                      disabled={saveMutation.isPending}
                    >
                      {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Done"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
