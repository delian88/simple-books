import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ScanLine } from "lucide-react";
import { toast } from "sonner";
import { scanReceipt } from "@/lib/accounting.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TxnCategory } from "@/lib/accounting";
import type { EntryDraft } from "@/components/EntryForm";

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

export function ReceiptScanner({ onExtracted }: { onExtracted: (patch: Partial<EntryDraft>) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scan = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 6_000_000) throw new Error("That image is too large — keep it under 6MB.");
      const imageDataUrl = await readAsDataUrl(file);
      setPreview(imageDataUrl);
      return scanReceipt({ data: { imageDataUrl } });
    },
    onSuccess: (result) => {
      onExtracted({
        category: result.category as TxnCategory,
        amount: result.amount ? String(result.amount) : "",
        occurred_on: result.date || new Date().toISOString().slice(0, 10),
        counterparty: result.vendor,
        note: result.description,
        source: "receipt_scan",
      });
      toast.success("Receipt read — check the details before saving.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-xl">
          <ScanLine className="h-5 w-5 text-accent" />
          Scan a receipt
        </CardTitle>
        <CardDescription>
          Snap or upload a third-party receipt. The details are read automatically and filled into the form.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="receipt">Receipt image</Label>
          <Input
            id="receipt"
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            disabled={scan.isPending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) scan.mutate(file);
            }}
          />
        </div>

        {scan.isPending ? <p className="text-sm text-muted-foreground">Reading the receipt…</p> : null}

        {preview ? (
          <div className="overflow-hidden rounded-md border border-border">
            <img src={preview} alt="Scanned receipt preview" className="max-h-64 w-full object-contain bg-secondary" />
          </div>
        ) : null}

        {preview ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPreview(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            Clear image
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
