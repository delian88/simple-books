import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSystemSettings, updateSystemSettings } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin_settings"],
    queryFn: () => getSystemSettings(),
  });

  const [formData, setFormData] = useState({
    appName: "",
    appLogo: "",
    subscriptionCurrency: "NGN",
    subscriptionPrice: "",
    subscriptionPriceYearly: "",
    smtpEnabled: false,
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPass: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        appName: settings.appName || "KoboBooks",
        appLogo: settings.appLogo || "",
        subscriptionCurrency: settings.subscriptionCurrency || "NGN",
        subscriptionPrice: settings.subscriptionPrice || "10",
        subscriptionPriceYearly: settings.subscriptionPriceYearly || "100",
        smtpEnabled: settings.smtpEnabled === "true",
        smtpHost: settings.smtpHost || "",
        smtpPort: settings.smtpPort || "587",
        smtpUser: settings.smtpUser || "",
        smtpPass: settings.smtpPass || "",
      });
    }
  }, [settings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: check file size, e.g. max 1MB
    if (file.size > 1024 * 1024) {
      toast.error("File is too large. Please upload an image smaller than 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        setFormData(prev => ({ ...prev, appLogo: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const mutation = useMutation({
    mutationFn: (data: Record<string, string>) => updateSystemSettings({ data }),
    onSuccess: () => {
      toast.success("Settings updated");
      queryClient.invalidateQueries({ queryKey: ["admin_settings"] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-muted-foreground">Configure global application settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Application Identity</CardTitle>
            <CardDescription>Set the name and logo of the application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="appName">Application Name</Label>
              <Input
                id="appName"
                value={formData.appName}
                onChange={e => setFormData({ ...formData, appName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="appLogo">Application Logo URL (or Upload)</Label>
              <div className="flex gap-2">
                <Input
                  id="appLogo"
                  value={formData.appLogo}
                  placeholder="https://example.com/logo.png"
                  onChange={e => setFormData({ ...formData, appLogo: e.target.value })}
                  className="flex-1"
                />
                <Label htmlFor="logoUpload" className="cursor-pointer">
                  <div className="flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    Upload
                  </div>
                </Label>
                <input 
                  id="logoUpload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleLogoUpload} 
                />
              </div>
              {formData.appLogo && (
                <div className="mt-2">
                  <img src={formData.appLogo} alt="Logo Preview" className="h-12 w-12 object-contain rounded border" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Pricing</CardTitle>
            <CardDescription>Set the subscription base currency and prices applied after the 14-day trial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="currency">Base Currency</Label>
              <select 
                id="currency"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.subscriptionCurrency}
                onChange={e => setFormData({ ...formData, subscriptionCurrency: e.target.value })}
              >
                <option value="NGN">Naira (₦)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
                <option value="GHS">Ghana Cedi (GH₵)</option>
                <option value="KES">Kenyan Shilling (KSh)</option>
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="priceMonthly">Monthly Price</Label>
                <Input
                  id="priceMonthly"
                  type="number"
                  value={formData.subscriptionPrice}
                  onChange={e => setFormData({ ...formData, subscriptionPrice: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priceYearly">Yearly Price</Label>
                <Input
                  id="priceYearly"
                  type="number"
                  value={formData.subscriptionPriceYearly}
                  onChange={e => setFormData({ ...formData, subscriptionPriceYearly: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SMTP Configuration</CardTitle>
            <CardDescription>Configure the email server for sending transactional emails.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="smtp-enabled"
                checked={formData.smtpEnabled}
                onCheckedChange={checked => setFormData({ ...formData, smtpEnabled: checked })}
              />
              <Label htmlFor="smtp-enabled">Enable SMTP Emails</Label>
            </div>

            {formData.smtpEnabled && (
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="host">SMTP Host</Label>
                  <Input id="host" value={formData.smtpHost} onChange={e => setFormData({ ...formData, smtpHost: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="port">SMTP Port</Label>
                  <Input id="port" value={formData.smtpPort} onChange={e => setFormData({ ...formData, smtpPort: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user">SMTP User</Label>
                  <Input id="user" value={formData.smtpUser} onChange={e => setFormData({ ...formData, smtpUser: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pass">SMTP Password</Label>
                  <Input id="pass" type="password" value={formData.smtpPass} onChange={e => setFormData({ ...formData, smtpPass: e.target.value })} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={() => {
            const dataToSave = {
              appName: formData.appName,
              appLogo: formData.appLogo,
              subscriptionCurrency: formData.subscriptionCurrency,
              subscriptionPrice: formData.subscriptionPrice,
              subscriptionPriceYearly: formData.subscriptionPriceYearly,
              smtpEnabled: String(formData.smtpEnabled),
              smtpHost: formData.smtpHost,
              smtpPort: formData.smtpPort,
              smtpUser: formData.smtpUser,
              smtpPass: formData.smtpPass,
            };
            mutation.mutate(dataToSave);
          }}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </AppShell>
  );
}
