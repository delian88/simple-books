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

export const listPages = () => apiGet('/api/cms.php?action=listPages');

export const getPage = ({ queryKey }: any) => {
  const [_key, id] = queryKey;
  return apiGet(`/api/cms.php?action=getPage&id=${id}`);
};

export const getPageBySlug = async (slug: string) => {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/cms.php?action=getPageBySlug&slug=${slug}`);
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    // API unreachable (e.g. build time / CI)
    return null;
  }
};

export const savePage = ({ data }: { data: any }) =>
  apiPost('/api/cms.php?action=savePage', data);

export const deletePage = ({ data }: { data: { id: string } }) =>
  apiPost('/api/cms.php?action=deletePage', data);
