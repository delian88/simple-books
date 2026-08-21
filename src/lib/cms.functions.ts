import { apiGet, apiPost } from "@/lib/api";

export interface LandingPageConfig {
  hero_title: string;
  hero_subtitle: string;
  features: { title: string; description: string }[];
  contact_email: string;
}

export const getLandingPageConfig = () => 
  apiGet<LandingPageConfig>('/api/cms.php?action=getConfig');

export const updateLandingPageConfig = (data: LandingPageConfig) => 
  apiPost('/api/cms.php?action=updateConfig', data);
