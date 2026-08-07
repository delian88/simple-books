import { createFileRoute } from '@tanstack/react-router'
import { createFileRoute } from "@tanstack/react-start";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { processReceiptBase64, saveAIExpense, listExpenses, processVoiceExpense } from "@/lib/ai.functions";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UploadCloud, Bot, Loader2, Sparkles, FileText, Calendar, Plus, X, Mic, AlertTriangle } from "lucide-react";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/expenses")({
  component: ExpensesPage,
});

function ExpensesPage() {
  const getExpenses = useServerFn(listExpenses);
  const doUpload = useServerFn(processReceiptBase64);
  const doVoice = useServerFn(processVoiceExpense);
  const doSave = useServerFn(saveAIExpense);
  const qc = useQueryClient();

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState("");
  
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
      toast.success("Expense saved successfully!");
      setUploadModalOpen(false);
      setParsedData(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save expense.");
    }
  });

  const handleVoiceEntry = () => {
    // Check for browser support
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
      setUploadProgress(`Heard: "${text}"... Analyzing with AI...`);
      
      try {
        const result = await doVoice({ data: { text } });
        setParsedData(result);
        toast.success("Voice parsed successfully!");
      } catch (err: any) {
        toast.error("Failed to parse voice entry.");
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
    setUploadProgress("Reading image using Tesseract OCR...");
    setParsedData(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setUploadProgress("Analyzing text with Pollinations AI...");
        const result = await doUpload({ data: { base64Data: base64, mimeType: file.type, filename: file.name } });
        setParsedData(result);
        setIsUploading(false);
        toast.success("Receipt parsed successfully!");
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message || "Failed to process receipt");
      setIsUploading(false);
    }
    
    // Clear input
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
      category: parsedData.category
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
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-semibold text-gray-600">Date</TableHead>
                <TableHead className="font-semibold text-gray-600">Vendor</TableHead>
                <TableHead className="font-semibold text-gray-600">Category</TableHead>
                <TableHead className="text-right font-semibold text-gray-600">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-300 mx-auto mb-2" />
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center">
                    <Bot className="h-8 w-8 mx-auto text-emerald-200 mb-3" />
                    <p className="text-sm font-medium text-gray-500">No expenses yet</p>
                    <p className="text-xs text-gray-400 mt-0.5">Click "Smart Upload" to scan your first receipt</p>
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense: any) => (
                  <TableRow key={expense.id} className={`hover:bg-gray-50/60 ${expense.isFlagged ? "bg-red-50/30" : ""}`}>
                    <TableCell className="text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(expense.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-800">
                      <div className="flex items-center gap-2">
                        {expense.vendor}
                        {expense.isFlagged && (
                          <span title={expense.flagReason} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 cursor-help">
                            <AlertTriangle className="h-3 w-3" /> FLAGGED
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                        {expense.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-800 tabular-nums">
                      ₦{Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Upload Modal */}
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
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-emerald-800 flex items-start gap-2 mb-4">
                    <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                    <p>Our AI extracted the following details. Please review and edit if necessary before saving.</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Vendor Name</Label>
                      <Input
                        value={parsedData.vendor}
                        onChange={(e) => setParsedData({ ...parsedData, vendor: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={parsedData.date}
                          onChange={(e) => setParsedData({ ...parsedData, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={parsedData.amount}
                          onChange={(e) => setParsedData({ ...parsedData, amount: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Predicted Category</Label>
                      <Input
                        value={parsedData.category}
                        onChange={(e) => setParsedData({ ...parsedData, category: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setParsedData(null)}
                      disabled={saveMutation.isPending}
                    >
                      Scan Another
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                    >
                      {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Expense"}
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
