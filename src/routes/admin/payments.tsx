import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listGateways, upsertGateway } from "@/lib/payments.functions";
import { AppShell } from "@/components/AppShell";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/admin/payments")({
  component: PaymentsDashboard,
});

const GATEWAYS = ["budpay", "paystack", "flutterwave", "monnify", "korapay"];

function PaymentsDashboard() {
  const queryClient = useQueryClient();
  const { data: gateways, isLoading } = useQuery({
    queryKey: ["payment_gateways"],
    queryFn: () => listGateways(),
  });

  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (gateways) {
      const state: Record<string, any> = {};
      GATEWAYS.forEach(g => {
        const found = gateways.find(x => x.provider === g);
        state[g] = {
          publicKey: found?.publicKey || "",
          secretKey: found?.secretKey || "",
          isActive: found?.isActive || false,
          isDefault: found?.isDefault || false,
        };
      });
      setFormData(state);
    }
  }, [gateways]);

  const mutation = useMutation({
    mutationFn: (data: any) => upsertGateway({ data }),
    onSuccess: () => {
      toast.success("Gateway saved");
      queryClient.invalidateQueries({ queryKey: ["payment_gateways"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = (provider: string) => {
    mutation.mutate({
      provider,
      publicKey: formData[provider].publicKey,
      secretKey: formData[provider].secretKey,
      isActive: formData[provider].isActive,
      isDefault: formData[provider].isDefault,
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <AppShell title="Payment Gateways">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Gateways</h1>
          <p className="text-muted-foreground">Integrate African payment gateways for subscriptions.</p>
        </div>

        <div className="grid gap-6">
          {GATEWAYS.map((provider) => (
            <Card key={provider}>
              <CardHeader>
                <CardTitle className="capitalize">{provider}</CardTitle>
                <CardDescription>Configure credentials for {provider}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData[provider]?.isActive}
                      onCheckedChange={(c) => setFormData({ ...formData, [provider]: { ...formData[provider], isActive: c } })}
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData[provider]?.isDefault}
                      onCheckedChange={(c) => {
                        // If setting to default, unset others locally
                        const next = { ...formData, [provider]: { ...formData[provider], isDefault: c } };
                        if (c) {
                          GATEWAYS.forEach(g => {
                            if (g !== provider) next[g].isDefault = false;
                          });
                        }
                        setFormData(next);
                      }}
                    />
                    <Label>Default Gateway</Label>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <div className="grid gap-2">
                    <Label>Public Key</Label>
                    <Input
                      value={formData[provider]?.publicKey || ""}
                      onChange={e => setFormData({ ...formData, [provider]: { ...formData[provider], publicKey: e.target.value } })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Secret Key</Label>
                    <Input
                      type="password"
                      value={formData[provider]?.secretKey || ""}
                      onChange={e => setFormData({ ...formData, [provider]: { ...formData[provider], secretKey: e.target.value } })}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave(provider)} disabled={mutation.isPending}>
                  Save {provider} Configuration
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
