"use client";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { getLandingPageConfig, updateLandingPageConfig, LandingPageConfig } from "@/lib/cms.functions";
import { toast } from "sonner";

export default function CmsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<LandingPageConfig>({
    hero_title: "",
    hero_subtitle: "",
    features: [],
    contact_email: ""
  });

  const { data: config, isLoading } = useQuery({
    queryKey: ["cms-config"],
    queryFn: getLandingPageConfig,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        hero_title: config.hero_title || "",
        hero_subtitle: config.hero_subtitle || "",
        features: Array.isArray(config.features) ? config.features : [],
        contact_email: config.contact_email || ""
      });
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: (data: LandingPageConfig) => updateLandingPageConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms-config"] });
      toast.success("Landing page configuration updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update configuration");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, { title: "", description: "" }]
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, field: "title" | "description", value: string) => {
    setFormData(prev => {
      const newFeatures = [...prev.features];
      newFeatures[index] = { ...newFeatures[index], [field]: value };
      return { ...prev, features: newFeatures };
    });
  };

  if (isLoading) {
    return (
      <AppShell title="Content Management" subtitle="Manage your public landing page content.">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell 
      title="Content Management" 
      subtitle="Manage your public landing page content."
    >
      <form onSubmit={handleSubmit} className="mt-6 space-y-6 max-w-4xl">
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
            <CardDescription>Main headline and text shown at the top of the landing page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hero_title">Hero Title</Label>
              <Input 
                id="hero_title" 
                value={formData.hero_title}
                onChange={(e) => setFormData({...formData, hero_title: e.target.value})}
                placeholder="e.g. Simple Accounting for Small Businesses"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
              <Textarea 
                id="hero_subtitle" 
                value={formData.hero_subtitle}
                onChange={(e) => setFormData({...formData, hero_subtitle: e.target.value})}
                placeholder="e.g. Manage your finances effortlessly..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Features</CardTitle>
              <CardDescription>List the key features of your business.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addFeature}>
              <Plus className="mr-2 h-4 w-4" />
              Add Feature
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.features.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                No features added yet. Click "Add Feature" to create one.
              </div>
            ) : (
              formData.features.map((feature, index) => (
                <div key={index} className="flex gap-4 items-start p-4 border rounded-lg bg-muted/20">
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label>Feature Title</Label>
                      <Input 
                        value={feature.title}
                        onChange={(e) => updateFeature(index, 'title', e.target.value)}
                        placeholder="e.g. Invoice Generation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        value={feature.description}
                        onChange={(e) => updateFeature(index, 'description', e.target.value)}
                        placeholder="Briefly describe this feature..."
                        rows={2}
                      />
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="text-destructive mt-8" onClick={() => removeFeature(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>How customers can reach out to you.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input 
                id="contact_email" 
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                placeholder="e.g. support@company.com"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
