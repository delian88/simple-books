"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getSystemSettings, updateSystemSettings, uploadLogo } from "@/lib/admin.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Upload } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, string>>({
    appName: "KoboBooks",
    appLogo: "",
    appTagline: "",
    subscriptionCurrency: "NGN",
    subscriptionPrice: "10",
    subscriptionPriceYearly: "100",
    smtpEnabled: "false",
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPass: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const res = await getSystemSettings();
      return res;
    }
  });

  useEffect(() => {
    if (data && !isLoading) {
      setFormData(data);
    }
  }, [data, isLoading]);

  const updateMutation = useMutation({
    mutationFn: async (updatedData: Record<string, string>) => {
      return await updateSystemSettings({ data: updatedData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast.success("Settings updated successfully");
    },
    onError: () => {
      toast.error("Failed to update settings");
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return await uploadLogo(file);
    },
    onSuccess: (res) => {
      setFormData(prev => ({ ...prev, appLogo: res.url }));
      toast.success("Logo uploaded successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to upload logo");
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  return (
    <AppShell 
      title="System Settings" 
      subtitle="Configure global application settings and integrations."
      actions={
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      }
    >
      <div className="mt-6">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="smtp">SMTP & Email</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card className="shadow-sm border-border">
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Configure the application name, logo, and basic details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="appName">Application Name</Label>
                      <Input 
                        id="appName" 
                        value={formData.appName || ''} 
                        onChange={(e) => handleChange('appName', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appTagline">Tagline</Label>
                      <Input 
                        id="appTagline" 
                        value={formData.appTagline || ''} 
                        onChange={(e) => handleChange('appTagline', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="appLogo">Application Logo</Label>
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        {formData.appLogo && (
                          <div className="h-16 w-16 border rounded-md overflow-hidden bg-white flex items-center justify-center shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={formData.appLogo} alt="Logo" className="max-h-full max-w-full object-contain" />
                          </div>
                        )}
                        <div className="flex-1 space-y-2 w-full">
                          <div className="flex items-center gap-2">
                            <Input 
                              id="appLogoFile" 
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              disabled={uploadMutation.isPending}
                              className="max-w-[250px]"
                            />
                            {uploadMutation.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                          </div>
                          <Input 
                            id="appLogo" 
                            placeholder="Or enter image URL (https://...)"
                            value={formData.appLogo || ''} 
                            onChange={(e) => handleChange('appLogo', e.target.value)} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscriptions">
              <Card className="shadow-sm border-border">
                <CardHeader>
                  <CardTitle>Subscription Pricing</CardTitle>
                  <CardDescription>Set the currency and pricing for premium plans.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subscriptionCurrency">Currency</Label>
                      <Input 
                        id="subscriptionCurrency" 
                        value={formData.subscriptionCurrency || ''} 
                        onChange={(e) => handleChange('subscriptionCurrency', e.target.value)} 
                        placeholder="e.g. NGN, USD"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subscriptionPrice">Monthly Price</Label>
                      <Input 
                        id="subscriptionPrice" 
                        type="number"
                        value={formData.subscriptionPrice || ''} 
                        onChange={(e) => handleChange('subscriptionPrice', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subscriptionPriceYearly">Yearly Price</Label>
                      <Input 
                        id="subscriptionPriceYearly" 
                        type="number"
                        value={formData.subscriptionPriceYearly || ''} 
                        onChange={(e) => handleChange('subscriptionPriceYearly', e.target.value)} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="smtp">
              <Card className="shadow-sm border-border">
                <CardHeader>
                  <CardTitle>SMTP Settings</CardTitle>
                  <CardDescription>Configure outgoing email server for notifications and password resets.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch 
                      id="smtpEnabled" 
                      checked={formData.smtpEnabled === 'true'} 
                      onCheckedChange={(c) => handleChange('smtpEnabled', c ? 'true' : 'false')} 
                    />
                    <Label htmlFor="smtpEnabled">Enable SMTP Email</Label>
                  </div>
                  
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${formData.smtpEnabled !== 'true' ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input 
                        id="smtpHost" 
                        value={formData.smtpHost || ''} 
                        onChange={(e) => handleChange('smtpHost', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input 
                        id="smtpPort" 
                        value={formData.smtpPort || ''} 
                        onChange={(e) => handleChange('smtpPort', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpUser">SMTP User</Label>
                      <Input 
                        id="smtpUser" 
                        value={formData.smtpUser || ''} 
                        onChange={(e) => handleChange('smtpUser', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="smtpPass">SMTP Password</Label>
                      <Input 
                        id="smtpPass" 
                        type="password"
                        value={formData.smtpPass || ''} 
                        onChange={(e) => handleChange('smtpPass', e.target.value)} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}
